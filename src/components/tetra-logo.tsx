import { TetrivoIcon } from '@/components/icons/tetrivo-icon'

export function TetraLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <TetrivoIcon size={40} />
      </div>
      <span className="font-bold text-2xl tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-teal-400 dark:to-cyan-300">
        Tetrivo
      </span>
    </div>
  )
}

