export const workspaceQueryKeys = {
  channelList: (workspaceId: string) => ["channel.list", workspaceId] as const,
  memberList: (workspaceId: string) => ["member.list", workspaceId] as const,
}
