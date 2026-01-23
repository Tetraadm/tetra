import Image from 'next/image'

interface TetraLogoProps {
  className?: string
  size?: number
}

export function TetraLogo({ className, size = 40 }: TetraLogoProps) {
  return (
    <div className={`flex items-center ${className || ''}`}>
      <Image
        src="/tetrivo-logo.svg"
        alt="Tetrivo"
        width={size}
        height={size}
        className="w-auto h-auto"
        style={{ height: `${size}px` }}
        priority
      />
    </div>
  )
}
