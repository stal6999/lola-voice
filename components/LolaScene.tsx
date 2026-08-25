'use client'

import React from 'react'

type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'loading' | 'alert' | 'happy'

interface LolaSceneProps {
  width: number
  height: number
  speaking?: boolean
  listening?: boolean
  loading?: boolean
  lolaState?: LolaState
}

/**
 * Fond d'ambiance derrière Lola — clair, lumineux, chaleureux.
 * Plus d'écran/TV : Lola est seule, centrale, sans décor qui distrait.
 */
export default function LolaScene({ width, height }: LolaSceneProps) {
  const VW = 800, VH = 600
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="s-bg" cx="50%" cy="28%" r="90%">
          <stop offset="0%" stopColor="#fdf6e8"/>
          <stop offset="35%" stopColor="#fbeecd"/>
          <stop offset="70%" stopColor="#f3ddac"/>
          <stop offset="100%" stopColor="#e8c988"/>
        </radialGradient>
      </defs>
      <rect width={VW} height={VH} fill="url(#s-bg)"/>
      <ellipse cx={VW/2} cy={VH*0.42} rx="380" ry="300" fill="rgba(255,255,255,0.35)"/>
    </svg>
  )
}
