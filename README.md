This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# teamflow

---

---

---

---

---

---

1. middleware.ts: make “URL reflects session org” exact

Current issue

In middleware.ts (line 48), the redirect check is:

if (
url.pathname.startsWith("/workspace") &&
!url.pathname.includes(orgCode || "")
) {
url.pathname = `/workspace/${orgCode}`
return NextResponse.redirect(url)
}
This has three architectural problems.

It uses a substring check, not a route-segment check.
It drops nested paths like /workspace/a/channel/123 and redirects to /workspace/b.
If orgCode is missing, includes("") is always true, so the logic silently no-ops.
Why this is a real bug

Substring matching is too weak for route identity.

Examples:

session org = abc
URL = /workspace/abc-old
pathname.includes("abc") === true
middleware incorrectly decides the URL is already correct
Another example:

session org = abc
URL = /workspace/wrong/channel/abc
pathname.includes("abc") === true
middleware incorrectly skips correction because the channel id or another segment contains the org substring
This is the kind of subtle bug that makes navigation feel haunted.

Proper fix

Compare the actual [workspaceId] segment, not the whole string.

Also preserve the rest of the path.

Recommended code

import arcjet, { createMiddleware, detectBot } from "@arcjet/next"
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware"
import { NextMiddleware, NextRequest, NextResponse } from "next/server"

const ARCJET_KEY = process.env.ARCJET_KEY
if (!ARCJET_KEY) {
throw new Error("ARCJET_KEY environment variable is required")
}

const aj = arcjet({
key: ARCJET_KEY,
rules: [
detectBot({
mode: "LIVE",
allow: [
"CATEGORY:SEARCH_ENGINE",
"CATEGORY:PREVIEW",
"CATEGORY:WEBHOOK",
"CATEGORY:MONITOR",
],
}),
],
})

async function existingMiddleware(request: NextRequest) {
const anyRequest = request as {
kindeAuth?: {
token?: {
org_code?: string
claims?: { org_code?: string }
}
user?: {
org_code?: string
}
}
}

const url = request.nextUrl.clone()

const orgCode =
anyRequest.kindeAuth?.user?.org_code ||
anyRequest.kindeAuth?.token?.org_code ||
anyRequest.kindeAuth?.token?.claims?.org_code

if (!orgCode) {
return NextResponse.next()
}

const segments = url.pathname.split("/").filter(Boolean)

if (segments[0] !== "workspace") {
return NextResponse.next()
}

const routeWorkspaceId = segments[1]
const rest = segments.slice(2)

if (routeWorkspaceId !== orgCode) {
url.pathname = `/workspace/${orgCode}${rest.length ? `/${rest.join("/")}` : ""}`
return NextResponse.redirect(url)
}

return NextResponse.next()
}

export default createMiddleware(
aj,
withAuth(existingMiddleware, {
publicPaths: ["/", "/api/uploadthing"],
}) as NextMiddleware,
)

export const config = {
matcher: ["/((?!_next/static|_next/image|favicon.ico|rpc).*)"],
}
Why this version is better

exact route-segment comparison
preserves nested routes
explicitly handles missing orgCode
makes the URL a proper reflection of the session org

---

middleware.ts: keep it as the first canonicalization layer, but stop using pathname.includes(orgCode). That check is too loose. Parse the path segments and compare the actual workspace segment.
const segments = request.nextUrl.pathname.split("/").filter(Boolean)
const routeWorkspaceId = segments[1] // ["workspace", ":workspaceId", ...]
if (segments[0] === "workspace" && orgCode && routeWorkspaceId !== orgCode) {
return NextResponse.redirect(new URL(`/workspace/${orgCode}`, request.url))
}

---

2. lib/workspace/current-workspace.server.ts

That is fine for middleware, but as your architecture grows, other server code also needs the same canonical workspace lookup:

-route layouts
-server pages
-redirect guards
-future server actions
-non-oRPC helpers

If the app has only one way to fetch the current workspace:

-typing stays consistent
-nullable vs required behavior stays explicit
-every server-side consumer uses the same semantics
-future changes to workspace resolution happen in one place
-This is a standard senior-engineering move: separate state retrieval from policy enforcement.

retrieval = “what is the current workspace?”
enforcement = “is a workspace required here?”
Those are different responsibilities.

How server pages/layouts should use it

---

For example, a server layout that wants to validate the route:
app/(dashboard)/workspace/[workspaceId]/layout.tsx: this should become the route-boundary guard. Accept params, load the current session-backed workspace on the server, compare it to params.workspaceId, and redirect if they differ.

const { workspaceId } = await params
const workspace = await requireCurrentWorkspace()
if (workspaceId !== workspace.orgCode) {
redirect(`/workspace/${workspace.orgCode}`)
}

---

app/(dashboard)/workspace/[workspaceId]/page.tsx: right now it fetches session-scoped channels but builds the redirect with the route param. That mixes the two models. Build the redirect from the canonical workspace instead.
const workspace = await requireCurrentWorkspace()
const { channels } = await client.channel.list()
if (channels.length > 0) {
redirect(`/workspace/${workspace.orgCode}/channel/${channels[0].id}`)
}

---

app/(dashboard)/workspace/[workspaceId]/\_components/ChannelList.tsx: remove workspaceId from useParams(). Keep channelId if you want active styling, but generate hrefs from useActiveWorkspace().workspacePath.
const { workspacePath } = useActiveWorkspace()
href={`${workspacePath}/channel/${channel.id}`}

app/(dashboard)/workspace/[workspaceId]/\_components/CreateNewChannel.tsx: same issue. The mutation already writes into the session-backed org, but router.push() uses the URL-backed id. Replace that with workspacePath or currentWorkspace.orgCode.

app/(dashboard)/workspace/[workspaceId]/\_components/WorkspaceMembersList.tsx: keep the member data query, but stop using useParams().workspaceId for the presence room. Presence is workspace-scoped behavior, so it should use workspace-${currentWorkspace.orgCode} from useActiveWorkspace().

app/(dashboard)/workspace/[workspaceId]/channel/[channelId]/\_components/member/MembersOverview.tsx: same fix as above. This component is currently joining a presence room based on the URL, which is exactly the type of drift you want to eliminate.

app/(dashboard)/workspace/[workspaceId]/\_components/WorkspaceHeader.tsx: this is not a drift bug, but it is a coupling smell. It reads currentWorkspace from channel.list(), which means a header component depends on a channel endpoint for workspace identity. Change it to useActiveWorkspace() or workspace.list() directly. That makes the component’s dependency match its responsibility.

app/(dashboard)/workspace/\_components/WorkspaceList.tsx: semantically this file is already good. It compares against currentWorkspace.orgCode and uses LoginLink orgCode={workspace.id}. I would only change it if you want it to consume useActiveWorkspace() for consistency.

3. Add hooks/use-active-workspace.ts: this is the main client-side fix. It should read orpc.workspace.list.queryOptions() and derive the canonical client values once.

export function useActiveWorkspace() {
const { data } = useSuspenseQuery(orpc.workspace.list.queryOptions())
const currentWorkspace = data.currentWorkspace
return {
currentWorkspace,
workspaceId: currentWorkspace.orgCode,
workspacePath: `/workspace/${currentWorkspace.orgCode}`,
presenceRoom: `workspace-${currentWorkspace.orgCode}`,
user: data.user,
workspaces: data.workspaces,
}
}
Once this exists, low-level components stop touching useParams().workspaceId.
