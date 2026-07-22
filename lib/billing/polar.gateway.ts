import "server-only"

import { Polar } from "@polar-sh/sdk"

/** A server-side Polar SDK client using POLAR_ACCESS_TOKEN and server: "sandbox".
 * That means this setup is talking to Polar sandbox, not production.*/
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: "sandbox",
})
