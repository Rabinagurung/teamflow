import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "@/lib/db"
import { polar, checkout, portal } from "@polar-sh/better-auth"
import { polarClient } from "./polar"
import { organization } from "better-auth/plugins"

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
    autoSignIn: true, //automatically sign in when user registers
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

    organization(),
  ],

  databaseHooks: {
    //every time session is created means(everytime you login),
    // before that adding specific information(activeOrganizaitonId is set) to the user session
    session: {
      create: {
        before: async (userSession) => {
          // console.log(userSession)
          //Give me the latest organization this user joined, and only tell me its organization ID.
          // const membership = await db.query.member.findFirst({
          //   where: eq(member.userId, userSession.userId),
          //   orderBy: desc(member.createdAt),
          //   columns: { organizationId: true },
          // })

          return {
            data: {
              ...userSession,
              // activeOrganizationId: user,
            },
          }
        },
      },
    },

    user: {
      create: {
        before: async (user) => {
          const [given_name, family_name] = user.name.split(" ")

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
