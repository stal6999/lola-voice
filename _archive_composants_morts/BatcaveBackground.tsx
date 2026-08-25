'use client'

import React from 'react'

interface BatcaveBackgroundProps {
  width: number
  height: number
  screenContent?: string | null
  audioActive?: boolean
}

export default function BatcaveBackground({ width, height, screenContent, audioActive }: BatcaveBackgroundProps) {
  const scaleX = width / 400
  const scaleY = height / 700

  return (
    <svg viewBox="0 0 400 700" width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0 }}
      preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Room gradient */}
        <radialGradient id="bg-room" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#16224a" />
          <stop offset="50%" stopColor="#0d1838" />
          <stop offset="100%" stopColor="#070c20" />
        </radialGradient>

        {/* Ceiling light */}
        <radialGradient id="bg-ceiling" cx="50%" cy="0%" r="55%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Floor */}
        <linearGradient id="bg-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f1a38" />
          <stop offset="100%" stopColor="#070c1c" />
        </linearGradient>

        {/* Floor reflection */}
        <linearGradient id="bg-floor-reflect" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(100,140,220,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        {/* Big screen */}
        <linearGradient id="bg-bigscreen" x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%" stopColor="#080e22" />
          <stop offset="100%" stopColor="#040810" />
        </linearGradient>

        {/* Screen glow */}
        <radialGradient id="bg-screen-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(100,150,230,0.18)" />
          <stop offset="60%" stopColor="rgba(100,150,230,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Gold stripe */}
        <linearGradient id="bg-gold-stripe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(201,168,76,0)" />
          <stop offset="30%" stopColor="rgba(201,168,76,0.6)" />
          <stop offset="70%" stopColor="rgba(201,168,76,0.6)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </linearGradient>

        {/* Desk gradient */}
        <linearGradient id="bg-desk" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#141c30" />
          <stop offset="100%" stopColor="#0a1020" />
        </linearGradient>

        {/* Filters */}
        <filter id="bg-bloom">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="bg-glow-soft">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        <clipPath id="bg-screen-clip">
          <rect x="40" y="35" width="320" height="200" rx="6" />
        </clipPath>
      </defs>

      {/* ── ROOM ── */}
      <rect width="400" height="700" fill="url(#bg-room)" />
      <rect width="400" height="700" fill="url(#bg-ceiling)" />

      {/* Wall panels */}
      <line x1="0" y1="310" x2="400" y2="310" stroke="rgba(201,168,76,0.04)" strokeWidth="0.5" />
      <line x1="40" y1="0" x2="40" y2="310" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />
      <line x1="360" y1="0" x2="360" y2="310" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />

      {/* ── GRAND ÉCRAN MURAL ── */}
      {/* Bloom glow behind screen */}
      <rect x="38" y="33" width="324" height="204" rx="8"
        fill="url(#bg-screen-glow)" filter="url(#bg-bloom)" />

      {/* Screen frame outer */}
      <rect x="36" y="30" width="328" height="210" rx="8"
        fill="#070b1a" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5" />

      {/* Screen surface */}
      <rect x="40" y="34" width="320" height="202" rx="5" fill="url(#bg-bigscreen)" />

      {/* Screen content */}
      <g clipPath="url(#bg-screen-clip)">
        {screenContent ? (
          <foreignObject x="40" y="34" width="320" height="202">
            <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>}
              style={{
                width: '100%', height: '100%', padding: '16px 20px', overflow: 'hidden',
                fontFamily: 'Georgia, serif', fontSize: 13, color: '#e8f0ff',
                lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
              {screenContent}
            </div>
          </foreignObject>
        ) : (
          <>
            {/* Grid */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={`gl${i}`} x1={40 + i * 35} y1="34" x2={40 + i * 35} y2="236"
                stroke="rgba(100,150,220,0.03)" strokeWidth="0.5" />
            ))}
            {[0,1,2,3,4,5,6].map(i => (
              <line key={`gh${i}`} x1="40" y1={34 + i * 29} x2="360" y2={34 + i * 29}
                stroke="rgba(100,150,220,0.03)" strokeWidth="0.5" />
            ))}

            {/* Center ambient glow */}
            <ellipse cx="200" cy="135" rx="130" ry="70" fill="url(#bg-screen-glow)" />

            {/* LOLA watermark */}
            <text x="200" y="120" textAnchor="middle"
              fontFamily="Georgia, serif" fontSize="52" fontWeight="700"
              fill="rgba(201,168,76,0.04)">LOLA</text>
            <text x="200" y="148" textAnchor="middle"
              fontFamily="monospace" fontSize="8" letterSpacing="5"
              fill="rgba(201,168,76,0.12)">TC EXPERTISE & ÉNERGIE</text>
            <text x="200" y="164" textAnchor="middle"
              fontFamily="monospace" fontSize="6" letterSpacing="2"
              fill="rgba(138,155,181,0.15)">SYSTÈME OPÉRATIONNEL — v1.0</text>

            {/* Idle data lines */}
            {[0,1,2,3,4,5].map(i => (
              <rect key={`dl${i}`} x={60 + Math.sin(i * 1.3) * 15} y={175 + i * 7}
                width={50 + Math.cos(i * 0.9) * 30} height="1.5" rx="0.5"
                fill="rgba(100,150,220,0.07)">
                <animate attributeName="opacity" values="0.4;1;0.4"
                  dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            ))}
            {[0,1,2,3].map(i => (
              <rect key={`dr${i}`} x={230 + Math.cos(i * 1.1) * 10} y={175 + i * 7}
                width={40 + Math.sin(i) * 20} height="1.5" rx="0.5"
                fill="rgba(100,150,220,0.05)">
                <animate attributeName="opacity" values="0.3;0.8;0.3"
                  dur={`${1.8 + i * 0.5}s`} repeatCount="indefinite" />
              </rect>
            ))}

            {/* Audio waveform when speaking */}
            {audioActive && [0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => {
              const barH = 8 + Math.sin(i * 0.85) * 22
              return (
                <rect key={`aw${i}`} x={126 + i * 11} y={135 - barH / 2}
                  width="7" height={barH} rx="3"
                  fill="rgba(201,168,76,0.4)">
                  <animate attributeName="height"
                    values={`${barH};${5 + Math.random() * 35};${barH}`}
                    dur={`${0.2 + i * 0.04}s`} repeatCount="indefinite" />
                  <animate attributeName="y"
                    values={`${135 - barH / 2};${135 - (5 + Math.random() * 35) / 2};${135 - barH / 2}`}
                    dur={`${0.2 + i * 0.04}s`} repeatCount="indefinite" />
                </rect>
              )
            })}
          </>
        )}
      </g>

      {/* Screen top LED */}
      <rect x="40" y="34" width="320" height="2" rx="1" fill="url(#bg-gold-stripe)" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Screen scanline effect */}
      <rect x="40" y="34" width="320" height="202"
        fill="repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 3px)"
        opacity="0.5" />

      {/* Corner brackets */}
      {[{ x: 44, y: 38 }, { x: 352, y: 38 }, { x: 44, y: 230 }, { x: 352, y: 230 }].map((c, i) => (
        <g key={`sc${i}`}>
          <line x1={c.x} y1={c.y} x2={c.x + (i % 2 === 0 ? 12 : -12)} y2={c.y}
            stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" />
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + (i < 2 ? 12 : -12)}
            stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" />
        </g>
      ))}

      {/* Status LEDs on screen frame */}
      <circle cx="44" cy="32" r="2" fill="#2ecc71" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="52" cy="32" r="2" fill="#C9A84C" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.5s" repeatCount="indefinite" />
      </circle>

      {/* Screen mount */}
      <rect x="188" y="240" width="24" height="14" fill="#0a0e1c" />
      <rect x="160" y="252" width="80" height="4" rx="1.5" fill="#0a0e1c" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />

      {/* ── SIDE CONSOLES ── */}
      {/* Left console */}
      <rect x="0" y="120" width="38" height="180" rx="0"
        fill="rgba(8,12,28,0.8)" stroke="rgba(201,168,76,0.06)" strokeWidth="0.5" />
      {[0,1,2,3,4,5].map(i => (
        <rect key={`lc${i}`} x="6" y={130 + i * 25} width="26" height="16" rx="3"
          fill="rgba(15,20,40,0.9)" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      ))}

      {/* Right console */}
      <rect x="362" y="120" width="38" height="180" rx="0"
        fill="rgba(8,12,28,0.8)" stroke="rgba(201,168,76,0.06)" strokeWidth="0.5" />
      {[0,1,2,3].map(i => (
        <rect key={`rc${i}`} x="368" y={130 + i * 32} width="26" height="20" rx="3"
          fill="rgba(15,20,40,0.9)" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      ))}

      {/* ── DESK ── */}
      <path d="M 0,390 L 400,390 L 400,415 L 0,415 Z" fill="url(#bg-desk)" />
      <line x1="0" y1="390" x2="400" y2="390" stroke="rgba(201,168,76,0.18)" strokeWidth="1.2" />
      <path d="M 0,415 L 400,415 L 400,420 L 0,420 Z" fill="#080c1c" />

      {/* Desk reflection */}
      <rect x="0" y="390" width="400" height="30" fill="url(#bg-floor-reflect)" />

      {/* Keyboard */}
      <rect x="138" y="393" width="124" height="14" rx="3.5" fill="#0d1225" stroke="rgba(201,168,76,0.07)" strokeWidth="0.5" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
        <rect key={`bk${i}`} x={143 + i * 9.5} y="395" width="7" height="4.5" rx="0.8"
          fill="rgba(201,168,76,0.025)" stroke="rgba(201,168,76,0.05)" strokeWidth="0.2" />
      ))}
      <rect x="162" y="401" width="46" height="4" rx="0.8"
        fill="rgba(201,168,76,0.02)" stroke="rgba(201,168,76,0.04)" strokeWidth="0.2" />

      {/* Mouse */}
      <ellipse cx="290" cy="400" rx="9" ry="5.5" fill="#0d1225" stroke="rgba(201,168,76,0.07)" strokeWidth="0.5" />
      <line x1="290" y1="395" x2="290" y2="399" stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" />

      {/* Mug */}
      <rect x="86" y="386" width="15" height="12" rx="3" fill="#1a2245" stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
      <path d="M 101,389 Q 106,389 106,393 Q 106,397 101,397" fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="0.6" />
      <path d="M 90,385 Q 91,381 90,377" fill="none" stroke="rgba(200,200,200,0.06)" strokeWidth="0.6">
        <animate attributeName="d" values="M90,385 Q91,381 90,377;M90,385 Q89,381 91,377;M90,385 Q91,381 90,377"
          dur="3s" repeatCount="indefinite" />
      </path>

      {/* Plant */}
      <rect x="314" y="384" width="12" height="9" rx="2" fill="#1a2245" />
      <path d="M 320,384 Q 316,379 319,374 Q 322,379 320,384" fill="rgba(46,204,113,0.22)" />
      <path d="M 320,382 Q 314,376 317,372" fill="none" stroke="rgba(46,204,113,0.15)" strokeWidth="0.6" />
      <path d="M 320,382 Q 325,376 323,372" fill="none" stroke="rgba(46,204,113,0.12)" strokeWidth="0.6" />

      {/* Tablet */}
      <rect x="336" y="386" width="30" height="12" rx="2" fill="#0e1530" stroke="rgba(201,168,76,0.06)" strokeWidth="0.3" />
      <rect x="338" y="387" width="26" height="10" rx="1.5" fill="rgba(100,140,220,0.04)" />

      {/* ── FLOOR ── */}
      <rect x="0" y="420" width="400" height="280" fill="url(#bg-floor)" />

      {/* Floor tiles */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`ft${i}`} x1={i * 57} y1="420" x2={i * 57} y2="700"
          stroke="rgba(201,168,76,0.02)" strokeWidth="0.5" />
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`fh${i}`} x1="0" y1={420 + i * 56} x2="400" y2={420 + i * 56}
          stroke="rgba(201,168,76,0.015)" strokeWidth="0.5" />
      ))}

      {/* Floor ambient light */}
      <ellipse cx="200" cy="445" rx="180" ry="30" fill="rgba(100,140,220,0.04)" />
      <ellipse cx="200" cy="445" rx="100" ry="15" fill="rgba(201,168,76,0.03)" />

      {/* LED strip floor level */}
      <line x1="0" y1="421" x2="400" y2="421" stroke="rgba(201,168,76,0.08)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="5s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}
