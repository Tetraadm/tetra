import Image from 'next/image'

type LogoVariant = 'full' | 'logo-only' | 'text-only'

interface TetraLogoProps {
  className?: string
  variant?: LogoVariant
}

export function TetraLogo({ className, variant = 'full' }: TetraLogoProps) {
  const logoSrc = variant === 'full'
    ? '/tetrivo-full.png'
    : variant === 'logo-only'
      ? '/tetrivo-logo.png'
      : '/Tetrivo-tekst (2).png'

  const width = variant === 'full' ? 180 : variant === 'logo-only' ? 40 : 140
  const height = 40

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoSrc}
        alt="Tetrivo"
        width={width}
        height={height}
        className={variant === 'logo-only' ? 'h-10 w-10' : 'h-10 w-auto'}
        priority
      />
    </div>
  )
}
