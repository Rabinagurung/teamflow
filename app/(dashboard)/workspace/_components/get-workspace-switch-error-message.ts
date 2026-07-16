type WorkspaceSwitchErrorLike = {
  code?: string
  message?: string
}

const isWorkspaceSwitchErrorLike = (
  error: unknown,
): error is WorkspaceSwitchErrorLike => {
  return typeof error === "object" && error !== null
}

export const getWorkspaceSwitchErrorMessage = (error: unknown) => {
  if (isWorkspaceSwitchErrorLike(error)) {
    if (error.code === "FORBIDDEN" && error.message === "NO_WORKSPACE") {
      return "You no longer have access to this workspace."
    }

    if (error.code === "NOT_FOUND") {
      return "This workspace no longer exists."
    }

    if (error.code === "UNAUTHORIZED") {
      return "Your session has expired. Please sign in again."
    }

    if (
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.message === "Unable to switch workspace"
    ) {
      return "Unable to switch workspace right now. Please try again."
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message
    }
  }

  return "Unable to switch workspace right now. Please try again."
}
