'use client'

import React, { useState, useEffect } from 'react'

interface PortalEntryProps {
  onComplete: () => void
}

export default function PortalEntry({ onComplete }: PortalEntryProps) {
  const [phase, setPhase] = useState<'dark' | 'glow' | 'opening' | 'reveal'>('dark')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 500)
    const t2 = setTimeout(() => setPhase('opening'), 1500)
    const t3 = setTimeout(() => setPhase('reveal'), 2800)
    const t4 = setTimeout(() => onComplete(), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#050810', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, transition: 'opacity 1s ease',
      opacity: phase === 'reveal' ? 0 : 1,
      pointerEvents: phase === 'reveal' ? 'none' : 'auto',
    }}>
      <svg viewBox="0 0 400 400" width="300" height="300">
        <defs>
          <radialGradient id="portal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.4)" />
            <stop offset="50%" stopColor="rgba(201,168,76,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="portal-inner" cx="50%" cy="50%" r="45%">
            <stop offset="0%" stopColor="#162050" />
            <stop offset="100%" stopColor="#0d1530" />
          </radialGradient>
          <clipPath id="portal-clip">
            <circle cx="200" cy="200" r={phase === 'dark' ? 0 : phase === 'glow' ? 20 : phase === 'opening' ? 120 : 200}>
              <animate attributeName="r" from={phase === 'glow' ? '0' : '20'} to={phase === 'glow' ? '20' : phase === 'opening' ? '120' : '200'}
                dur={phase === 'glow' ? '1s' : '1.3s'} fill="freeze" />
            </circle>
          </clipPath>
        </defs>

        {/* Outer glow */}
        {phase !== 'dark' && (
          <circle cx="200" cy="200" r="180" fill="url(#portal-glow)">
            <animate attributeName="r" from="50" to="180" dur="2s" fill="freeze" />
          </circle>
        )}

        {/* Portal ring */}
        {phase !== 'dark' && (
          <circle cx="200" cy="200"
            r={phase === 'glow' ? 25 : phase === 'opening' ? 125 : 180}
            fill="none" stroke="#C9A84C"
            strokeWidth={phase === 'glow' ? 3 : 2}
            opacity={phase === 'reveal' ? 0.3 : 0.8}>
            <animate attributeName="r" from="25" to={phase === 'opening' ? '125' : '180'}
              dur="1.3s" fill="freeze" />
          </circle>
        )}

        {/* Inner portal - showing the room */}
        {(phase === 'opening' || phase === 'reveal') && (
          <circle cx="200" cy="200" r={phase === 'opening' ? 118 : 178}
            fill="url(#portal-inner)">
            <animate attributeName="r" from="18" to={phase === 'reveal' ? '178' : '118'}
              dur="1.3s" fill="freeze" />
          </circle>
        )}

        {/* Gold particles */}
        {phase !== 'dark' && [0,1,2,3,4,5,6,7].map(i => {
          const angle = (i / 8) * Math.PI * 2
          const r = phase === 'glow' ? 40 : 150
          const cx = 200 + Math.cos(angle) * r
          const cy = 200 + Math.sin(angle) * r
          return (
            <circle key={i} cx={cx} cy={cy} r="2" fill="#E8C96A" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          )
        })}
      </svg>

      {/* Text */}
      {phase !== 'dark' && (
        <div style={{
          position: 'absolute', bottom: '20%',
          fontFamily: 'Georgia, serif', fontSize: 16, color: '#C9A84C',
          opacity: phase === 'reveal' ? 0 : phase === 'glow' ? 0.5 : 1,
          transition: 'opacity 0.8s ease',
          letterSpacing: 2,
        }}>
          {phase === 'glow' ? '...' : 'Bienvenue dans le monde de Lola'}
        </div>
      )}
    </div>
  )
}
