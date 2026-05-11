import { AppWorkspace } from "@/app/schemas/workspace"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import {
  NoWorkspaceError,
  requireCurrentWorkspace,
} from "@/lib/workspace/current-workspace.server"
import { ChevronUp } from "lucide-react"
import { redirect } from "next/navigation"
import React from "react"
import ChannelList from "./_components/ChannelList"
import CreateNewChannel from "./_components/CreateNewChannel"
import WorkspaceHeader from "./_components/WorkspaceHeader"
import WorkspaceMembersList from "./_components/WorkspaceMembersList"

const WorkspaceDetailsLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) => {
  const { workspaceId } = await params

  let currentWorkspace: AppWorkspace | null
  try {
    currentWorkspace = await requireCurrentWorkspace()
  } catch (error) {
    if (error instanceof NoWorkspaceError) {
      redirect("/no-workspace")
    }
    throw error
  }

  if (currentWorkspace.id !== workspaceId) {
    redirect(`/workspace/${currentWorkspace.id}`)
  }

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(orpc.channel.list.queryOptions())

  return (
    <HydrateClient client={queryClient}>
      <>
        <div className="flex h-full w-80 flex-col border-r border-channel-sidebar-border bg-channel-sidebar shadow-sm">
          {/*Header */}
          <div className="flex h-14 items-center border-b border-channel-sidebar-border bg-channel-sidebar px-4">
            <WorkspaceHeader />
          </div>
          <div className="px-4 py-2">
            <CreateNewChannel />
          </div>
          {/* Channel List */}
          <div className="flex-1 overflow-y-auto px-4">
            <Collapsible defaultOpen>
              <CollapsibleTrigger
                className="flex w-full items-center justify-between px-2 py-1 text-sm 
            font-medium text-sidebar-foreground/75 hover:text-white [&[data-state=open]>svg]:rotate-180"
              >
                Main
                <ChevronUp className="size-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ChannelList />
              </CollapsibleContent>
            </Collapsible>
          </div>
          {/* Members List */}
          <div className="border-t border-channel-sidebar-border px-4 py-2">
            <Collapsible defaultOpen>
              <CollapsibleTrigger
                className="flex w-full items-center justify-between px-2 py-1 text-sm
            font-medium text-sidebar-foreground/75 hover:text-white [&[data-state=open]>svg]:rotate-180"
              >
                Members
                <ChevronUp className="size-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <WorkspaceMembersList />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        {children}
      </>
    </HydrateClient>
  )
}

export default WorkspaceDetailsLayout
