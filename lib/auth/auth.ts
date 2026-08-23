import prisma from "@/lib/db"
import { polar, webhooks } from "@polar-sh/better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { anonymous, organization } from "better-auth/plugins"
import { sendEmailVerificationEmail } from "../emails/send-email-verification"
import { sendPasswordResetEmail } from "../emails/send-password-reset-email"
import { sendOrganizationInviteEmail } from "../emails/organization-invite-email"
import { polarClient } from "../billing/polar.gateway"
import { betterAuth } from "better-auth"
import {
  shouldSyncBillingForPolarWebhook,
  getPolarWebhookEventID,
} from "../billing/polar-webhooks"
import { markPolarWebhookProcessed } from "../billing/polar-webhooks.repository"
import { syncWorkspaceBillingFromPolar } from "../billing/billing-sync.service"

// Guest (recruiter) sessions get a much shorter lifetime than regular
// sessions so unattended guest access expires quickly on its own.
const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 4 // 4 hours

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractWorkspaceId(payload: any): string | null {
  return (
    payload?.data?.externalCustomerId ??
    payload?.data?.customer?.externalId ??
    payload?.data?.metadata?.workspaceId ??
    payload?.data?.metadata?.organizationId ??
    null
  )
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    // autoSignIn: true, //automatically sign in when user registers
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // console.log("SET RESET PASSWORD")
      // console.log({ user, url })

      await sendPasswordResetEmail({ user, link: `${new URL(url)}` })
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    //user signUp -> ask for verification
    sendOnSignUp: true,
    expiresIn: 60 * 5,

    sendVerificationEmail: async ({ user, url }) => {
      const link = new URL(url)

      // link.searchParams.set("callbackURL", "/verify")

      await sendEmailVerificationEmail({
        user,
        link: String(link),
      })
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  plugins: [
    polar({
      client: polarClient,
      use: [
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onPayload: async (payload) => {
            // console.log("HHHHHHHHHHHHHHHHHHHH")
            // console.log({ payload })
            if (!shouldSyncBillingForPolarWebhook(payload)) {
              return
            }

            console.log("should Sync billing passed")

            const workspaceId = extractWorkspaceId(payload)

            if (!workspaceId) {
              return
            }

            // console.log("Organization PRESENT")
            const eventId = getPolarWebhookEventID(payload)
            // console.log("onPayload eventId", eventId)

            if (eventId) {
              /**
                The purpose is to avoid running this twice for the same webhook retry:

                processed === true: 
                This webhook event was not seen before.
                We saved it into polar_webhook_event.
                Continue syncing billing.

                processed === false: 
                This webhook event was already saved before.
                It is a duplicate retry from Polar.
                return early: Stop and do nothing.
            */
              const processed = await markPolarWebhookProcessed({
                id: eventId,
                type: payload.type,
                payload,
              })

              if (!processed) return
            }

            await syncWorkspaceBillingFromPolar(workspaceId)
          },
        }),
      ],
    }),

    anonymous({
      emailDomainName: "guest.teamflow.internal",
      generateName: () => "Guest User",
    }),

    organization({
      sendInvitationEmail: async ({
        email,
        organization,
        inviter,
        invitation,
      }) => {
        //console.log("Send invitaiton email called: ", { email }, { inviter })
        const inviteLink = `${process.env.BETTER_AUTH_URL}/invites/${invitation.id}`
        await sendOrganizationInviteEmail({
          inviter: inviter.user,
          organization,
          email,
          inviteLink,
        })
      },
    }),
  ],

  databaseHooks: {
    session: {
      create: {
        // Guest accounts (better-auth's anonymous plugin) should not inherit
        // the regular session lifetime. Force a short expiry so a recruiter's
        // guest access can't linger for days if they forget to sign out.
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isAnonymous: true },
          })

          if (!user?.isAnonymous) return

          return {
            data: {
              expiresAt: new Date(
                Date.now() + GUEST_SESSION_MAX_AGE_SECONDS * 1000,
              ),
            },
          }
        },
      },
      update: {
        // better-auth's sliding-session refresh (triggered on every
        // getSession call) would otherwise reset a guest session back to
        // the full default session lifetime the moment it's used. Clamp
        // refreshed guest sessions to a hard cap measured from creation,
        // so guest access always expires on schedule regardless of activity.
        before: async (session, context) => {
          const currentSession = (
            context as {
              context?: {
                session?: {
                  user?: { isAnonymous?: boolean }
                  session?: { createdAt: Date }
                }
              }
            } | null
          )?.context?.session

          if (!currentSession?.user?.isAnonymous || !session.expiresAt) return

          const hardCap = new Date(
            new Date(currentSession.session!.createdAt).getTime() +
              GUEST_SESSION_MAX_AGE_SECONDS * 1000,
          )

          if (new Date(session.expiresAt) <= hardCap) return

          return { data: { expiresAt: hardCap } }
        },
      },
    },
  },
})
