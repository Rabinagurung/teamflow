import { createWorkspace, listWorkspaces } from "./workspace"
import { createChannel, getChannel, listChannel } from "./channel"
import {
  createMessage,
  listMessages,
  listThreadReplies,
  toggleReaction,
  updateMessage,
} from "./message"
import { inviteMember, listMembers } from "./member"
import { generateCompose, generateThreadSummary } from "./ai"

/** This is just an object that organizes procedures into namespaces:
 * workspace.list points to the procedure listWorkspaces
 *
 * So oRPC routes become:
 * /rpc/workspace (because your procedure path is /workspace)
 * and inside your client, you can call something like client.workspace.list(...) (depending on your client setup)
 */
export const router = {
  // Creating our first route i.e: workspace(an object where all procedures are passed)
  // For that, a key is created(list) and a file workspace.ts will stores all procedures for workspace category
  workspace: {
    list: listWorkspaces,
    create: createWorkspace,
    member: {
      list: listMembers,
      invite: inviteMember,
    },
  },
  channel: {
    create: createChannel,
    list: listChannel,
    get: getChannel,
  },
  message: {
    create: createMessage,
    list: listMessages,
    update: updateMessage,
    reaction: {
      toggle: toggleReaction,
    },
    thread: {
      list: listThreadReplies,
    },
  },
  ai: {
    compose: {
      generate: generateCompose,
    },
    thread: {
      summary: {
        generate: generateThreadSummary,
      },
    },
  },
}
