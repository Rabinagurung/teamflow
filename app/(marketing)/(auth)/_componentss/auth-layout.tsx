import Image from "next/image"
import Link from "next/link"
import React from "react"

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-muted flex flex-col min-h-svh  justify-center items-center gap-6 p-6 md:p-10 ">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={"/"}
          className="flex items-center justify-center gap-2 self-center font-medium"
        >
          <Image
            src="/logos/arcjet-logo.png"
            alt="Teamflow"
            width={100}
            height={100}
          />
          TeamFlow
        </Link>
        {children}
      </div>
    </div>
  )
}
