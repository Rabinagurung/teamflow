import type { Query, QueryKey } from "@tanstack/react-query"

const channelScopedStringKeys = new Set([
  "channel.get",
  "message.list",
  "message.thread.list",
])

const channelScopedOperationPaths = [
  ["channel", "get"],
  ["message", "list"],
  ["message", "thread", "list"],
] as const

const matchesOperationPath = (
  value: unknown,
  operationPath: readonly string[],
) => {
  return (
    Array.isArray(value) &&
    value.length === operationPath.length &&
    operationPath.every((part, index) => value[index] === part)
  )
}

export const isChannelScopedQueryKey = (queryKey: QueryKey) => {
  const [firstPart] = queryKey

  if (typeof firstPart === "string") {
    return channelScopedStringKeys.has(firstPart)
  }

  return channelScopedOperationPaths.some((operationPath) =>
    matchesOperationPath(firstPart, operationPath),
  )
}

export const isChannelScopedQuery = (query: Query) =>
  isChannelScopedQueryKey(query.queryKey)

export const workspaceQueryKeys = {
  channelList: (workspaceId: string) => ["channel.list", workspaceId] as const,
  channelDetail: (workspaceId: string, channelId: string) =>
    ["channel.get", workspaceId, channelId] as const,
  memberList: (workspaceId: string) => ["member.list", workspaceId] as const,
  messageList: (workspaceId: string, channelId: string) =>
    ["message.list", workspaceId, channelId] as const,
  threadList: (workspaceId: string, messageId: string) =>
    ["message.thread.list", workspaceId, messageId] as const,
}
