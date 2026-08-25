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
 * Fond d'ambiance derrière Lola — dégradé bleu luminescent sobre.
 * Purement décoratif : léger, sans texte, sans TV dessinée dedans.
 * L'affichage riche (photos, comparatifs, citations) vit dans LolaDisplayScreen.
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
        <radialGradient id="s-bg" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#1c3d70"/>
          <stop offset="45%" stopColor="#0f2547"/>
          <stop offset="100%" stopColor="#060f24"/>
        </radialGradient>
      </defs>
      <rect width={VW} height={VH} fill="url(#s-bg)"/>
      <ellipse cx={VW/2} cy={VH*0.5} rx="360" ry="280" fill="rgba(90,140,220,0.10)"/>
    </svg>
  )
}
