const INVITE_ID_PATTERN = /^[A-Za-z0-9_-]{6,160}$/

export function getInviteRedirectPath(inviteURL?: string | null) {
  if (!inviteURL) return null

  const value = inviteURL.trim()
  if (!value) return null

  const inviteId = value
    .replace(/^\/invites\//, "")
    .replace(/^invites\//, "")
    .split("?")[0]

  if (
    !inviteId ||
    inviteId.includes("/") ||
    !INVITE_ID_PATTERN.test(inviteId)
  ) {
    return null
  }

  return `/invites/${encodeURIComponent(inviteId)}`
}

export function getInviteQueryValue(inviteRedirectPath: string | null) {
  if (!inviteRedirectPath) return null

  return inviteRedirectPath.replace("/invites/", "")
}
