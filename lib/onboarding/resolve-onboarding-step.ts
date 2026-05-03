export type OnboardingStep = "profile" | "workspace" | "invite" | "billing"

import prisma from "../db"

export const resolveOnboardingStep = async (
  userId: string,
): Promise<OnboardingStep | null> => {
  const state = await prisma.onboardingState.findUnique({
    where: { userId },
    select: { currentStep: true },
  })

  if (!state?.currentStep) {
    return null
  }

  if (
    state.currentStep === "profile" ||
    state.currentStep === "workspace" ||
    state.currentStep === "invite" ||
    state.currentStep === "billing"
  ) {
    return state.currentStep
  }

  return null
}
