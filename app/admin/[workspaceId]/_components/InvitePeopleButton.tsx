import { Button } from "@/components/ui/button"
import { UserPlus2 } from "lucide-react"

const InvitePeopleButton = () => {
  return (
    <Button
      type="button"
      className="h-11 rounded-2xl px-5 text-sm font-semibold shadow-sm"
    >
      <UserPlus2 className="size-4.5" />
      Invite People
    </Button>
  )
}

export default InvitePeopleButton
