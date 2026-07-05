import { createAuthClient } from "better-auth/react"
import {
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"

// All Polar plugins, etc. should be attached to BetterAuth server
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields(), organizationClient()],
})
