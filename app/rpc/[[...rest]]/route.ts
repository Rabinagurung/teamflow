/** An adapter is the bridge that converts framework-specific HTTP requests into oRPC procedure calls
 * and converts their results back into framework-compatible responses.
 *
 * This file is the bridge between Next.js HTTP and oRPC procedures.
 *
 * - import RPCHandler("@orpc/server/fetch): the Fetch adapter (because Next.js App Router uses Fetch Request/Response)
 * - import router("@/app/router") : oRPC router object (the list of procedures)
 *
 *  */
import { RPCHandler } from "@orpc/server/fetch"
import { onError } from "@orpc/server"
import { router } from "@/app/router"

/**  This creates the “server” that can:
 * read incoming request
 * match to procedure
 * run middleware + handler
 * produce a response
 */
const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/rpc", //“treat URLs starting with /rpc as oRPC routes”
    context: {
      request,
    }, //initial context object available to procedures as context / ctx
  })

  return response ?? new Response("Not found", { status: 404 })
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest

/** Next  Client:
 * This OPRC client is not optimized for SSR and it will be way slower in SSR environment
 * that means environment where you fetch data on the server side.
 * This is problem for us cox we want to fetch the workspace data on server side and list of our chaneels in server side.
 * Optimized SSR environment is required or OPRC must be optimized for server environment.
 *
 * So, orpc.ts and orpc.server.ts files are added (app/lib/)
 * If we are in client side evironment then client-side client in orpc.ts will be used
 * and if we are in server side env then server-side client in orpc.server.ts will be used.
 */

/** Next step: complete workspace procedures (@/router/workspaces)
 *
 *  get current user and current workspace.
 *  workspace route is only available to authenticated users (authenticated users always have a user object
 *  and they are locked into a workspace)
 *  In listWorkspaces procedure,
 * .output(user: dont know the type of user, so KindUser is passed,
 *  currentWorkspace: dont know the type of currrentOrg, KindOrganization is passed )
 *
 *  user: z.custom<KindeUser<Record<string, unknown>>>(),
 *  currentWorkspace: z.custom<KindeOrganization<unknown>>(),
 */
