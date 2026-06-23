import type { ReactNode } from "react"

type AdminPageShellProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  framed?: boolean
  children: ReactNode
}

const AdminPageShell = ({
  title,
  description,
  actions,
  framed = true,
  children,
}: AdminPageShellProps) => {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="shrink-0 self-start md:self-auto">{actions}</div>
        ) : null}
      </div>

      {framed ? (
        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_20px_50px_-36px_rgba(15,23,42,0.35)]">
          <div className="p-5 md:p-7">{children}</div>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

export default AdminPageShell
