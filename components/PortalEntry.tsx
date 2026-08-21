'use client'

import React, { useState, useEffect } from 'react'

interface PortalEntryProps {
  onComplete: () => void
}

export default function PortalEntry({ onComplete }: PortalEntryProps) {
  const [phase, setPhase] = useState<'dark' | 'particles' | 'glow' | 'opening' | 'reveal'>('dark')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('particles'), 400)
    const t2 = setTimeout(() => setPhase('glow'), 1200)
    const t3 = setTimeout(() => setPhase('opening'), 2200)
    const t4 = setTimeout(() => setPhase('reveal'), 3500)
    const t5 = setTimeout(() => onComplete(), 4500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [onComplete])

  // Generate floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 80,
    y: 50 + (Math.random() - 0.5) * 80,
    size: 1 + Math.random() * 3,
    delay: Math.random() * 2,
    dur: 2 + Math.random() * 3,
  }))

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#040610', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      opacity: phase === 'reveal' ? 0 : 1,
      transition: 'opacity 1s ease',
      pointerEvents: phase === 'reveal' ? 'none' : 'auto',
      overflow: 'hidden',
    }}>

      {/* Background stars */}
      {phase !== 'dark' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={`star${i}`} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              background: '#C9A84C',
              borderRadius: '50%',
              opacity: Math.random() * 0.3 + 0.1,
              animation: `twinkle ${2 + Math.random() * 3}s ${Math.random() * 2}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Portal SVG */}
      <svg viewBox="0 0 400 400" width="320" height="320" style={{ position: 'relative', zIndex: 2 }}>
        <defs>
          <radialGradient id="pe-glow-outer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.35)" />
            <stop offset="40%" stopColor="rgba(201,168,76,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="pe-inner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#162050" />
            <stop offset="80%" stopColor="#0d1530" />
            <stop offset="100%" stopColor="#0a1020" />
          </radialGradient>
          <radialGradient id="pe-ring-glow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgba(201,168,76,0)" />
            <stop offset="85%" stopColor="rgba(201,168,76,0.2)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.05)" />
          </radialGradient>
          <filter id="pe-bloom">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="pe-soft">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Outer glow bloom */}
        {phase !== 'dark' && phase !== 'particles' && (
          <circle cx="200" cy="200" r="170" fill="url(#pe-glow-outer)" filter="url(#pe-bloom)">
            <animate attributeName="r" from="30" to="170" dur="1.5s" fill="freeze" />
          </circle>
        )}

        {/* Portal ring — gold, ornate */}
        {phase !== 'dark' && phase !== 'particles' && (
          <g>
            {/* Outer ring */}
            <circle cx="200" cy="200"
              r={phase === 'glow' ? 30 : phase === 'opening' ? 130 : 160}
              fill="none" stroke="#C9A84C" strokeWidth={phase === 'glow' ? 3 : 2}
              opacity="0.7">
              <animate attributeName="r" from="30"
                to={phase === 'opening' ? '130' : '160'}
                dur="1.3s" fill="freeze" />
            </circle>
            {/* Inner ring */}
            <circle cx="200" cy="200"
              r={phase === 'glow' ? 26 : phase === 'opening' ? 126 : 156}
              fill="none" stroke="#E8C96A" strokeWidth="0.5"
              opacity="0.4" strokeDasharray="3,4">
              <animate attributeName="r" from="26"
                to={phase === 'opening' ? '126' : '156'}
                dur="1.3s" fill="freeze" />
            </circle>
          </g>
        )}

        {/* Ring glow */}
        {(phase === 'opening' || phase === 'reveal') && (
          <circle cx="200" cy="200" r="130" fill="url(#pe-ring-glow)" />
        )}

        {/* Inner portal — the room behind */}
        {(phase === 'opening' || phase === 'reveal') && (
          <circle cx="200" cy="200"
            r={phase === 'opening' ? 124 : 155}
            fill="url(#pe-inner)">
            <animate attributeName="r" from="20"
              to={phase === 'reveal' ? '155' : '124'}
              dur="1.3s" fill="freeze" />
          </circle>
        )}

        {/* Floating particles */}
        {phase !== 'dark' && particles.map(p => (
          <circle key={p.id}
            cx={200 + (p.x - 50) * 2.5}
            cy={200 + (p.y - 50) * 2.5}
            r={p.size * 0.5}
            fill="#E8C96A"
            opacity="0">
            <animate attributeName="opacity" values="0;0.5;0" dur={`${p.dur}s`}
              begin={`${p.delay}s`} repeatCount="indefinite" />
            <animate attributeName="cy"
              values={`${200 + (p.y - 50) * 2.5};${200 + (p.y - 50) * 2.5 - 30}`}
              dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Decorative arcs around portal */}
        {phase !== 'dark' && phase !== 'particles' && (
          <g opacity="0.3">
            {[0, 1, 2, 3, 4, 5].map(i => {
              const angle = (i / 6) * Math.PI * 2
              const r = phase === 'glow' ? 40 : 145
              return (
                <g key={`arc${i}`} transform={`rotate(${i * 60}, 200, 200)`}>
                  <line x1={200} y1={200 - r + 5} x2={200} y2={200 - r - 8}
                    stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round">
                    <animate attributeName="y1" from={200 - 45} to={200 - r + 5} dur="1s" fill="freeze" />
                    <animate attributeName="y2" from={200 - 50} to={200 - r - 8} dur="1s" fill="freeze" />
                  </line>
                </g>
              )
            })}
          </g>
        )}

        {/* Center "L" monogram before portal opens */}
        {(phase === 'particles' || phase === 'glow') && (
          <text x="200" y="210" textAnchor="middle" fontFamily="Georgia, serif"
            fontSize="28" fontWeight="700" fill="#C9A84C" opacity={phase === 'glow' ? 1 : 0.3}>
            <animate attributeName="opacity" from="0" to={phase === 'glow' ? '1' : '0.3'}
              dur="0.8s" fill="freeze" />
            L
          </text>
        )}
      </svg>

      {/* Text */}
      <div style={{
        position: 'absolute', bottom: '18%',
        fontFamily: 'Georgia, serif', fontSize: 15, color: '#C9A84C',
        opacity: phase === 'dark' || phase === 'particles' ? 0 : phase === 'reveal' ? 0 : 1,
        transition: 'opacity 0.8s ease', letterSpacing: 3, textAlign: 'center',
      }}>
        {phase === 'glow' ? 'LOLA' : 'Bienvenue dans mon monde'}
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}
