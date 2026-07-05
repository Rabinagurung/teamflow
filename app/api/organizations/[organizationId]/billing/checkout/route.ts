import { createOrganizationCheckout } from "@/lib/billing/service"

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return Response.json({ message: "Forbidden" }, { status: 403 })
  }

  return Response.json({ message: "Failed to start checkout" }, { status: 500 })
}

export async function POST(
  _: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params
    const result = await createOrganizationCheckout(organizationId)

    /**
    CHECKOUT ROUTES RESULT:  {
        result: {
            url: 'https://sandbox.polar.sh/checkout/polar_c_J055kOaWf9aF2ZzyXMD6zRNgUrOyDhTXumwUU4BPYMo'
        }
    }
    */
    // console.log("CHECKOUT ROUTES RESULT: ", { result })

    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
