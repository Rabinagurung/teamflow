import { Card, CardContent } from "@/components/ui/card"
import { WorkspaceItem } from "@/lib/app-entry"
import WorkspacePickerItem from "./WorkspacePickerItem"

export default function WorkspacePickerList({
  workspaces,
}: {
  workspaces: WorkspaceItem[]
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <CardContent className="divide-y divide-border p-0">
        {workspaces.map((workspace) => (
          <WorkspacePickerItem
            key={workspace.id}
            id={workspace.id}
            name={workspace.name}
            memberCount={workspace.memberCount}
          />
        ))}
      </CardContent>
    </Card>
  )
}
