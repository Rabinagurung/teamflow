import { requireAuth } from "@/lib/auth/auth-utils"
import React from "react"

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth()

  return <>{children}</>
}

export default AdminLayout
