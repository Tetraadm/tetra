import Image from 'next/image'

export function TetraLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8">
        <Image
          src="/tetra-logo.png"
          alt="Tetra Logo"
          fill
          className="object-contain"
          sizes="32px"
        />
      </div>
      <span className="font-semibold text-xl tracking-tight text-foreground">Tetrivo</span>
    </div>
  )
}
