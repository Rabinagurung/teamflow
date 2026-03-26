import { z } from "zod"

export const workspaceSchema = z.object({
  name: z.string().min(2).max(50),
})

export const appWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  orgCode: z.string(),
  orgName: z.string(),
})

export type AppWorkspace = z.infer<typeof appWorkspaceSchema>
