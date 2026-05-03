import { cn } from "@/lib/utils/utils"

export default function SetupPanelFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-[26px] border border-white/10 p-4", className)}>
      <div className="rounded-[22px] border border-white/10">{children}</div>
    </div>
  )
}
