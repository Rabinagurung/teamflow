import arcjet, { slidingWindow } from "@/lib/arcjet"
import { base } from "../base"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppUser } from "../auth"

const buildStandardAj = () =>
  arcjet.withRule(
    slidingWindow({
      //https://docs.arcjet.com/rate-limiting/algorithms
      mode: "LIVE",
      interval: "1m",
      max: 180,
    }),
  )

export const readSecurityMiddleware = base
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
          message: "Too many requests. Please slow down.",
        })
      }

      throw errors.FORBIDDEN({
        message: "Request Blocked!",
      })
    }

    return next()
  })
