'use client'

import React from 'react'

interface LolaAvatarProps {
  mouthState: 'closed' | 'half' | 'open'
  blinking: boolean
  expression: 'neutral' | 'listening' | 'thinking' | 'smiling'
  width?: number
}

export default function LolaAvatar({ mouthState, blinking, expression, width = 280 }: LolaAvatarProps) {
  const h = width * 1.6

  // Eye openness
  const eyeH = blinking ? 1 : expression === 'listening' ? 14 : 12
  const eyeRY = blinking ? 0.5 : expression === 'listening' ? 7 : 6

  // Eyebrow position
  const browY = expression === 'listening' ? -2 : expression === 'thinking' ? -1 : 0

  // Mouth shape
  const mouthPaths: Record<string, string> = {
    closed: 'M 88,178 Q 100,184 112,178',
    half: 'M 86,178 Q 100,188 114,178 Q 100,183 86,178',
    open: 'M 84,176 Q 100,196 116,176 Q 100,184 84,176',
  }

  // Smile adjustment
  const smileExtra = expression === 'smiling' ? 4 : 0

  return (
    <svg viewBox="0 0 200 320" width={width} height={h} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradients */}
        <radialGradient id="lola-skin" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#f5dcc3" />
          <stop offset="100%" stopColor="#e8c4a0" />
        </radialGradient>
        <linearGradient id="lola-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a3728" />
          <stop offset="50%" stopColor="#5c4033" />
          <stop offset="100%" stopColor="#3d2b1f" />
        </linearGradient>
        <linearGradient id="lola-blazer" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2d3e" />
          <stop offset="100%" stopColor="#1e2030" />
        </linearGradient>
        <linearGradient id="lola-turtleneck" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2040" />
          <stop offset="100%" stopColor="#0d1530" />
        </linearGradient>
        <radialGradient id="lola-eye-iris" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#d4a855" />
          <stop offset="60%" stopColor="#b8863a" />
          <stop offset="100%" stopColor="#8a6420" />
        </radialGradient>
        <radialGradient id="lola-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,140,140,0.25)" />
          <stop offset="100%" stopColor="rgba(220,140,140,0)" />
        </radialGradient>
        <filter id="lola-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
        </filter>
        <linearGradient id="lola-pendant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C96A" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
        <linearGradient id="lola-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cc7777" />
          <stop offset="100%" stopColor="#b86060" />
        </linearGradient>
      </defs>

      {/* ── BODY ── */}
      {/* Neck */}
      <path d="M 90,200 L 90,230 Q 90,240 85,245 L 115,245 Q 110,240 110,230 L 110,200"
        fill="url(#lola-skin)" />

      {/* Shoulders & Blazer */}
      <path d="M 40,320 L 40,270 Q 40,250 60,245 L 85,242 L 100,255 L 115,242 L 140,245 Q 160,250 160,270 L 160,320 Z"
        fill="url(#lola-blazer)" filter="url(#lola-shadow)" />

      {/* Turtleneck */}
      <path d="M 85,242 L 85,225 Q 85,218 92,218 L 108,218 Q 115,218 115,225 L 115,242 L 100,255 Z"
        fill="url(#lola-turtleneck)" />

      {/* Blazer lapels */}
      <path d="M 85,242 L 75,260 L 80,320 L 100,320 L 100,255 Z" fill="#333849" opacity="0.6" />
      <path d="M 115,242 L 125,260 L 120,320 L 100,320 L 100,255 Z" fill="#333849" opacity="0.6" />

      {/* Pendant necklace */}
      <path d="M 95,225 Q 100,235 105,225" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.7" />
      <circle cx="100" cy="237" r="3" fill="url(#lola-pendant)" />

      {/* ── HEAD ── */}
      {/* Hair behind head */}
      <ellipse cx="100" cy="120" rx="62" ry="72" fill="url(#lola-hair)" />

      {/* Face shape */}
      <path d="M 55,130 Q 55,88 75,70 Q 90,58 100,58 Q 110,58 125,70 Q 145,88 145,130 Q 145,170 125,188 Q 112,198 100,200 Q 88,198 75,188 Q 55,170 55,130 Z"
        fill="url(#lola-skin)" filter="url(#lola-shadow)" />

      {/* Hair front — swept to one side */}
      <path d="M 58,115 Q 55,80 72,62 Q 85,50 100,48 Q 120,48 135,62 Q 148,78 146,110 Q 144,95 135,82 Q 125,72 115,72 Q 108,72 100,78 Q 90,70 78,72 Q 65,75 60,95 Z"
        fill="url(#lola-hair)" />
      {/* Side swept bangs */}
      <path d="M 58,115 Q 52,90 60,72 Q 55,85 54,100 Q 53,112 56,125 Z"
        fill="#3d2b1f" opacity="0.6" />
      {/* Wave in hair */}
      <path d="M 145,110 Q 150,95 148,80 Q 152,95 150,115 Q 148,130 145,140 Q 147,125 145,110 Z"
        fill="#4a3728" opacity="0.5" />
      {/* Hair flowing down right side */}
      <path d="M 145,140 Q 152,160 155,185 Q 157,200 154,218 Q 150,235 145,245 Q 148,230 148,210 Q 148,190 144,170 Q 140,155 142,140 Z"
        fill="url(#lola-hair)" />

      {/* ── FACE DETAILS ── */}
      {/* Cheeks */}
      <ellipse cx="72" cy="162" rx="12" ry="8" fill="url(#lola-cheek)" />
      <ellipse cx="128" cy="162" rx="12" ry="8" fill="url(#lola-cheek)" />

      {/* Eyebrows */}
      <g transform={`translate(0, ${browY})`}>
        <path d="M 70,118 Q 80,113 90,116" fill="none" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 110,116 Q 120,113 130,118" fill="none" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Eyes */}
      <g>
        {/* Left eye */}
        <ellipse cx="80" cy="135" rx="10" ry={eyeRY} fill="white" />
        {blinking ? null : (
          <>
            <ellipse cx="81" cy="135" rx="5.5" ry="5.5" fill="url(#lola-eye-iris)" />
            <circle cx="81" cy="134" r="3" fill="#1a1a1a" />
            <circle cx="83" cy="132" r="1.2" fill="white" opacity="0.9" />
            <circle cx="79" cy="136" r="0.7" fill="white" opacity="0.5" />
          </>
        )}
        {/* Upper eyelid line */}
        <path d={`M 70,${135 - eyeRY} Q 80,${130 - eyeRY} 90,${135 - eyeRY}`}
          fill="none" stroke="#4a3728" strokeWidth="1.2" />
        {/* Lower lashes */}
        <path d={`M 72,${135 + eyeRY - 1} Q 80,${137 + eyeRY - 2} 88,${135 + eyeRY - 1}`}
          fill="none" stroke="#4a3728" strokeWidth="0.6" opacity="0.4" />

        {/* Right eye */}
        <ellipse cx="120" cy="135" rx="10" ry={eyeRY} fill="white" />
        {blinking ? null : (
          <>
            <ellipse cx="119" cy="135" rx="5.5" ry="5.5" fill="url(#lola-eye-iris)" />
            <circle cx="119" cy="134" r="3" fill="#1a1a1a" />
            <circle cx="121" cy="132" r="1.2" fill="white" opacity="0.9" />
            <circle cx="117" cy="136" r="0.7" fill="white" opacity="0.5" />
          </>
        )}
        <path d={`M 110,${135 - eyeRY} Q 120,${130 - eyeRY} 130,${135 - eyeRY}`}
          fill="none" stroke="#4a3728" strokeWidth="1.2" />
        <path d={`M 112,${135 + eyeRY - 1} Q 120,${137 + eyeRY - 2} 128,${135 + eyeRY - 1}`}
          fill="none" stroke="#4a3728" strokeWidth="0.6" opacity="0.4" />
      </g>

      {/* Nose */}
      <path d="M 98,148 Q 96,155 93,160 Q 97,163 100,163 Q 103,163 107,160 Q 104,155 102,148"
        fill="none" stroke="#d4a88a" strokeWidth="1" opacity="0.5" />
      <circle cx="95" cy="160" r="1.5" fill="#d4a88a" opacity="0.3" />
      <circle cx="105" cy="160" r="1.5" fill="#d4a88a" opacity="0.3" />

      {/* Mouth */}
      <path d={mouthPaths[mouthState]}
        fill={mouthState === 'closed' ? 'none' : 'url(#lola-lip)'}
        stroke={mouthState === 'closed' ? '#b87070' : '#a05555'}
        strokeWidth={mouthState === 'closed' ? '1.5' : '1'}
      />
      {/* Teeth hint when open */}
      {mouthState === 'open' && (
        <path d="M 90,180 Q 100,178 110,180" fill="white" opacity="0.8" />
      )}
      {/* Smile lines */}
      {(expression === 'smiling' || smileExtra > 0) && (
        <>
          <path d="M 82,175 Q 80,180 82,184" fill="none" stroke="#d4a88a" strokeWidth="0.6" opacity="0.4" />
          <path d="M 118,175 Q 120,180 118,184" fill="none" stroke="#d4a88a" strokeWidth="0.6" opacity="0.4" />
        </>
      )}
    </svg>
  )
}
