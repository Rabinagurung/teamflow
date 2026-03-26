import { z } from "zod"

export const appUserSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string(),
  emailVerified: z.boolean(),
  name: z.string(),
  image: z.string().nullable(),
  family_name: z.string().nullable(),
  given_name: z.string().nullable(),
  picture: z.string().nullable(),
})
