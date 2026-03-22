import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "./core"

//API route for upload thing
//Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,

  //Apply and (optional) custom config
  //config: {...},
})
