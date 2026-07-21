import { auth } from "@/lib/auth/auth"
import { isOrganizationMember } from "@/lib/billing/guards"
import { getOrganizationBillingState } from "@/lib/billing/service"
import { headers } from "next/headers"

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return Response.json({ message: "Forbidden" }, { status: 403 })
  }

  return Response.json(
    {
      message: "Failed to load billing",
    },
    { status: 500 },
  )
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      throw new Error("Unauthorized")
    }

    const { organizationId } = await params
    const isMember = await isOrganizationMember({
      organizationId,
      userId: session.user.id,
    })

    if (!isMember) {
      throw new Error("Forbidden")
    }

    const billing = await getOrganizationBillingState(organizationId)
    return Response.json(billing)
  } catch (error) {
    return errorResponse(error)
  }
}
