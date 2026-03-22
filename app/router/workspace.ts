import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { z } from "zod"
import { base } from "../middlewares/base"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import { workspaceSchema } from "../schemas/workspace"
import { Organizations, init } from "@kinde/management-api-js"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"

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
  .use(requiredWorkspaceMiddleware)
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
      user: z.custom<KindeUser<Record<string, unknown>>>(),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
    }),
  )
  .handler(async ({ context, errors }) => {
    const { getUserOrganizations } = getKindeServerSession()

    const organizations = await getUserOrganizations()

    if (!organizations) {
      throw errors.FORBIDDEN()
    }

    return {
      workspaces: organizations?.orgs.map((org) => ({
        id: org.code,
        name: org.name ?? "My Workspace",
        avatar: org.name?.charAt(0) ?? "M",
      })),
      user: context.user,
      currentWorkspace: context.workspace,
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
  .use(requiredWorkspaceMiddleware)
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
    init()

    //Creating org
    let data

    try {
      data = await Organizations.createOrganization({
        requestBody: {
          name: input.name,
        },
      })
    } catch {
      throw errors.FORBIDDEN()
    }

    //adding user to org who created it and is gonna be admin of org
    if (!data.organization?.code) {
      throw errors.FORBIDDEN({
        message: "Org code is not defined",
      })
    }

    try {
      await Organizations.addOrganizationUsers({
        orgCode: data.organization.code,
        requestBody: {
          users: [
            {
              id: context.user.id,
              roles: ["admin"],
            },
          ],
        },
      })
    } catch {
      throw errors.FORBIDDEN()
    }

    //refresh the accesss token
    //refresh the accesss token
    const { refreshTokens } = getKindeServerSession()
    try {
      await refreshTokens()
    } catch (error) {
      console.error("Failed to refresh tokens:", error)
    }

    return {
      orgCode: data.organization.code,
      workspaceName: input.name,
    }
  })
