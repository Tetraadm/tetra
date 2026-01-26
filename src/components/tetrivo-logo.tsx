import Image from 'next/image'

interface TetrivoLogoProps {
  className?: string
  size?: number
}

export function TetrivoLogo({ className, size = 40 }: TetrivoLogoProps) {
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
