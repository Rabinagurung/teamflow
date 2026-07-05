import AdminPageShell from "../_components/AdminPageShell"
import { SubscriptionsTab } from "../_components/subscriptions-tab"

const AdminBillingPage = () => {
  return (
    <AdminPageShell
      title="Billing"
      description="Review your current plan and see what unlocks when you upgrade."
      framed={false}
    >
      {/* <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-2">
        <Card className="w-full max-w-4xl overflow-hidden rounded-[32px] border-border/80 py-0 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.38)]">
          <CardContent className="px-6 py-8 md:px-10 md:py-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                Free plan
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-[2.5rem]">
                Your workspace is on the Free plan.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Upgrade when you&apos;re ready for more collaboration power,
                richer integrations, and AI-assisted workflows.
              </p>

              <Button
                size="lg"
                className="mt-8 h-11 rounded-2xl px-7 text-base font-semibold shadow-sm"
              >
                Upgrade To Pro
              </Button>

              <div className="mt-12 text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  With Slack Pro, your team gets:
                </h3>

                <ul className="mx-auto mt-6 inline-grid w-fit gap-4 text-left">
                  <li className="grid grid-cols-[1.35rem_1fr] items-start gap-3 text-lg leading-8 text-foreground">
                    <Check className="mt-1 size-5 shrink-0 text-emerald-600" />
                    <span>Unlimited message and file history*</span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] items-start gap-3 text-lg leading-8 text-foreground">
                    <Check className="mt-1 size-5 shrink-0 text-emerald-600" />
                    <span>Securely work with external partners</span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] items-start gap-3 text-lg leading-8 text-foreground">
                    <Sparkles className="mt-1 size-5 shrink-0 text-violet-500" />
                    <span>Summarize threads and channels</span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] items-start gap-3 text-lg leading-8 text-foreground">
                    <Sparkles className="mt-1 size-5 shrink-0 text-violet-500" />
                    <span>Group meetings with AI notes</span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] items-start gap-3 text-lg leading-8 text-foreground">
                    <Sparkles className="mt-1 size-5 shrink-0 text-violet-500" />
                    <span>Integrated AI assistants</span>
                  </li>
                </ul>

                <p className="mx-auto mt-8 max-w-xl text-sm leading-8 text-muted-foreground">
                  *On the free plan, messages and files are deleted after one
                  year. Upgrading allows you to save all messages and files, but
                  content deleted prior to upgrading can&apos;t be restored.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      <SubscriptionsTab />
    </AdminPageShell>
  )
}

export default AdminBillingPage
