export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="spinner" />
        <p className="mt-3 text-sm text-muted-foreground">Laster ...</p>
      </div>
    </div>
  )
}
