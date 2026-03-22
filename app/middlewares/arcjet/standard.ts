//This standard arcjet middleware will house standard things like: bot detection, shield

import arcjet, { detectBot, shield } from "@/lib/arcjet"
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"

import { base } from "../base"
import { ArcjetNextRequest } from "@arcjet/next"

const buildStandardAj = () =>
  arcjet
    .withRule(
      shield({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      }),
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: [
          "CATEGORY:SEARCH_ENGINE",
          "CATEGORY:PREVIEW",
          "CATEGORY:MONITOR",
        ],
      }),
    )

export const standardSecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest
    user: KindeUser<Record<string, unknown>>
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildStandardAj().protect(context.request, {
      userId: context.user.id,
    })

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: "Automated traffic blocked.",
        })
      }

      if (decision.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: "Request blocked by security policy (WAF).",
        })
      }

      throw errors.FORBIDDEN({
        message: "Request Blocked!",
      })
    }

    return next()
  })
