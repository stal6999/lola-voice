'use client'

import React from 'react'

interface BatcaveSceneProps {
  width?: number
  audioActive?: boolean
}

export default function BatcaveScene({ width = 400, audioActive = false }: BatcaveSceneProps) {
  const h = width * 0.7

  return (
    <svg viewBox="0 0 400 280" width={width} height={h} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bc-room" cx="50%" cy="55%" r="75%">
          <stop offset="0%" stopColor="#14203e" />
          <stop offset="45%" stopColor="#0d1530" />
          <stop offset="100%" stopColor="#060a18" />
        </radialGradient>
        <radialGradient id="bc-ceiling-light" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="bc-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </linearGradient>
        <linearGradient id="bc-screen-frame" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1e2e" />
          <stop offset="100%" stopColor="#0e1220" />
        </linearGradient>
        <linearGradient id="bc-screen1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f1a35" />
          <stop offset="100%" stopColor="#0a1228" />
        </linearGradient>
        <linearGradient id="bc-screen2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#101e38" />
          <stop offset="100%" stopColor="#0b1525" />
        </linearGradient>
        <radialGradient id="bc-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(100,160,220,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="bc-gold-glow" cx="50%" cy="100%" r="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="bc-bloom">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="bc-slight-blur">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Room */}
      <rect width="400" height="280" fill="url(#bc-room)" />
      <rect width="400" height="280" fill="url(#bc-ceiling-light)" />

      {/* Wall panels subtle */}
      <line x1="0" y1="0" x2="30" y2="50" stroke="rgba(201,168,76,0.02)" strokeWidth="0.5" />
      <line x1="400" y1="0" x2="370" y2="50" stroke="rgba(201,168,76,0.02)" strokeWidth="0.5" />
      <line x1="200" y1="0" x2="200" y2="50" stroke="rgba(201,168,76,0.015)" strokeWidth="0.5" />

      {/* Floor with reflection */}
      <rect x="0" y="210" width="400" height="70" fill="url(#bc-floor)" />
      <line x1="20" y1="210" x2="380" y2="210" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />

      {/* Floor grid lines (perspective) */}
      {[0,1,2,3,4].map(i => (
        <line key={`fg${i}`}
          x1={80 + i * 60} y1="210" x2={60 + i * 70} y2="280"
          stroke="rgba(201,168,76,0.02)" strokeWidth="0.5" />
      ))}

      {/* Ambient screen glow behind monitors */}
      <ellipse cx="200" cy="110" rx="160" ry="90" fill="url(#bc-glow)" filter="url(#bc-bloom)" />

      {/* ── 6 MONITORS ── */}
      {/* Top row */}
      {[0, 1, 2].map(i => {
        const x = 98 + i * 72
        const screenW = 64
        const screenH = 44
        return (
          <g key={`mt${i}`}>
            {/* Monitor body */}
            <rect x={x - 2} y="56" width={screenW + 4} height={screenH + 6} rx="3"
              fill="url(#bc-screen-frame)" stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
            {/* Screen */}
            <rect x={x} y="58" width={screenW} height={screenH} rx="1.5"
              fill={i === 1 ? 'url(#bc-screen2)' : 'url(#bc-screen1)'} />

            {/* Screen content per monitor */}
            {i === 0 && (
              <>
                {/* Client data / table */}
                <text x={x + 4} y="68" fontSize="3.5" fill="rgba(201,168,76,0.5)" fontFamily="monospace">CLIENTS</text>
                {[0,1,2,3,4].map(j => (
                  <g key={`cl${j}`}>
                    <rect x={x + 4} y={72 + j * 5.5} width={j === 2 ? 40 : 25 + j * 4} height="2.5" rx="0.5"
                      fill={j === 0 ? 'rgba(46,204,113,0.2)' : 'rgba(138,155,181,0.1)'} />
                  </g>
                ))}
              </>
            )}
            {i === 1 && (
              <>
                {/* Main dashboard with chart */}
                <text x={x + 4} y="68" fontSize="3.5" fill="rgba(201,168,76,0.5)" fontFamily="monospace">TC EXPERTISE</text>
                <polyline
                  points={`${x+6},92 ${x+14},86 ${x+22},89 ${x+30},78 ${x+38},82 ${x+46},74 ${x+54},70 ${x+60},72`}
                  fill="none" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Area fill */}
                <polygon
                  points={`${x+6},92 ${x+14},86 ${x+22},89 ${x+30},78 ${x+38},82 ${x+46},74 ${x+54},70 ${x+60},72 ${x+60},98 ${x+6},98`}
                  fill="rgba(201,168,76,0.06)" />
                {/* Stats */}
                <rect x={x + 4} y="95" width="18" height="3" rx="0.5" fill="rgba(46,204,113,0.15)" />
                <rect x={x + 26} y="95" width="15" height="3" rx="0.5" fill="rgba(201,168,76,0.12)" />
              </>
            )}
            {i === 2 && (
              <>
                {/* Messages / notifications */}
                <text x={x + 4} y="68" fontSize="3.5" fill="rgba(201,168,76,0.5)" fontFamily="monospace">MESSAGES</text>
                {[0,1,2,3].map(j => (
                  <g key={`msg${j}`}>
                    <circle cx={x + 8} cy={74 + j * 7} r="2" fill={j === 0 ? 'rgba(201,168,76,0.2)' : 'rgba(138,155,181,0.08)'} />
                    <rect x={x + 13} y={72 + j * 7} width={20 + (j * 7) % 25} height="2" rx="0.5"
                      fill={j === 0 ? 'rgba(201,168,76,0.15)' : 'rgba(138,155,181,0.08)'} />
                  </g>
                ))}
              </>
            )}
          </g>
        )
      })}

      {/* Bottom row */}
      {[0, 1, 2].map(i => {
        const x = 98 + i * 72
        const screenW = 64
        const screenH = 44
        return (
          <g key={`mb${i}`}>
            <rect x={x - 2} y="112" width={screenW + 4} height={screenH + 6} rx="3"
              fill="url(#bc-screen-frame)" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
            <rect x={x} y="114" width={screenW} height={screenH} rx="1.5"
              fill={i === 0 ? 'url(#bc-screen2)' : 'url(#bc-screen1)'} />

            {i === 0 && (
              <>
                {/* Energy prices */}
                <text x={x + 4} y="124" fontSize="3.5" fill="rgba(46,204,113,0.5)" fontFamily="monospace">TARIFS</text>
                {[0,1,2,3].map(j => (
                  <g key={`pr${j}`}>
                    <rect x={x + 4} y={128 + j * 6} width="20" height="3" rx="0.5"
                      fill="rgba(138,155,181,0.08)" />
                    <rect x={x + 28} y={128 + j * 6} width={12 + j * 3} height="3" rx="0.5"
                      fill={j === 0 ? 'rgba(46,204,113,0.2)' : j === 3 ? 'rgba(231,76,60,0.15)' : 'rgba(201,168,76,0.1)'} />
                  </g>
                ))}
              </>
            )}
            {i === 1 && (
              <>
                {/* Audio waveform — active when speaking */}
                <text x={x + 4} y="124" fontSize="3.5" fill="rgba(201,168,76,0.5)" fontFamily="monospace">AUDIO</text>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map(j => {
                  const barH = audioActive ? 5 + Math.sin(j * 0.8) * 12 : 2
                  return (
                    <rect key={`aw${j}`} x={x + 6 + j * 4.5} y={145 - barH / 2} width="2.5" height={barH} rx="0.5"
                      fill={audioActive ? 'rgba(201,168,76,0.4)' : 'rgba(138,155,181,0.1)'}>
                      {audioActive && (
                        <animate attributeName="height"
                          values={`${barH};${3 + Math.random() * 18};${barH}`}
                          dur={`${0.3 + j * 0.05}s`} repeatCount="indefinite" />
                      )}
                    </rect>
                  )
                })}
              </>
            )}
            {i === 2 && (
              <>
                {/* Calendar / tasks */}
                <text x={x + 4} y="124" fontSize="3.5" fill="rgba(201,168,76,0.5)" fontFamily="monospace">AGENDA</text>
                {[0,1,2].map(j => (
                  <g key={`cal${j}`}>
                    <rect x={x + 4} y={128 + j * 9} width="52" height="6" rx="1"
                      fill={j === 0 ? 'rgba(201,168,76,0.08)' : 'rgba(138,155,181,0.04)'}
                      stroke={j === 0 ? 'rgba(201,168,76,0.15)' : 'rgba(138,155,181,0.06)'}
                      strokeWidth="0.3" />
                    <rect x={x + 6} y={130 + j * 9} width={20 + j * 8} height="2" rx="0.5"
                      fill="rgba(138,155,181,0.1)" />
                  </g>
                ))}
              </>
            )}

            {/* Monitor stands */}
            <rect x={x + 26} y="162" width="12" height="10" rx="1" fill="#0e1220" />
            <ellipse cx={x + 32} cy="174" rx="14" ry="3" fill="#0c1020" />
          </g>
        )
      })}

      {/* ── DESK SURFACE ── */}
      <path d="M 60,200 L 340,200 L 355,215 L 45,215 Z"
        fill="#141828" stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
      {/* Desk edge accent */}
      <line x1="60" y1="200" x2="340" y2="200" stroke="rgba(201,168,76,0.2)" strokeWidth="1.2" />
      {/* Desk underside */}
      <path d="M 45,215 L 355,215 L 360,220 L 40,220 Z" fill="#0e1220" />

      {/* Desk legs */}
      <rect x="70" y="220" width="5" height="35" rx="1" fill="#111525" />
      <rect x="325" y="220" width="5" height="35" rx="1" fill="#111525" />

      {/* ── DESK ITEMS ── */}
      {/* Keyboard */}
      <rect x="155" y="203" width="90" height="12" rx="3" fill="#0f1325"
        stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      {/* Keys */}
      {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
        <rect key={`key${i}`} x={159 + i * 7.5} y="205" width="5" height="3.5" rx="0.5"
          fill="rgba(201,168,76,0.03)" stroke="rgba(201,168,76,0.06)" strokeWidth="0.2" />
      ))}
      {/* Spacebar */}
      <rect x="175" y="210" width="30" height="3" rx="0.5" fill="rgba(201,168,76,0.02)"
        stroke="rgba(201,168,76,0.06)" strokeWidth="0.2" />

      {/* Mouse */}
      <ellipse cx="265" cy="208" rx="7" ry="5" fill="#0f1325" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      <line x1="265" y1="204" x2="265" y2="207" stroke="rgba(201,168,76,0.1)" strokeWidth="0.3" />

      {/* Coffee mug */}
      <g>
        <rect x="100" y="202" width="12" height="10" rx="2.5" fill="#1a2040"
          stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
        <path d="M 112,204 Q 117,204 117,208 Q 117,212 112,212" fill="none"
          stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />
        {/* Steam */}
        <path d="M 103,201 Q 104,197 103,194" fill="none" stroke="rgba(200,200,200,0.06)" strokeWidth="0.5">
          <animate attributeName="d" values="M103,201 Q104,197 103,194;M103,201 Q102,197 104,194;M103,201 Q104,197 103,194"
            dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 106,200 Q 107,196 106,192" fill="none" stroke="rgba(200,200,200,0.04)" strokeWidth="0.5">
          <animate attributeName="d" values="M106,200 Q107,196 106,192;M106,200 Q105,196 107,192;M106,200 Q107,196 106,192"
            dur="4s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Notebook / tablet */}
      <rect x="290" y="203" width="28" height="9" rx="1.5" fill="#141830"
        stroke="rgba(201,168,76,0.08)" strokeWidth="0.3" />
      <rect x="292" y="204" width="24" height="7" rx="1" fill="rgba(201,168,76,0.02)" />

      {/* ── AMBIENT ELEMENTS ── */}
      {/* LED strip under desk */}
      <line x1="75" y1="219" x2="325" y2="219" stroke="rgba(201,168,76,0.06)" strokeWidth="1.5">
        <animate attributeName="stroke-opacity" values="0.06;0.1;0.06" dur="4s" repeatCount="indefinite" />
      </line>

      {/* Status LEDs on monitors */}
      <circle cx="103" cy="62" r="1.5" fill="#2ecc71" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="243" cy="118" r="1.5" fill="#C9A84C" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="175" cy="62" r="1" fill="#3498db" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Small plant on desk corner */}
      <g transform="translate(330, 195)">
        <rect x="0" y="5" width="8" height="7" rx="1" fill="#1a2040" />
        <path d="M 4,5 Q 2,0 4,-3 Q 6,0 4,5" fill="rgba(46,204,113,0.25)" />
        <path d="M 4,4 Q 0,-1 2,-4" fill="none" stroke="rgba(46,204,113,0.2)" strokeWidth="0.5" />
        <path d="M 4,4 Q 7,-1 6,-3" fill="none" stroke="rgba(46,204,113,0.15)" strokeWidth="0.5" />
      </g>

      {/* Ambient gold glow from bottom */}
      <rect x="0" y="230" width="400" height="50" fill="url(#bc-gold-glow)" />
    </svg>
  )
}
