import Image from 'next/image'

type LogoVariant = 'full' | 'logo-only' | 'text-only'

interface TetraLogoProps {
  className?: string
  variant?: LogoVariant
  size?: number // Base height in pixels
}

export function TetraLogo({ className, variant = 'full', size = 40 }: TetraLogoProps) {
  const logoSrc = variant === 'full'
    ? '/tetrivo-full.png'
    : variant === 'logo-only'
      ? '/tetrivo-logo.png'
      : '/Tetrivo-tekst (2).png'

  // Calculate width based on variant and maintain aspect ratio
  const baseWidth = variant === 'full' ? 180 : variant === 'logo-only' ? 40 : 140
  const aspectRatio = baseWidth / 40
  const width = size * aspectRatio
  const height = size

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoSrc}
        alt="Tetrivo"
        width={width}
        height={height}
        className={variant === 'logo-only' ? `w-auto` : 'h-auto w-auto'}
        style={{ height: `${height}px` }}
        quality={100}
        unoptimized
        priority
      />
    </div>
  )
}
