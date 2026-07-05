import { requireOrganizationMember } from "@/lib/billing/guards"
import { getOrganizationBillingState } from "@/lib/billing/service"

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
    const { organizationId } = await params
    await requireOrganizationMember(organizationId)
    const billing = await getOrganizationBillingState(organizationId)
    return Response.json(billing)
  } catch (error) {
    return errorResponse(error)
  }
}
