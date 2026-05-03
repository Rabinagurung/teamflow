import { requireAuth } from "@/lib/auth/auth-utils"
import React from "react"

export default async function DashoboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return children
}
