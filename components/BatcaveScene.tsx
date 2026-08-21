'use client'

import React from 'react'

interface BatcaveSceneProps {
  screenGlow?: boolean
  width?: number
}

export default function BatcaveScene({ screenGlow = true, width = 400 }: BatcaveSceneProps) {
  const h = width * 0.65

  return (
    <svg viewBox="0 0 400 260" width={width} height={h} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Room gradient */}
        <radialGradient id="bat-room" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#162050" />
          <stop offset="60%" stopColor="#0d1530" />
          <stop offset="100%" stopColor="#080e20" />
        </radialGradient>
        {/* Screen glow */}
        <radialGradient id="bat-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.15)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        {/* Screen content gradients */}
        <linearGradient id="scr-data1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a3060" />
          <stop offset="100%" stopColor="#0d1530" />
        </linearGradient>
        <linearGradient id="scr-data2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e2a50" />
          <stop offset="100%" stopColor="#0f1835" />
        </linearGradient>
        {/* Ambient light */}
        <radialGradient id="bat-ambient" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="screen-bloom">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Room background */}
      <rect x="0" y="0" width="400" height="260" fill="url(#bat-room)" />

      {/* Floor reflection */}
      <rect x="0" y="200" width="400" height="60" fill="url(#bat-ambient)" />
      <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />

      {/* Back wall subtle lines */}
      <line x1="0" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
      <line x1="400" y1="0" x2="350" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

      {/* ── DESK ── */}
      <path d="M 80,210 L 320,210 L 335,230 L 65,230 Z" fill="#1a1e2e" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
      {/* Desk edge highlight */}
      <line x1="80" y1="210" x2="320" y2="210" stroke="rgba(201,168,76,0.2)" strokeWidth="1" />
      {/* Desk legs */}
      <rect x="90" y="230" width="4" height="30" fill="#151828" rx="1" />
      <rect x="306" y="230" width="4" height="30" fill="#151828" rx="1" />

      {/* Keyboard on desk */}
      <rect x="160" y="215" width="80" height="10" rx="2" fill="#111525" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />
      {/* Keyboard keys hint */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={`k${i}`} x={165 + i * 9} y="217" width="6" height="5" rx="0.5" fill="rgba(201,168,76,0.05)" />
      ))}

      {/* Mouse */}
      <ellipse cx="260" cy="220" rx="6" ry="4" fill="#111525" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />

      {/* Coffee mug */}
      <rect x="110" y="212" width="10" height="8" rx="2" fill="#1e2540" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
      <path d="M 120,215 Q 124,215 124,218 Q 124,221 120,221" fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />

      {/* ── 6 SCREENS — 3 bottom + 3 top ── */}
      {/* Screen glow behind */}
      {screenGlow && (
        <ellipse cx="200" cy="120" rx="150" ry="80" fill="url(#bat-glow)" filter="url(#screen-bloom)" />
      )}

      {/* Bottom row — 3 screens */}
      {[0, 1, 2].map(i => {
        const x = 105 + i * 70
        return (
          <g key={`sb${i}`}>
            {/* Screen frame */}
            <rect x={x} y="120" width="60" height="42" rx="2" fill="#0a0e1a" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8" />
            {/* Screen content */}
            <rect x={x + 2} y="122" width="56" height="38" rx="1" fill={i === 1 ? 'url(#scr-data2)' : 'url(#scr-data1)'} />
            {/* Data lines */}
            {[0, 1, 2, 3].map(j => (
              <rect key={`sbl${i}${j}`} x={x + 6} y={126 + j * 8} width={20 + (j * 7) % 30} height="2" rx="1"
                fill={j === 0 ? 'rgba(201,168,76,0.3)' : 'rgba(138,155,181,0.15)'} />
            ))}
            {/* Screen stand */}
            <rect x={x + 25} y="162" width="10" height="8" fill="#111525" />
            <rect x={x + 20} y="168" width="20" height="3" rx="1" fill="#111525" />
          </g>
        )
      })}

      {/* Top row — 3 screens */}
      {[0, 1, 2].map(i => {
        const x = 105 + i * 70
        return (
          <g key={`st${i}`}>
            <rect x={x} y="70" width="60" height="42" rx="2" fill="#0a0e1a" stroke="rgba(201,168,76,0.15)" strokeWidth="0.8" />
            <rect x={x + 2} y="72" width="56" height="38" rx="1" fill={i === 0 ? 'url(#scr-data2)' : 'url(#scr-data1)'} />
            {/* Chart lines on top screens */}
            {i === 1 ? (
              <polyline points={`${x+8},100 ${x+16},92 ${x+24},96 ${x+32},85 ${x+40},88 ${x+48},80`}
                fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" />
            ) : (
              [0, 1, 2].map(j => (
                <rect key={`stl${i}${j}`} x={x + 6} y={78 + j * 10} width={15 + (j * 11) % 35} height="2.5" rx="1"
                  fill="rgba(138,155,181,0.12)" />
              ))
            )}
          </g>
        )
      })}

      {/* ── AMBIENT DETAILS ── */}
      {/* LED strip under desk */}
      <line x1="90" y1="228" x2="310" y2="228" stroke="rgba(201,168,76,0.1)" strokeWidth="1" />

      {/* Small status LEDs on screens */}
      <circle cx="110" cy="125" r="1.5" fill="#2ecc71" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="125" r="1.5" fill="#C9A84C" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Subtle ceiling light */}
      <ellipse cx="200" cy="10" rx="100" ry="5" fill="rgba(201,168,76,0.03)" />
    </svg>
  )
}
