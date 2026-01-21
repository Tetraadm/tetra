import { useEffect, useRef, type ReactNode } from 'react'

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

const getFocusableElements = (container: HTMLElement | null) => (
    container ? Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)) : []
)

type ModalShellProps = {
    open: boolean
    onClose: () => void
    titleId: string
    children: ReactNode
}

export function ModalShell({ open, onClose, titleId, children }: ModalShellProps) {
    const contentRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!open) return

        const content = contentRef.current
        if (!content) return

        const focusFirst = () => {
            const focusables = getFocusableElements(content)
            const first = focusables[0] ?? content
            first.focus()
        }

        focusFirst()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }

            if (event.key !== 'Tab') return

            const focusables = getFocusableElements(content)
            if (focusables.length === 0) {
                event.preventDefault()
                content.focus()
                return
            }

            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            const active = document.activeElement

            if (event.shiftKey && active === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl animate-fade-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}
