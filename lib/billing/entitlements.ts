import prisma from "@/lib/db"

export async function getOrganizationPlan(organizationId: string) {
  const billing = await prisma.organizationBilling.findUnique({
    where: { organizationId },
    select: { plan: true },
  })

  return billing?.plan ?? "free"
}

export async function isOrganizationPro(organizationId: string) {
  return (await getOrganizationPlan(organizationId)) === "pro"
}
