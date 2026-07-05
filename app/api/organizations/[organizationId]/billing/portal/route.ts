import { createOrganizationPortalSession } from "@/lib/billing/service"

function errorResponse(error: unknown) {
  console.error("Billing portal error:", error)

  if (error instanceof Error && error.message === "Unauthorized") {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return Response.json({ message: "Forbidden" }, { status: 403 })
  }

  return Response.json(
    {
      message:
        error instanceof Error
          ? error.message
          : "Failed to open billing portal",
    },
    { status: 500 },
  )
}

//Open portal for this exact Polar team customer, for this current member
export async function POST(
  _: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params
    const result = await createOrganizationPortalSession(organizationId)
    console.log({ result })

    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
