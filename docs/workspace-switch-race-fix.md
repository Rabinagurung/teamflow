# Workspace Switch Race Fix

## Problem

When switching from one workspace to another, old channel requests could still be running.

Example:

1. User is in workspace A, channel A1.
2. User clicks workspace B.
3. The server active workspace changes to B.
4. An old request still asks for channel A1.
5. Backend checks channel A1 against workspace B.
6. Backend returns `NOT_FOUND` or validation errors.

The Arcjet `127.0.0.1` warning is only development noise. The real issue was stale channel/thread/message requests during workspace switching.

## What Changed

### 1. Added a workspace switch state

File:

- `app/(dashboard)/workspace/_components/WorkspaceSwitchProvider.tsx`

This tracks when a workspace switch is in progress.

The provider is mounted in:

- `app/(dashboard)/workspace/layout.tsx`

### 2. Cancel old channel-scoped queries before switching

File:

- `app/(dashboard)/workspace/_components/WorkspaceList.tsx`

Before selecting the new workspace, it cancels and removes channel-scoped queries:

- `channel.get`
- `message.list`
- `message.thread.list`

This reduces old frontend requests during the switch.

### 3. Added workspace-scoped query keys

File:

- `lib/query/workspace-query-keys.ts`

The cache keys now include `workspaceId` where needed:

- channel detail
- message list
- thread list

This prevents cache data from one workspace/channel being reused for another workspace/channel.

### 4. Added a channel route guard and loader

Files:

- `app/(dashboard)/workspace/[workspaceId]/channel/[channelId]/page.tsx`
- `app/(dashboard)/workspace/[workspaceId]/loading.tsx`

If the URL workspace and active workspace do not match, the channel page shows a loader instead of firing channel APIs.

### 5. Passed `workspaceId` into channel/message/thread RPC calls

Files touched include:

- `MessageList.tsx`
- `MessageInputForm.tsx`
- `ThreadSidebar.tsx`
- `ThreadReplyForm.tsx`
- `MessageItem.tsx`
- `ReactionsBar.tsx`
- `EditMessage.tsx`
- `DeleteMessage.tsx`
- `SummarizeThread.tsx`
- `ChannelRealtimeProvider.tsx`
- `ThreadRealtimeProvider.tsx`

The important idea:

Each request now carries the workspace it came from, instead of relying only on the current active workspace session.

### 6. Backend validates the requested workspace

New helper:

- `app/router/_shared/requested-workspace.ts`

Used by:

- `app/router/channel.ts`
- `app/router/message.ts`
- `app/router/ai.ts`

The backend now:

1. Reads the optional `workspaceId` from the request.
2. Checks that the user is a member of that workspace.
3. Uses that workspace for channel/message/thread lookup.

This means an old in-flight request from workspace A can still complete against workspace A, even if the active workspace has already changed to B.

### 7. Fixed server oRPC initialization for build

Some server pages now import:

```ts
import "@/lib/orpc/orpc.server"
```

This avoids server rendering using the browser RPC link during build.

## How To Trace The Flow

Start here:

1. Workspace click:
   - `app/(dashboard)/workspace/_components/WorkspaceList.tsx`

2. Switch state:
   - `app/(dashboard)/workspace/_components/WorkspaceSwitchProvider.tsx`

3. Channel page guard:
   - `app/(dashboard)/workspace/[workspaceId]/channel/[channelId]/page.tsx`

4. Query keys:
   - `lib/query/workspace-query-keys.ts`

5. Backend requested workspace validation:
   - `app/router/_shared/requested-workspace.ts`

6. Backend channel lookup:
   - `app/router/channel.ts`

7. Backend message/thread lookup:
   - `app/router/message.ts`

## Verification

Ran successfully:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

