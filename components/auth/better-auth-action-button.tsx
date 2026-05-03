import React, { ComponentProps } from "react"
import { ActionButton } from "../ui/action-button"

/**
 * BetterAuthActionButton
 * @param  action:
 * @returns  () => Promise<{error: null | { message?:string}}>
 * If error is null then action is successful
 * If error exists then it contains error and  have optional message property.
 * It means error type either null or true(optional message)
 *
 *
 * Creating a wrapper -> take better auth action  -> converts into new format:
 * action: () => Promise<{ error: boolean; message?: string }
 * ActionButton will show all loading states and show error
 */
export function BetterAuthActionButton({
  action,
  successMessage,
  ...props
}: Omit<ComponentProps<typeof ActionButton>, "action"> & {
  action: () => Promise<{ error: null | { message?: string } }>
  successMessage?: string
}) {
  return (
    <ActionButton
      {...props}
      action={async () => {
        const res = await action()
        if (res.error) {
          return { error: true, message: res.error.message || "Action failed" }
        } else {
          return { error: false, message: successMessage }
        }
      }}
    />
  )
}
