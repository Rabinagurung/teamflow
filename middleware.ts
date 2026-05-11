import arcjet, { createMiddleware, detectBot } from "@arcjet/next"

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

export default createMiddleware(aj)

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
