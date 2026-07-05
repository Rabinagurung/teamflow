import prisma from "@/lib/db"
import { Prisma } from "../generated/prisma/client"

export async function markPolarWebhookProcessed(params: {
  id: string
  type: string
  payload: Prisma.InputJsonValue
}) {
  try {
    await prisma.polarWebhookEvent.create({
      data: {
        id: params.id,
        type: params.type,
        payload: params.payload,
      },
    })

    return true
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false
    }
    throw error
  }
}
