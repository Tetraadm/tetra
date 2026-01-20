import React from 'react'

export const TetrivoIcon = ({ className, size = 32 }: { className?: string; size?: number }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="mainGradient" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0d9488" /> {/* teal-600 */}
                    <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
                </linearGradient>
                <linearGradient id="shadowGradient" x1="60" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0f766e" /> {/* teal-700 */}
                    <stop offset="100%" stopColor="#115e59" /> {/* teal-800 */}
                </linearGradient>
            </defs>

            {/* 
        Geometric "Impossible T" Construction 
        Formed by three interlocking segments creating a T-shape with depth
      */}

            {/* Vertical Pillar (Back) */}
            <path
                d="M60 100 L45 85 L45 45 L75 45 L75 85 L60 100Z"
                fill="url(#shadowGradient)"
                opacity="0.9"
            />

            {/* Top Crossbar (Left Wing) */}
            <path
                d="M20 30 L60 30 L75 45 L45 45 L20 30Z"
                fill="url(#mainGradient)"
            />

            {/* Top Crossbar (Right Wing) */}
            <path
                d="M100 30 L60 30 L75 45 L100 30Z"
                fill="url(#mainGradient)"
                opacity="0.9"
            />

            {/* Central Vertical (Front overlay) */}
            <path
                d="M45 45 L75 45 L75 85 L60 100 L45 85 L45 45Z"
                fill="url(#mainGradient)"
            />

            {/* Decorative 'Shield' Outline (Subtle) */}
            <path
                d="M60 10 L110 30 L100 80 L60 110 L20 80 L10 30 L60 10Z"
                stroke="url(#mainGradient)"
                strokeWidth="3"
                strokeOpacity="0.3"
                fill="none"
            />

            {/* Shine/Reflection */}
            <path
                d="M45 45 L75 45 L60 60 L45 45Z"
                fill="white"
                fillOpacity="0.2"
            />

        </svg>
    )
}
