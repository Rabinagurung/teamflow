"use client"

import { LoaderCircle } from "lucide-react"

type OnboardingProcessingStateProps = {
  title: string
  description: string
}

export default function OnboardingProcessingState({
  title,
  description,
}: OnboardingProcessingStateProps) {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)]">
        <section className="flex min-h-[calc(100vh-32px)] items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-40px)] sm:px-10 lg:px-16">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-5 grid size-16 place-items-center justify-center rounded-2xl ">
                <LoaderCircle
                  className="size-12 animate-spin text-primary"
                  strokeWidth={1.75}
                />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>

              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

// import { LoaderCircle } from "lucide-react"

// type OnboardingProcessingStateProps = {
//   eyebrow?: string
//   title: string
//   description: string
// }

// export default function OnboardingProcessingState({
//   eyebrow = "Setting this up",
//   title,
//   description,
// }: OnboardingProcessingStateProps) {
//   return (
//     <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 py-10 text-foreground">
//       <div className="absolute inset-0" />

//       <div className="relative w-full max-w-lg rounded-[28px] border border-border/80 bg-card/95 p-10 text-center shadow-2xl shadow-primary/10 backdrop-blur">
//         <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-border bg-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
//           {eyebrow}
//         </div>

//         <div className="relative mx-auto mb-8 grid size-24 place-items-center">
//           <LoaderCircle
//             className="size-10 animate-spin text-primary/80"
//             strokeWidth={1.75}
//           />
//         </div>

//         <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
//           {title}
//         </h2>

//         <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
//           {description}
//         </p>
//       </div>
//     </main>
//   )
// }
