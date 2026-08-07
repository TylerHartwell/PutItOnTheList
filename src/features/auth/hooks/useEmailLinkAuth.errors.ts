export function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === "string") {
      return code
    }
  }

  return ""
}

export function getFriendlyError(error: unknown) {
  const errorCode = getErrorCode(error)
  if (errorCode === "auth/invalid-action-code") {
    return "This sign-in link is invalid, expired, or already used. Request a new email link and paste it here before opening it in another browser."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Something went wrong while handling the sign-in link."
}
