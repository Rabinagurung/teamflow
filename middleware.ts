import arcjet, { createMiddleware, detectBot } from "@arcjet/next"
// import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware"
import { NextRequest, NextResponse } from "next/server"

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
        "CATEGORY:SEARCH_ENGINE", //Index data for search engines
        "CATEGORY:PREVIEW", //Request data for image and URL previews
        "CATEGORY:WEBHOOK",
        "CATEGORY:MONITOR",
      ],
    }),
  ],
})

type KindeLike = {
  org_code?: string
  claims?: {
    org_code?: string
  }
}

async function existingMiddleware(request: NextRequest) {
  const anyRequest = request as {
    nextUrl: NextRequest["nextUrl"]
    kindeAuth?: {
      token?: KindeLike
      user?: KindeLike
    }
  }

  const url = request.nextUrl

  const orgCode =
    anyRequest.kindeAuth?.user?.org_code ||
    anyRequest.kindeAuth?.token?.org_code ||
    anyRequest.kindeAuth?.token?.claims?.org_code

  // const orgCode = undefined

  // if (!orgCode) {
  //   return NextResponse.redirect(new URL("/", request.url))
  // }

  if (
    url.pathname.startsWith("/workspace") &&
    !url.pathname.includes(orgCode || "")
  ) {
    url.pathname = `/workspace/${orgCode}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

void existingMiddleware

//createMiddleware from arcjet
// withAuth from Kinde will run on all routes and check user's authentication status and not run on publicPaths
export default createMiddleware(
  aj,
  // withAuth(existingMiddleware, {
  //   publicPaths: ["/", "/api/uploadthing"],
  // }) as NextMiddleware,
)

export const config = {
  // matcher tells Next.js which routes to run the middleware on.
  // This runs the middleware on all routes except for static assets.
  /* If you use Arcjet in middleware/proxy and individual routes, you need to be careful
   * that Arcjet is not running multiple times per request.
   * This can be avoided by excluding the API route from the middleware matcher.
   * - dont want this middleware to run on /rpc routes where procedures have arject middleware implemented
   * - this middleware should run only on public routes: homepage, about, pricing.
   * added |/rpc in matcher
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|rpc).*)"],
}
