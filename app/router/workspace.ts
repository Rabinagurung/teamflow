import { z } from "zod"
import { base } from "../middlewares/base"
import { requiredAuthMiddleware } from "../middlewares/auth"
import {
  getWorkspaceForSession,
  requiredWorkspaceMiddleware,
} from "../middlewares/workspace"
import { workspaceSchema } from "../schemas/workspace"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import prisma from "@/lib/db"
import { auth } from "@/lib/auth"

const currentWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  orgCode: z.string(),
  orgName: z.string(),
})

const appUserSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string(),
  emailVerified: z.boolean(),
  name: z.string(),
  image: z.string().nullable(),
  family_name: z.string().nullable(),
  given_name: z.string().nullable(),
  picture: z.string().nullable(),
})

const toWorkspaceSlug = (name: string) =>
  `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`

//This file defines what happens when the route is called
//This file will stores all procedures for workspace category.

//Procedures are like actions like: getWorkspaces, createWorkspace are two procedures

// os is like builder function to create procedures then chain .route(invoked and structured) then, following are passed:
//  method: to get data,
//  path: '/workspace' (route created in base router file(router/index.ts))
//  summary: explains what procedure does,
//  tags: ???
//  chain.input: is what user will pass(since fetching data to getWorkspaces so void and user will not pass input)
//  chain.output: is what the handler will return.
//  In handler,  query logic will be written and what we fetched is returned
//  So, the shape returned from handler will be passed into .output.
// chain .handler: destructure params , get input and log the input and make the fun async
export const listWorkspaces = base
  .use(requiredAuthMiddleware)
  .route({
    //This binds the procedure to HTTP, GET /workspace (under the prefix /rpc → /rpc/workspace)
    method: "GET",
    path: "/workspace",
    summary: "list all workspaces",
    tags: ["workspace"],
  })
  .input(z.void())
  .output(
    z.object({
      workspaces: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          avatar: z.string(),
        }),
      ),
      user: appUserSchema,
      currentWorkspace: currentWorkspaceSchema.nullable(),
    }),
  )
  .handler(async ({ context }) => {
    const [memberships, session] = await Promise.all([
      prisma.member.findMany({
        where: {
          userId: context.user.id,
        },
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      auth.api.getSession({
        headers: new Headers(context.request.headers as HeadersInit),
      }),
    ])

    const currentWorkspace = session
      ? await getWorkspaceForSession(session)
      : null

    return {
      workspaces: memberships.map(({ organization }) => ({
        id: organization.id,
        name: organization.name,
        avatar: organization.name.charAt(0) || "M",
      })),
      user: context.user,
      currentWorkspace,
    }
  })

/** Kinde provides two hooks:
 * getKindeServerSession(): exposes functions that only run on server side
 * useKindeBrowserClient():  exposes functions that only run on client side
 *
 * With ORPC, middlewares can be created and user logic can be centralized in one file and can be used in all procedures.
 * In our case, user needs to be authenticated for all procedures cox every procedure requires the user
 * to have valid session and to be logged in to a workspace.
 * @/middleware/base.ts created (base middleware[just to there to expose current request])
 * @/router/auth.ts (auth middleware makes sure user is authenticated and returns user session)
 */
export const createWorkspace = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace",
    summary: "Create a new workspace",
    tags: ["workspace"],
  })
  .input(workspaceSchema)
  .output(
    z.object({
      orgCode: z.string(),
      workspaceName: z.string(),
    }),
  )
  .handler(async ({ context, errors, input }) => {
    try {
      const organization = await auth.api.createOrganization({
        headers: new Headers(context.request.headers as HeadersInit),
        body: {
          name: input.name,
          slug: toWorkspaceSlug(input.name),
          userId: context.user.id,
        },
      })

      return {
        orgCode: organization.id,
        workspaceName: organization.name,
      }
    } catch (error) {
      console.error("Failed to create workspace:", error)
      throw errors.FORBIDDEN()
    }
  })
