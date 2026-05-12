import { auth } from "@/lib/auth/auth"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing() //create a instance of upload thing and used in routes

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute(imageUploader)
    .middleware(async ({ req }) => {
      // This code runs on your server before upload and authorization logic is written
      const session = await auth.api.getSession({
        headers: new Headers(req.headers),
      })

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new UploadThingError("Unauthorized")

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata }) => {
      // This code RUNS ON YOUR SERVER after upload
      // console.log("Upload complete for userId:", metadata.userId)

      // console.log("file url", file.ufsUrl)

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

//This file is core.ts and does not define a route handler. A route handler is defined by a file called route.ts in Next.js
