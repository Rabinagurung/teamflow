import { z } from "zod"
import { appUserSchema } from "./user"

export const onboardingStepSchema = z.enum([
  "profile",
  "workspace",
  "invite",
  "billing",
])

export const onboardingProfileSchema = z.object({
  name: z.string().trim().min(2).max(20),
})

export const inviteEmailSchema = z
  .email("Enter a valid email address")
  .trim()
  .toLowerCase()

export const onboardingInviteSchema = z
  .object({
    emails: z
      .array(inviteEmailSchema)
      .min(1, "Add at least one email")
      .max(10, "You can invite up to 10 people during onboarding"),
  })
  .superRefine(({ emails }, ctx) => {
    const seen = new Set<string>()

    emails.forEach((email, index) => {
      if (seen.has(email)) {
        ctx.addIssue({
          code: "custom",
          path: ["emails", index],
          message: "Duplicate email",
        })
      }

      seen.add(email)
    })
  })

export const onboardingStateSchema = z.object({
  user: appUserSchema,
  state: z.object({
    workspaceId: z.string().nullable(),
    workspaceName: z.string().nullable(),
    hasCompletedProfile: z.boolean(),
    hasCreatedWorkspace: z.boolean(),
    hasInvitedMembers: z.boolean(),
    hasCompletedBilling: z.boolean(),
    currentStep: onboardingStepSchema.nullable(),
  }),
})

export const appEntryResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("no-workspace") }),
  z.object({ kind: z.literal("get-started") }),
  z.object({ kind: z.literal("onboarding"), step: onboardingStepSchema }),
])
