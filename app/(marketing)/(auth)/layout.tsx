import React from "react"
import { AuthLayout } from "./_componentss/auth-layout"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <AuthLayout>{children}</AuthLayout>
}

export default Layout
