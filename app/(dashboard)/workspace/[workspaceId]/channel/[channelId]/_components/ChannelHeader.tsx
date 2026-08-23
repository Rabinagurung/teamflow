import { ThemeToggle } from "@/components/ui/theme-toggle"
import MobileSidebarToggle from "../../../_components/MobileSidebarToggle"
import InviteMember from "./member/InviteMember"
import MembersOverview from "./member/MembersOverview"

interface ChannelHeaderProps {
  channelName: string | undefined
}

const ChannelHeader = ({ channelName }: ChannelHeaderProps) => {
  return (
    <div className="flex h-14 items-center justify-between gap-2 border-b bg-channel-header px-2 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileSidebarToggle />
        <h1 className="truncate text-lg font-semibold">
          #{channelName ?? "channel"}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <MembersOverview />
        <InviteMember />
        <ThemeToggle />
      </div>
    </div>
  )
}

export default ChannelHeader
