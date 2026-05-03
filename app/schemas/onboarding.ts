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

export const onboardingInviteSchema = z.object({
  emails: z.array(z.email().max(25)),
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
