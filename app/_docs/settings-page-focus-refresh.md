# Settings Page Focus Refresh

## Goal

`SettingsPageFocusRefresh` exists to refresh the account settings route when a user returns to the tab after completing an auth-related action somewhere else.

The main use case is the security tab:

- a social-auth user clicks `Set Password`
- the app sends a password reset email
- the user opens that email in another tab
- the user completes password setup in the reset-password flow
- the original admin settings tab still shows stale server-rendered account state

Without a refresh, the security tab can keep showing `Set Password` instead of `Change Password`.

---

## Why This Is Needed

The settings page is server-rendered and the security tab derives its UI from:

```ts
auth.api.listUserAccounts(...)
```

That means the tab is based on a server snapshot taken when the settings page last rendered.

If the credential account is created later in another tab, the already-open settings page does not automatically know about that change.

`SettingsPageFocusRefresh` solves this by refreshing the route when the user comes back to the settings tab.

---

## Component

```tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export function SettingsPageFocusRefresh() {
  const router = useRouter()
  const lastRefreshAtRef = useRef(0)

  useEffect(() => {
    const refreshIfNeeded = () => {
      const now = Date.now()

      // Focus and visibility can fire almost together when you return to a tab.
      // This avoids double-refreshing.
      if (now - lastRefreshAtRef.current < 500) return

      lastRefreshAtRef.current = now
      router.refresh()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshIfNeeded()
      }
    }

    window.addEventListener("focus", refreshIfNeeded)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", refreshIfNeeded)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router])

  return null
}
```

---

## What the `useEffect` Is Doing

The `useEffect` sets up a tab-return listener.

Its job is:

- when the user leaves this tab
- does something in another tab
- then comes back here

it automatically runs:

```ts
router.refresh()
```

so the page gets fresh server data.

### 1. It runs once after the component mounts

Because of:

```ts
useEffect(() => {
  ...
}, [router])
```

`router` is stable, so in practice this effect sets up the listeners when the component appears, and cleans them up when it unmounts.

### 2. It defines `refreshIfNeeded`

```ts
const refreshIfNeeded = () => {
  const now = Date.now()

  if (now - lastRefreshAtRef.current < 500) return

  lastRefreshAtRef.current = now
  router.refresh()
}
```

This function:

- checks the current time
- prevents duplicate refreshes within 500ms
- then calls `router.refresh()`

This is the actual route-refresh logic.

### 3. It listens for the window getting focus again

```ts
window.addEventListener("focus", refreshIfNeeded)
```

This means:

- if the user clicks back into this browser tab/window
- call `refreshIfNeeded()`

Example:

- admin tab open
- user switches to Gmail tab
- user switches back to admin tab
- `focus` fires

### 4. It listens for the document becoming visible again

```ts
document.addEventListener("visibilitychange", handleVisibilityChange)
```

and:

```ts
const handleVisibilityChange = () => {
  if (!document.hidden) {
    refreshIfNeeded()
  }
}
```

This means:

- if the tab was hidden
- and now becomes visible again
- refresh

Example:

- tab is in background
- user returns to it
- browser marks it visible
- refresh happens

### 5. It cleans up listeners on unmount

```ts
return () => {
  window.removeEventListener("focus", refreshIfNeeded)
  document.removeEventListener("visibilitychange", handleVisibilityChange)
}
```

This prevents leaking event listeners if the component disappears.

---

## Why Both `focus` and `visibilitychange`

Browsers do not always behave the same way when a user returns to a tab.

Sometimes:

- `focus` fires
- `visibilitychange` fires
- or both fire

Using both makes the behavior more reliable.

---

## Why `useRef(0)` Is Used

```ts
const lastRefreshAtRef = useRef(0)
```

This stores the timestamp of the last refresh without causing rerenders.

It is used here:

```ts
if (now - lastRefreshAtRef.current < 500) return
```

That prevents duplicate refreshes if `focus` and `visibilitychange` fire almost at the same time.

---

## In Plain English

This component says:

> While this settings page is open, if the user comes back to this tab, refresh the route once so the server data is current.

---

## Why This Fix Fits the Security Tab

The important detail is that clicking `Set Password` does **not** immediately create a credential account.

It only sends the password reset email.

The credential account is created later when the user successfully completes the reset-password flow in another tab.

That means:

- `Set Password` should not switch to `Change Password` immediately on click
- it should switch only after the password has actually been created
- the original admin settings tab needs to revalidate when the user returns

This focus-refresh approach handles exactly that.

---

## Example Usage

Mount it near the top of the settings page:

```tsx
import { SettingsPageFocusRefresh } from "./_components/SettingsPageFocusRefresh"

export default async function AdminSettingsPage() {
  const headerList = await headers()
  const session = await auth.api.getSession({ headers: headerList })

  if (session == null) redirect("/login")

  return (
    <AdminPageShell
      title="Account settings"
      description="Manage admin-facing workspace settings."
    >
      <SettingsPageFocusRefresh />

      <div className="max-w-4xl mx-auto my-6 px-4">
        {/* page content */}
      </div>
    </AdminPageShell>
  )
}
```

---

## Resulting User Flow

1. User opens admin settings.
2. User clicks `Set Password`.
3. Reset email is sent.
4. User opens the email link in another tab.
5. User sets the password successfully.
6. User returns to the original admin settings tab.
7. The tab regains focus or becomes visible.
8. `router.refresh()` runs.
9. The settings route re-renders on the server.
10. `SecurityTab` sees the credential account and shows `Change Password`.
