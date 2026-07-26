import { generateCompose, generateThreadSummary } from "./ai"
import {
  createWorkspaceCheckout,
  createWorkspacePortal,
  getWorkspaceBilling,
} from "./billing"
import { createChannel, getChannel, listChannel } from "./channel"
import { inviteMember, listMembers } from "./member"
import {
  createMessage,
  deleteMessage,
  listMessages,
  listThreadReplies,
  toggleReaction,
  updateMessage,
} from "./message"
import {
  completeOnboardingProPlan,
  createOnboardingWorkspace,
  getAppEntry,
  getOnboardingState,
  saveOnboardingProfile,
  skipOnboardingInvites,
  startOnboardingFreePlan,
  startOnboardingProPlan,
  submitOnboardingInvites,
} from "./onboarding"
import {
  createWorkspace,
  editWorkspace,
  listWorkspaces,
  selectWorkspace,
} from "./workspace"

/** This is just an object that organizes procedures into namespaces:
 * workspace.list points to the procedure listWorkspaces
 *
 * So oRPC routes become:
 * /rpc/workspace (because your procedure path is /workspace)
 * and inside your client, you can call something like client.workspace.list(...) (depending on your client setup)
 */
export const router = {
  workspace: {
    list: listWorkspaces,
    create: createWorkspace,
    select: selectWorkspace,
    update: editWorkspace,
  },

  billing: {
    get: getWorkspaceBilling,
    checkout: createWorkspaceCheckout,
    portal: createWorkspacePortal,
  },

  member: {
    list: listMembers,
    invite: inviteMember,
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
    delete: deleteMessage,
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

  onboarding: {
    entry: getAppEntry,
    state: getOnboardingState,
    profile: { save: saveOnboardingProfile },
    workspace: { create: createOnboardingWorkspace },
    invite: {
      submit: submitOnboardingInvites,
      skip: skipOnboardingInvites,
    },
    billing: {
      startFree: startOnboardingFreePlan,
      startPro: startOnboardingProPlan,
      completePro: completeOnboardingProPlan,
    },
  },
}
