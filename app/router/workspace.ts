import { auth } from "@/lib/auth/auth"
import { z } from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { getWorkspaceForSession } from "../middlewares/workspace"
import { appUserSchema } from "../schemas/user"
import { appWorkspaceSchema, workspaceSchema } from "../schemas/workspace"

//This file defines what happens when the route is called
//This file will stores all procedures for workspace category.

const toWorkspaceSlug = (name: string) =>
  `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`

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
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
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
      currentWorkspace: appWorkspaceSchema.nullable(),
    }),
  )
  .handler(async ({ context }) => {
    const headers = new Headers(context.request.headers as HeadersInit)

    const session = await auth.api.getSession({ headers })
    //console.log(session)
    const organizations = await auth.api.listOrganizations({
      headers,
    })

    // console.log("WORKSPACE PROCEDURE: ", organizations)

    const currentWorkspace = session
      ? await getWorkspaceForSession(session)
      : null

    // console.log("CurrentWorkspace", currentWorkspace)

    return {
      workspaces: organizations.map((org) => ({
        id: org.id,
        name: org.name ?? "My workspace",
        avatar: org.name?.charAt(0)?.toUpperCase() ?? "M",
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
        body: {
          name: input.name,
          slug: toWorkspaceSlug(input.name),
          userId: context.user.id,
        },
        headers: new Headers(context.request.headers as HeadersInit),
      })

      if (!organization?.id) {
        throw errors.INTERNAL_SERVER_ERROR({
          message: "Organization id is not defined",
        })
      }

      await auth.api.setActiveOrganization({
        body: {
          organizationId: organization.id,
        },
        headers: new Headers(context.request.headers as HeadersInit),
      })

      return {
        orgCode: organization.id,
        workspaceName: organization.name,
      }
    } catch (error) {
      console.error("Failed to create organizaiton: ", error)
      throw errors.FORBIDDEN({
        message: "Unable to create workspace",
      })
    }
  })

export const selectWorkspace = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/select",
    summary: "Set active workspace",
    tags: ["workspace"],
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(z.object({ workspaceId: z.string() }))
  .handler(async ({ context, input }) => {
    await auth.api.setActiveOrganization({
      body: {
        organizationId: input.workspaceId,
      },

      headers: new Headers(context.request.headers as HeadersInit),
    })

    return {
      workspaceId: input.workspaceId,
    }
  })
