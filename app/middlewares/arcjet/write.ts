import arcjet, { sensitiveInfo, slidingWindow } from "@/lib/arcjet"
import { base } from "../base"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppUser } from "../auth"

const buildStandardAj = () =>
  arcjet
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: 40,
      }),
    )
    .withRule(
      sensitiveInfo({
        //sensitive data that we dont wanna share with AI
        mode: "LIVE",
        deny: ["PHONE_NUMBER", "CREDIT_CARD_NUMBER"],
      }),
    )

export const writeSecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest
    user: AppUser
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildStandardAj().protect(context.request, {
      userId: context.user.id,
    })

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: "Too many impactful changes. Please slow down.",
        })
      }

      if (decision.reason.isSensitiveInfo()) {
        throw errors.BAD_REQUEST({
          message:
            "Sensitive information detected. Please remove PII (e.g., credit cards, phone numbers)",
        })
      }

      throw errors.FORBIDDEN({
        message: "Request Blocked!",
      })
    }

    return next()
  })
