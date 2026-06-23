export function getAvatar(userImage: string | null, userEmail: string) {
  return (
    userImage ?? `https://avatar.vercel.sh/${encodeURIComponent(userEmail)}`
  )
}
