type OnboardingErrorLike = {
  code?: string
  message?: string
}

const isOnboardingErrorLike = (
  error: unknown,
): error is OnboardingErrorLike => {
  return typeof error === "object" && error !== null
}

export const getOnboardingErrorMessage = (error: unknown, fallback: string) => {
  if (isOnboardingErrorLike(error)) {
    if (error.code === "UNAUTHORIZED") {
      return "Your session has expired. Please sign in again."
    }

    if (
      error.code === "FORBIDDEN" &&
      error.message === "No onboarding workspace found"
    ) {
      return "We couldn't find your onboarding workspace. Please go back and create your workspace again."
    }

    if (
      error.code === "BAD_REQUEST" &&
      error.message === "No active Polar subscription found"
    ) {
      return "We couldn't confirm your Pro subscription yet. Please wait a moment and try again."
    }

    if (
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.message === "Unable to verify Polar subscription."
    ) {
      return "We couldn't verify your Pro subscription right now. Please wait a moment and try again."
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message
    }
  }

  return fallback
}
