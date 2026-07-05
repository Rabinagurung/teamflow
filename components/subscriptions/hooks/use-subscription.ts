import { authClient } from "@/lib/auth/auth-client"
import { useQuery } from "@tanstack/react-query"

export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await authClient.customer.state()
      //console.log("Customer polar state: ", { data })
      return data
    },
  })
}

export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscription()

  //user will have one subscription -> easy to implement if user must see pro status or not.
  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  }
}
