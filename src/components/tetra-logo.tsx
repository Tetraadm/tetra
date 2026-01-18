export function TetraLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M16 2L2 10V22L16 30L30 22V10L16 2Z" className="fill-primary" />
          <path d="M16 8L8 12.5V21.5L16 26L24 21.5V12.5L16 8Z" className="fill-primary-foreground" />
          <path d="M16 12L12 14.5V19.5L16 22L20 19.5V14.5L16 12Z" className="fill-primary" />
        </svg>
      </div>
      <span className="font-semibold text-xl tracking-tight text-foreground">Tetra</span>
    </div>
  )
}
