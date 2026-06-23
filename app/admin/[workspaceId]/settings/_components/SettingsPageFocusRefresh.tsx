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
