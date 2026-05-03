import { redirect } from "next/navigation"
import React from "react"
import SendVerificationEmailForm from "./_components/send-verification-email-form"

interface PageProps {
  searchParams: Promise<{ error: string }>
}

const VerifyPage = async ({ searchParams }: PageProps) => {
  const error = (await searchParams).error
  if (!error) redirect("/app-entry")

  return (
    <div className="px-8 py-16 container mx-auto max-w-5xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Verify Email</h1>
      </div>
      <p className="text-destructive">
        <span>{error.replace(/_/g, " ").replace(/-/g, " ")}</span>
        -Please request a new verification email
      </p>
      <SendVerificationEmailForm />
    </div>
  )
}

export default VerifyPage
