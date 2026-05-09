import prisma from "@/lib/db"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"
import { sendEmailVerificationEmail } from "../emails/send-email-verification"
import { sendPasswordResetEmail } from "../emails/send-password-reset-email"
// import { checkout, portal, polar } from "@polar-sh/better-auth"
// import { polarClient } from "./polar"
import { sendOrganizationInviteEmail } from "../emails/organization-invite-email"
import { splitUserName } from "../onboarding/split-user-name"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      family_name: {
        type: "string",
        required: false,
      },
      given_name: {
        type: "string",
        required: false,
      },
      picture: {
        type: "string",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    // autoSignIn: true, //automatically sign in when user registers
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log("SET RESET PASSWORD")
      console.log({ user, url })

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
    // polar({
    //   client: polarClient,
    //   createCustomerOnSignUp: true,
    //   use: [
    //     checkout({
    //       products: [
    //         {
    //           productId: "dc317ca4-c483-41f3-b2b9-9a2733ea0a42", // ID of Product from Polar Dashboard
    //           slug: "pro", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
    //         },
    //       ],
    //       successUrl: process.env.POLAR_SUCCESS_URL,
    //       authenticatedUsersOnly: true, //only authenticated better auth users can initiate checkouts
    //     }),
    //     portal(),
    //   ],
    // }),

    // polar({
    //   client: polarClient,
    //   createCustomerOnSignUp: true,
    //   use: [
    //     checkout({
    //       products: [
    //         {
    //           productId: "dc317ca4-c483-41f3-b2b9-9a2733ea0a42", // ID of Product from Polar Dashboard
    //           slug: "pro",
    //         },
    //       ],
    //       successUrl: process.env.POLAR_SUCCESS_URL,
    //       authenticatedUsersOnly: true,
    //     }),
    //     portal(),
    //   ],
    // }),

    organization({
      sendInvitationEmail: async ({
        email,
        organization,
        inviter,
        invitation,
      }) => {
        console.log("Send invitaiton email called: ", { email }, { inviter })
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
    //every time session is created means(everytime you login),
    // before that adding specific information(activeOrganizaitonId is set) to the user session
    // session: {
    //   create: {
    //     before: async (userSession) => {
    //       // console.log(userSession)
    //       //Give me the latest organization this user joined, and only tell me its organization ID.
    //       // const membership = await db.query.member.findFirst({
    //       //   where: eq(member.userId, userSession.userId),
    //       //   orderBy: desc(member.createdAt),
    //       //   columns: { organizationId: true },
    //       // })

    //       return {
    //         data: {
    //           ...userSession,
    //           // activeOrganizationId: user,
    //         },
    //       }
    //     },
    //   },
    // },

    user: {
      create: {
        before: async (user) => {
          console.log("User:  ", user)
          const { given_name, family_name } = splitUserName(user.name)

          return {
            data: {
              ...user,
              family_name,
              given_name,
              picture: user?.image ?? "",
            },
          }
        },
      },
    },
  },
})
