import aj, {
  detectBot,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@/lib/arcjet"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppUser } from "../auth"
import { base } from "../base"

const buildAIAj = () =>
  aj
    .withRule(
      shield({
        //protects us against common attacks: XSS, SQL injection
        mode: "LIVE",
      }),
    )
    .withRule(
      slidingWindow({
        // rate limiting
        mode: "LIVE",
        interval: "1m",
        max: 3,
      }),
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
      }),
    )
    .withRule(
      sensitiveInfo({
        //sensitive data that we dont wanna share with AI
        mode: "LIVE",
        deny: ["PHONE_NUMBER", "CREDIT_CARD_NUMBER"],
      }),
    )

export const aiSecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest
    user: AppUser
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildAIAj().protect(context.request, {
      userId: context.user.id,
    })

    if (decision.isDenied()) {
      if (decision.reason.isSensitiveInfo()) {
        throw errors.BAD_REQUEST({
          message:
            "Sensitive information detected. Please remove PII (e.g., credit cards, phone numbers)",
        })
      }

      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: "Too many requests. Please wait and try again.",
        })
      }

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
