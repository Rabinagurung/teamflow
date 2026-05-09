import { normalizeChannelName } from "@/lib/utlis/normalize-channel-name"
import { z } from "zod"

export const ChannelNameSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name cannot exceed 50 characters")
    .transform((name, ctx) => {
      const transformed = normalizeChannelName(name)

      if (transformed.length < 2) {
        ctx.addIssue({
          code: "custom",
          message:
            "Channel name must contain at least 2 characters after transformation",
        })

        return z.NEVER
      }

      return transformed
    }),
})
