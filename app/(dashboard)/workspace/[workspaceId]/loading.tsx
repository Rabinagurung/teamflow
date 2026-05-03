export default function WorkspaceLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative size-28">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-300" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-5xl font-semibold tracking-tight">
            Launching Workspace
          </h2>
          <p className="text-lg text-muted-foreground">
            Opening your workspace...
          </p>
        </div>
      </div>
    </div>
  )
}
