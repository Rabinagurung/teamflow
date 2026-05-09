import { cn } from "@/lib/utlis/utils"

export default function SetupPanelFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-border p-4", className)}>
      <div className="rounded-xl border border-border bg-background">
        {children}
      </div>
    </div>
  )
}
