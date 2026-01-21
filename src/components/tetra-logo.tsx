import Image from 'next/image'

export function TetraLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/tetrivo-logo.png"
        alt="Tetrivo"
        width={140}
        height={40}
        className="h-10 w-auto"
        priority
      />
    </div>
  )
}
