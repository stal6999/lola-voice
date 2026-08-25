'use client'

import React, { useState } from 'react'
import DocLocker from './DocLocker'

interface BatcaveSceneProps {
  width?: number
  audioActive?: boolean
  screenContent?: string | null
  onFileContent?: (content: string, filename: string) => void
  onDocumentReady?: (name: string) => void
  outputDoc?: { name: string; content: string } | null
}

export default function BatcaveScene({
  width = 400,
  audioActive = false,
  screenContent = null,
  onFileContent = () => {},
  onDocumentReady = () => {},
  outputDoc = null,
}: BatcaveSceneProps) {
  const h = width * 0.82

  return (
    <svg viewBox="0 0 400 328" width={width} height={h} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Room */}
        <linearGradient id="bc-room-v2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#060a18" />
          <stop offset="100%" stopColor="#0d1530" />
        </linearGradient>
        {/* Grand écran */}
        <linearGradient id="bc-bigscreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a1428" />
          <stop offset="100%" stopColor="#060e20" />
        </linearGradient>
        {/* Screen glow */}
        <radialGradient id="bc-screen-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(100,140,220,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Floor */}
        <linearGradient id="bc-floor-v2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f1628" />
          <stop offset="100%" stopColor="#080e1c" />
        </linearGradient>
        {/* Gold accent */}
        <linearGradient id="bc-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(201,168,76,0)" />
          <stop offset="50%" stopColor="rgba(201,168,76,0.6)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </linearGradient>
        <filter id="bc-glow-filter">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="bc-text-glow">
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <clipPath id="bc-screen-clip">
          <rect x="52" y="8" width="296" height="165" rx="4" />
        </clipPath>
      </defs>

      {/* ── ROOM BACKGROUND ── */}
      <rect width="400" height="328" fill="url(#bc-room-v2)" />

      {/* Wall panels */}
      <line x1="0" y1="180" x2="400" y2="180" stroke="rgba(201,168,76,0.04)" strokeWidth="0.5" />
      <line x1="50" y1="0" x2="50" y2="180" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />
      <line x1="350" y1="0" x2="350" y2="180" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />

      {/* ── GRAND ÉCRAN MURAL ── */}
      {/* Frame outer */}
      <rect x="48" y="5" width="304" height="172" rx="6"
        fill="#080e1c" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5" />
      {/* Screen bezel glow */}
      <rect x="48" y="5" width="304" height="172" rx="6"
        fill="none" stroke="rgba(100,140,220,0.08)" strokeWidth="8" filter="url(#bc-glow-filter)" />

      {/* Screen surface */}
      <rect x="52" y="8" width="296" height="165" rx="4" fill="url(#bc-bigscreen)" />

      {/* Screen content */}
      <g clipPath="url(#bc-screen-clip)">
        {screenContent ? (
          // Contenu texte
          <foreignObject x="52" y="8" width="296" height="165">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' } as any} style={{
              width: '100%', height: '100%', padding: '12px 16px', overflow: 'hidden',
              fontFamily: 'Georgia, serif', fontSize: 11, color: '#e8f0ff', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {screenContent}
            </div>
          </foreignObject>
        ) : (
          // Idle — grille tech animée
          <g>
            {/* Grid */}
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <line key={`gl${i}`} x1={52 + i * 37} y1="8" x2={52 + i * 37} y2="173"
                stroke="rgba(100,140,220,0.04)" strokeWidth="0.5" />
            ))}
            {[0,1,2,3,4].map(i => (
              <line key={`gh${i}`} x1="52" y1={8 + i * 33} x2="348" y2={8 + i * 33}
                stroke="rgba(100,140,220,0.04)" strokeWidth="0.5" />
            ))}

            {/* Ambient glow center */}
            <ellipse cx="200" cy="90" rx="120" ry="60" fill="url(#bc-screen-glow)" />

            {/* Logo/monogram */}
            <text x="200" y="82" textAnchor="middle"
              fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
              fill="rgba(201,168,76,0.06)">LOLA</text>
            <text x="200" y="100" textAnchor="middle"
              fontFamily="monospace" fontSize="7" letterSpacing="4"
              fill="rgba(201,168,76,0.15)">TC EXPERTISE & ÉNERGIE</text>

            {/* Data lines idle */}
            {[0,1,2,3,4,5].map(i => (
              <rect key={`dl${i}`} x={70 + Math.sin(i * 1.2) * 20} y={115 + i * 8}
                width={40 + Math.cos(i) * 30} height="1.5" rx="0.5"
                fill="rgba(100,140,220,0.08)">
                <animate attributeName="opacity" values="0.5;1;0.5"
                  dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            ))}

            {/* Waveform when audio active */}
            {audioActive && [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
              const barH = 5 + Math.sin(i * 0.9) * 18
              return (
                <rect key={`aw${i}`} x={148 + i * 9} y={90 - barH / 2}
                  width="5" height={barH} rx="2"
                  fill="rgba(201,168,76,0.35)">
                  <animate attributeName="height"
                    values={`${barH};${4 + Math.random() * 24};${barH}`}
                    dur={`${0.25 + i * 0.04}s`} repeatCount="indefinite" />
                  <animate attributeName="y"
                    values={`${90 - barH / 2};${90 - (4 + Math.random() * 24) / 2};${90 - barH / 2}`}
                    dur={`${0.25 + i * 0.04}s`} repeatCount="indefinite" />
                </rect>
              )
            })}

            {/* Corner brackets */}
            {[{ x: 58, y: 14 }, { x: 336, y: 14 }, { x: 58, y: 162 }, { x: 336, y: 162 }].map((c, i) => (
              <g key={`bc${i}`}>
                <line x1={c.x} y1={c.y} x2={c.x + (i % 2 === 0 ? 8 : -8)} y2={c.y}
                  stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
                <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + (i < 2 ? 8 : -8)}
                  stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
              </g>
            ))}
          </g>
        )}
      </g>

      {/* Screen top LED strip */}
      <rect x="52" y="8" width="296" height="2" rx="1" fill="url(#bc-gold)" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Screen mount/stand */}
      <rect x="190" y="177" width="20" height="10" fill="#0a0e1a" />
      <rect x="165" y="186" width="70" height="3" rx="1" fill="#0a0e1a" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />

      {/* ── FLOOR ── */}
      <rect x="0" y="245" width="400" height="83" fill="url(#bc-floor-v2)" />
      <line x1="0" y1="245" x2="400" y2="245" stroke="rgba(201,168,76,0.12)" strokeWidth="1" />

      {/* Floor reflection of screen */}
      <rect x="52" y="246" width="296" height="30" rx="2"
        fill="rgba(100,140,220,0.03)" />

      {/* ── DESK ── */}
      <path d="M 44,235 L 356,235 L 368,248 L 32,248 Z" fill="#111828" stroke="rgba(201,168,76,0.15)" strokeWidth="0.8" />
      <line x1="44" y1="235" x2="356" y2="235" stroke="rgba(201,168,76,0.2)" strokeWidth="1" />
      <path d="M 32,248 L 368,248 L 368,252 L 32,252 Z" fill="#0c1220" />

      {/* Desk legs */}
      <rect x="55" y="252" width="5" height="40" rx="1" fill="#0c1220" />
      <rect x="340" y="252" width="5" height="40" rx="1" fill="#0c1220" />

      {/* LED strip sous bureau */}
      <line x1="60" y1="251" x2="340" y2="251" stroke="rgba(201,168,76,0.07)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" repeatCount="indefinite" />
      </line>

      {/* ── DESK ITEMS ── */}
      {/* Keyboard */}
      <rect x="155" y="237" width="90" height="11" rx="2.5" fill="#0d1122" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={`k${i}`} x={159 + i * 8} y="239" width="5.5" height="3" rx="0.5"
          fill="rgba(201,168,76,0.03)" stroke="rgba(201,168,76,0.06)" strokeWidth="0.2" />
      ))}
      <rect x="174" y="243" width="28" height="3" rx="0.5" fill="rgba(201,168,76,0.02)" stroke="rgba(201,168,76,0.05)" strokeWidth="0.2" />

      {/* Mouse */}
      <ellipse cx="265" cy="242" rx="7" ry="4.5" fill="#0d1122" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
      <line x1="265" y1="238" x2="265" y2="241" stroke="rgba(201,168,76,0.1)" strokeWidth="0.3" />

      {/* Mug + vapeur */}
      <rect x="302" y="233" width="11" height="9" rx="2" fill="#1a2040" stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
      <path d="M 313,235 Q 316,235 316,238 Q 316,241 313,241" fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" />
      <path d="M 305,232 Q 306,229 305,226" fill="none" stroke="rgba(200,200,200,0.06)" strokeWidth="0.5">
        <animate attributeName="d" values="M305,232 Q306,229 305,226;M305,232 Q304,229 306,226;M305,232 Q306,229 305,226" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Tablet */}
      <rect x="116" y="235" width="22" height="9" rx="1.5" fill="#0e1525" stroke="rgba(201,168,76,0.06)" strokeWidth="0.3" />
      <rect x="118" y="236" width="18" height="7" rx="1" fill="rgba(100,140,220,0.04)" />

      {/* Plant */}
      <rect x="330" y="232" width="8" height="6" rx="1.5" fill="#1a2040" />
      <path d="M 334,232 Q 332,228 334,225 Q 336,228 334,232" fill="rgba(46,204,113,0.2)" />
      <path d="M 334,231 Q 330,227 332,224" fill="none" stroke="rgba(46,204,113,0.15)" strokeWidth="0.5" />
      <path d="M 334,231 Q 337,227 336,224" fill="none" stroke="rgba(46,204,113,0.1)" strokeWidth="0.5" />

      {/* Status LEDs */}
      <circle cx="55" cy="12" r="1.5" fill="#2ecc71" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="62" cy="12" r="1.5" fill="#C9A84C" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.5s" repeatCount="indefinite" />
      </circle>

      {/* ── CASIER DOCUMENTS — intégré dans le mur gauche ── */}
      <DocLocker
        onFileContent={onFileContent}
        onDocumentReady={onDocumentReady}
        outputDoc={outputDoc}
      />

    </svg>
  )
}
