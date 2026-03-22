import { Toaster } from "@/components/ui/sonner"
import React from "react"

const MarketingLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
      <Toaster />
    </div>
  )
}

export default MarketingLayout
