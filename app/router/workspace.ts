import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { getCurrentWorkspace } from "@/lib/workspace/current-workspace.server"
import { z } from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { writeSecurityMiddleware } from "../middlewares/arcjet/write"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import { appUserSchema } from "../schemas/user"
import {
  appWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceMemberRoleSchema,
  workspaceSchema,
} from "../schemas/workspace"
import {
  createWorkspaceWithSetup,
  workspaceCreationResultSchema,
} from "./_shared/workspace"

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
//  chain .handler: destructure params , get input and log the input and make the fun async
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
      currentWorkspaceRole: workspaceMemberRoleSchema.nullable(),
    }),
  )
  .handler(async ({ context }) => {
    const headers = new Headers(context.request.headers as HeadersInit)

    const organizations = await auth.api.listOrganizations({
      headers,
    })

    // console.log("WORKSPACE PROCEDURE: ", organizations)
    const currentWorkspace = await getCurrentWorkspace({ headers })

    const currentWorkspaceMembership = currentWorkspace
      ? await prisma.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: currentWorkspace.id,
              userId: context.user.id,
            },
          },
          select: {
            role: true,
          },
        })
      : null

    const currentWorkspaceRoleResult = currentWorkspaceMembership
      ? workspaceMemberRoleSchema.safeParse(currentWorkspaceMembership.role)
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
      currentWorkspaceRole: currentWorkspaceRoleResult?.success
        ? currentWorkspaceRoleResult.data
        : null,
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
  .output(workspaceCreationResultSchema)
  .handler(async ({ context, errors, input }) => {
    try {
      return await createWorkspaceWithSetup({
        organizationName: input.name,
        userId: context.user.id,
        headers: new Headers(context.request.headers as HeadersInit),
      })
    } catch (error) {
      console.error("Failed to create workspace", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to create workspace",
      })
    }
    // try {
    //   const { organizationId, organizationName } =
    //     await createWorkspaceWithDefaultChannels({
    //       organizationName: input.name,
    //       userId: context.user.id,
    //       headers: new Headers(context.request.headers as HeadersInit),
    //     })

    //   return {
    //     workspaceId: organizationId,
    //     workspaceName: organizationName,
    //   }
    // } catch (error) {
    //   console.error("Failed to create organizaiton: ", error)
    //   throw errors.INTERNAL_SERVER_ERROR({
    //     message: "Unable to create workspace",
    //   })
    // }
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
  .handler(async ({ context, input, errors }) => {
    const headers = new Headers(context.request.headers as HeadersInit)

    const organizations = await auth.api.listOrganizations({
      headers,
    })

    const hasAccess = organizations.some((org) => org.id === input.workspaceId)

    if (!hasAccess) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    await auth.api.setActiveOrganization({
      body: {
        organizationId: input.workspaceId,
      },

      headers,
    })

    return {
      workspaceId: input.workspaceId,
    }
  })

export const editWorkspace = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/udate",
    summary: "Update the workspace",
    tags: ["workspace"],
  })
  .input(updateWorkspaceSchema)
  .output(z.object({ workspaceId: z.string(), workspaceName: z.string() }))
  .handler(async ({ context, input, errors }) => {
    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: context.workspace.id,
          userId: context.user.id,
        },
      },
      select: {
        role: true,
      },
    })

    if (!membership) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    const roleResult = workspaceMemberRoleSchema.safeParse(membership.role)

    if (
      !roleResult.success ||
      (roleResult.data !== "owner" && roleResult.data !== "admin")
    ) {
      throw errors.FORBIDDEN({
        message: "WORKSPACE_ADMIN_REQUIRED",
      })
    }

    try {
      const result = await auth.api.updateOrganization({
        body: {
          organizationId: context.workspace.id,
          data: {
            name: input.newWorkspaceName,
          },
        },
        headers: new Headers(context.request.headers as HeadersInit),
      })

      if (!result?.id) {
        throw new Error("Failed to edit organization")
      }

      return {
        workspaceId: result.id,
        workspaceName: result.name,
      }
    } catch (error) {
      console.error("Failed to create organizaiton: ", error)
      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to create workspace",
      })
    }
  })
