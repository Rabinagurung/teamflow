"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth/auth"
import { authClient } from "@/lib/auth/auth-client"
import {
  SUPPORTED_OATUH_PROVIDER_DETAILS,
  SUPPORTED_OATUH_PROVIDERS,
  SupportedOAuthProvider,
} from "@/lib/auth/o-auth-providers"
import { Plus, Shield, Trash2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

type Account = Awaited<ReturnType<typeof auth.api.listUserAccounts>>[number]

interface AccountLinkingProps {
  currentAccounts: Account[]
}

export function AccountLinking({ currentAccounts }: AccountLinkingProps) {
  const availableProviders = SUPPORTED_OATUH_PROVIDERS.filter(
    (provider) => !currentAccounts.find((acc) => acc.providerId === provider),
  )

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            Existing sign-in methods
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Keep your preferred providers connected so you can sign in faster on
            any device.
          </p>
        </div>

        {currentAccounts.length === 0 ? (
          <Card className="rounded-2xl border-border/70 bg-muted/15 shadow-none">
            <CardContent className="p-5 text-sm text-muted-foreground">
              No linked social accounts found yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {currentAccounts.map((account) => (
              <AccountCard
                key={account.id}
                provider={account.providerId}
                account={account}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            Add more
          </p>
          <h3 className="text-xl font-semibold text-foreground">
            Link another provider
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Add another provider so you always have a backup sign-in method.
          </p>
        </div>

        <div className="grid gap-3">
          {availableProviders.map((provider) => (
            <AccountCard key={provider} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AccountCard({
  provider,
  account,
}: {
  provider: string
  account?: Account
}) {
  const router = useRouter()
  const pathname = usePathname()

  const providerDetails = SUPPORTED_OATUH_PROVIDER_DETAILS[
    provider as SupportedOAuthProvider
  ] ?? {
    name: provider,
    Icon: Shield,
  }

  function linkAccount() {
    return authClient.linkSocial({
      provider,
      callbackURL: pathname,
    })
  }

  function unlinkAccount() {
    if (account == null) {
      return Promise.resolve({ error: { message: "Account not found" } })
    }

    return authClient.unlinkAccount(
      {
        accountId: account.accountId,
        providerId: provider,
      },
      {
        onSuccess: () => {
          router.refresh()
        },
      },
    )
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-muted/10 shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/70 bg-background shadow-sm">
            <providerDetails.Icon className="size-5 text-foreground" />
          </div>

          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {providerDetails.name}
            </p>
            {account == null ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Connect your {providerDetails.name} account for easier sign in.
              </p>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Linked on {new Date(account.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {account == null ? (
          <BetterAuthActionButton
            variant="outline"
            size="sm"
            className="rounded-xl"
            action={linkAccount}
          >
            <Plus />
            Link
          </BetterAuthActionButton>
        ) : (
          <BetterAuthActionButton
            variant="destructive"
            size="sm"
            className="rounded-xl"
            action={unlinkAccount}
          >
            <Trash2 />
            Unlink
          </BetterAuthActionButton>
        )}
      </CardContent>
    </Card>
  )
}
