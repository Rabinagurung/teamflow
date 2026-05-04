import { ThemeToggle } from "@/components/ui/theme-toggle"
import InviteMember from "./member/InviteMember"
import MembersOverview from "./member/MembersOverview"

interface ChannelHeaderProps {
  channelName: string | undefined
}

const ChannelHeader = ({ channelName }: ChannelHeaderProps) => {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-channel-header px-4">
      <h1 className="text-lg font-semibold">#{channelName ?? "channel"}</h1>
      <div className="flex items-center space-x-3">
        <MembersOverview />
        <InviteMember />
        <ThemeToggle />
      </div>
    </div>
  )
}

export default ChannelHeader
