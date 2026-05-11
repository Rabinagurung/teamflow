import { z } from "zod"

export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name cannot exceed 50 characters"),
})

export const appWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
})

export type AppWorkspace = z.infer<typeof appWorkspaceSchema>
