"use client"

import { useEffect } from "react"

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://echo-web-eight-umber.vercel.app/embed.js"
    script.async = true
    script.setAttribute(
      "data-organization-id",
      process.env.NEXT_PUBLIC_ORG_ID || "",
    )
    script.setAttribute("data-primary-color", "#006b67")
    document.body.appendChild(script)

    return () => {
      script.remove()
      document.getElementById("echo-widget-button")?.remove()
      document.getElementById("echo-widget-container")?.remove()
    }
  }, [])

  return null
}
