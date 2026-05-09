import Image from "next/image"
import Link from "next/link"
import React from "react"

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href={"/"}
          className="flex items-center justify-center self-center"
        >
          <Image
            src="/logos/teamflow-wordmark.svg"
            alt="Teamflow"
            width={180}
            height={40}
            priority
          />
        </Link>
        {children}
      </div>
    </div>
  )
}
