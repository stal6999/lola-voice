'use client'

import React from 'react'

interface LolaAvatarProps {
  mouthState: 'closed' | 'half' | 'open'
  blinking: boolean
  expression: 'neutral' | 'listening' | 'thinking' | 'smiling'
  width?: number
  breathPhase?: number // 0-1 for breathing animation
}

export default function LolaAvatar({ mouthState, blinking, expression, width = 280, breathPhase = 0 }: LolaAvatarProps) {
  const h = width * 1.6

  // Breathing offset
  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.5
  const breathScale = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.003

  // Eye states
  const eyeH = blinking ? 0.8 : expression === 'listening' ? 14 : 12
  const eyeRY = blinking ? 0.4 : expression === 'listening' ? 7 : 6
  const pupilShift = expression === 'thinking' ? -3 : 0

  // Mouth paths with more detail
  const mouthPaths: Record<string, string> = {
    closed: 'M 88,178 Q 94,182 100,183 Q 106,182 112,178',
    half: 'M 85,177 Q 93,183 100,185 Q 107,183 115,177 Q 107,181 100,182 Q 93,181 85,177',
    open: 'M 83,175 Q 92,190 100,193 Q 108,190 117,175 Q 108,185 100,187 Q 92,185 83,175',
  }

  // Head tilt based on expression
  const headTilt = expression === 'listening' ? 2 : expression === 'thinking' ? -3 : 0

  return (
    <svg viewBox="0 0 200 320" width={width} height={h} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>
      <defs>
        {/* Advanced skin gradient with subsurface scattering simulation */}
        <radialGradient id="la-skin" cx="48%" cy="38%" r="55%" fx="45%" fy="35%">
          <stop offset="0%" stopColor="#fce4d0" />
          <stop offset="30%" stopColor="#f5d5b8" />
          <stop offset="65%" stopColor="#ecc5a0" />
          <stop offset="100%" stopColor="#ddb08a" />
        </radialGradient>
        <radialGradient id="la-skin-warm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,200,180,0.12)" />
          <stop offset="100%" stopColor="rgba(255,200,180,0)" />
        </radialGradient>

        {/* Hair with multi-stop richness */}
        <linearGradient id="la-hair" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#5a3e2b" />
          <stop offset="25%" stopColor="#6b4a34" />
          <stop offset="50%" stopColor="#5c4033" />
          <stop offset="75%" stopColor="#4a3528" />
          <stop offset="100%" stopColor="#3d2b1f" />
        </linearGradient>
        <linearGradient id="la-hair-shine" x1="30%" y1="0%" x2="70%" y2="40%">
          <stop offset="0%" stopColor="rgba(180,140,100,0)" />
          <stop offset="40%" stopColor="rgba(180,140,100,0.25)" />
          <stop offset="60%" stopColor="rgba(180,140,100,0.15)" />
          <stop offset="100%" stopColor="rgba(180,140,100,0)" />
        </linearGradient>

        {/* Clothing */}
        <linearGradient id="la-blazer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2f3347" />
          <stop offset="40%" stopColor="#282c3e" />
          <stop offset="100%" stopColor="#1e2030" />
        </linearGradient>
        <linearGradient id="la-collar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#182045" />
          <stop offset="100%" stopColor="#0d1530" />
        </linearGradient>

        {/* Eye iris — rich amber/gold with depth */}
        <radialGradient id="la-iris" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#e8c06a" />
          <stop offset="30%" stopColor="#d4a040" />
          <stop offset="60%" stopColor="#b8863a" />
          <stop offset="80%" stopColor="#8a6420" />
          <stop offset="100%" stopColor="#6a4a15" />
        </radialGradient>
        <radialGradient id="la-iris-ring" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="rgba(0,0,0,0)" />
          <stop offset="90%" stopColor="rgba(80,60,20,0.4)" />
          <stop offset="100%" stopColor="rgba(60,40,10,0.6)" />
        </radialGradient>

        {/* Cheek blush */}
        <radialGradient id="la-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,130,130,0.22)" />
          <stop offset="60%" stopColor="rgba(220,140,140,0.08)" />
          <stop offset="100%" stopColor="rgba(220,140,140,0)" />
        </radialGradient>

        {/* Lip gradient */}
        <linearGradient id="la-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d07070" />
          <stop offset="40%" stopColor="#c06060" />
          <stop offset="100%" stopColor="#a85050" />
        </linearGradient>
        <radialGradient id="la-lip-shine" cx="50%" cy="20%" r="50%">
          <stop offset="0%" stopColor="rgba(255,200,200,0.3)" />
          <stop offset="100%" stopColor="rgba(255,200,200,0)" />
        </radialGradient>

        {/* Pendant */}
        <linearGradient id="la-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0D878" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A08030" />
        </linearGradient>

        {/* Ambient light from screens on face */}
        <radialGradient id="la-screen-light" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="rgba(100,140,200,0.06)" />
          <stop offset="100%" stopColor="rgba(100,140,200,0)" />
        </radialGradient>

        {/* Nose shadow */}
        <linearGradient id="la-nose-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(180,140,110,0.15)" />
          <stop offset="100%" stopColor="rgba(180,140,110,0)" />
        </linearGradient>

        {/* SVG filters */}
        <filter id="la-soft-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
        </filter>
        <filter id="la-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="la-hair-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g transform={`translate(0, ${breathY}) rotate(${headTilt}, 100, 160)`}>

        {/* ── BODY ── */}
        {/* Neck with subtle shadow */}
        <path d="M 88,198 L 88,228 Q 88,238 83,243 L 117,243 Q 112,238 112,228 L 112,198"
          fill="url(#la-skin)" />
        <ellipse cx="100" cy="198" rx="13" ry="3" fill="rgba(200,160,130,0.15)" />

        {/* Shoulders — blazer with structure */}
        <path d="M 38,320 L 38,268 Q 38,248 58,243 L 83,240 L 100,254 L 117,240 L 142,243 Q 162,248 162,268 L 162,320 Z"
          fill="url(#la-blazer)" filter="url(#la-soft-shadow)" />

        {/* Blazer shoulder seam lines */}
        <path d="M 58,243 Q 68,252 72,265" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <path d="M 142,243 Q 132,252 128,265" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* Turtleneck with ribbing */}
        <path d="M 83,240 L 83,222 Q 83,215 90,215 L 110,215 Q 117,215 117,222 L 117,240 L 100,254 Z"
          fill="url(#la-collar)" />
        {/* Ribbing lines */}
        {[0,1,2,3].map(i => (
          <line key={`rib${i}`} x1="86" y1={218 + i * 5} x2="114" y2={218 + i * 5}
            stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}

        {/* Blazer lapels with depth */}
        <path d="M 83,240 L 72,260 L 76,320 L 100,320 L 100,254 Z" fill="#2a2e40" />
        <path d="M 117,240 L 128,260 L 124,320 L 100,320 L 100,254 Z" fill="#2a2e40" />
        {/* Lapel edge highlights */}
        <path d="M 83,240 L 72,260" fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
        <path d="M 117,240 L 128,260" fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />

        {/* Necklace chain */}
        <path d="M 93,222 Q 96,228 100,233 Q 104,228 107,222" fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5" />
        {/* Pendant — detailed diamond shape */}
        <path d="M 100,233 L 96,237 L 100,242 L 104,237 Z" fill="url(#la-gold)" />
        <path d="M 100,233 L 100,242" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
        {/* Pendant sparkle */}
        <circle cx="99" cy="236" r="0.5" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* ── HEAD ── */}
        {/* Hair behind — with volume */}
        <ellipse cx="100" cy="118" rx="64" ry="74" fill="url(#la-hair)" />

        {/* Face — layered for realism */}
        <path d="M 54,128 Q 54,86 74,68 Q 88,56 100,56 Q 112,56 126,68 Q 146,86 146,128 Q 146,168 126,186 Q 113,196 100,198 Q 87,196 74,186 Q 54,168 54,128 Z"
          fill="url(#la-skin)" filter="url(#la-soft-shadow)" />

        {/* Skin warmth layer */}
        <path d="M 54,128 Q 54,86 74,68 Q 88,56 100,56 Q 112,56 126,68 Q 146,86 146,128 Q 146,168 126,186 Q 113,196 100,198 Q 87,196 74,186 Q 54,168 54,128 Z"
          fill="url(#la-skin-warm)" />

        {/* Screen light reflection on face */}
        <path d="M 54,128 Q 54,86 74,68 Q 88,56 100,56 Q 112,56 126,68 Q 146,86 146,128 Q 146,168 126,186 Q 113,196 100,198 Q 87,196 74,186 Q 54,168 54,128 Z"
          fill="url(#la-screen-light)" />

        {/* Jaw/chin shadow */}
        <path d="M 70,180 Q 85,195 100,198 Q 115,195 130,180"
          fill="none" stroke="rgba(180,140,110,0.12)" strokeWidth="2" />

        {/* ── HAIR FRONT ── */}
        {/* Main hair sweep */}
        <path d="M 56,112 Q 52,78 70,60 Q 84,48 100,46 Q 118,46 134,60 Q 150,76 148,108 Q 146,92 136,80 Q 126,70 116,70 Q 108,70 100,76 Q 90,68 78,70 Q 64,73 58,92 Z"
          fill="url(#la-hair)" />

        {/* Hair shine highlight */}
        <path d="M 70,65 Q 85,52 100,50 Q 115,52 128,62 Q 115,55 100,53 Q 85,55 70,65 Z"
          fill="url(#la-hair-shine)" />

        {/* Left side volume */}
        <path d="M 56,112 Q 50,88 58,68 Q 53,82 52,98 Q 51,110 54,124 Q 53,118 56,112 Z"
          fill="#3d2b1f" opacity="0.7" />

        {/* Right side flowing hair */}
        <path d="M 148,108 Q 152,92 150,78 Q 154,93 153,112 Q 152,130 148,145 Q 150,132 148,108 Z"
          fill="#4a3728" opacity="0.5" />
        <path d="M 148,145 Q 155,165 158,190 Q 160,210 157,230 Q 153,245 148,250 Q 152,238 152,218 Q 152,195 147,175 Q 143,158 146,145 Z"
          fill="url(#la-hair)" />

        {/* Strand details */}
        <path d="M 62,85 Q 60,95 58,108" fill="none" stroke="rgba(100,70,45,0.3)" strokeWidth="0.5" />
        <path d="M 75,62 Q 72,72 70,85" fill="none" stroke="rgba(120,85,55,0.2)" strokeWidth="0.5" />
        <path d="M 140,72 Q 145,85 147,100" fill="none" stroke="rgba(100,70,45,0.2)" strokeWidth="0.5" />

        {/* ── FACE DETAILS ── */}
        {/* Cheek blush */}
        <ellipse cx="70" cy="160" rx="14" ry="9" fill="url(#la-blush)" />
        <ellipse cx="130" cy="160" rx="14" ry="9" fill="url(#la-blush)" />

        {/* Eyebrows — natural arch */}
        <g transform={`translate(0, ${expression === 'listening' ? -2 : expression === 'thinking' ? -1 : 0})`}>
          <path d="M 67,116 Q 73,111 80,112 Q 85,113 90,115"
            fill="none" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
          <path d="M 110,115 Q 115,113 120,112 Q 127,111 133,116"
            fill="none" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
          {/* Brow fill for volume */}
          <path d="M 68,117 Q 73,112 80,113 Q 85,114 89,116 Q 85,115 80,114 Q 73,113 68,117 Z"
            fill="#4a3728" opacity="0.3" />
          <path d="M 111,116 Q 115,114 120,113 Q 127,112 132,117 Q 127,113 120,114 Q 115,115 111,116 Z"
            fill="#4a3728" opacity="0.3" />
        </g>

        {/* Eyes — detailed with depth */}
        <g>
          {/* Left eye */}
          {/* Eye socket shadow */}
          <ellipse cx="80" cy="133" rx="14" ry="10" fill="rgba(180,140,120,0.08)" />

          {/* White of eye */}
          <ellipse cx="80" cy="135" rx="11" ry={eyeRY + 1} fill="#f8f5f0" />

          {blinking ? (
            /* Closed eye — lash line */
            <path d="M 69,135 Q 80,137 91,135" fill="none" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <>
              {/* Iris */}
              <ellipse cx={80 + pupilShift * 0.5} cy="135" rx="6.5" ry="6.5" fill="url(#la-iris)" />
              {/* Iris ring */}
              <ellipse cx={80 + pupilShift * 0.5} cy="135" rx="6.5" ry="6.5" fill="url(#la-iris-ring)" />
              {/* Iris texture lines */}
              {[0,1,2,3,4,5].map(i => {
                const angle = (i / 6) * Math.PI * 2
                const ix = (80 + pupilShift * 0.5) + Math.cos(angle) * 2.5
                const iy = 135 + Math.sin(angle) * 2.5
                const ox = (80 + pupilShift * 0.5) + Math.cos(angle) * 5.5
                const oy = 135 + Math.sin(angle) * 5.5
                return <line key={`il${i}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(180,140,60,0.15)" strokeWidth="0.3" />
              })}
              {/* Pupil */}
              <circle cx={80 + pupilShift * 0.5} cy="135" r="3.2" fill="#1a1408" />
              {/* Reflections */}
              <circle cx={82 + pupilShift * 0.5} cy="132" r="1.8" fill="white" opacity="0.9" />
              <circle cx={78 + pupilShift * 0.5} cy="137" r="0.8" fill="white" opacity="0.4" />
              {/* Screen reflection in eye */}
              <rect x={77 + pupilShift * 0.5} y="133" width="2" height="1" rx="0.3" fill="rgba(100,150,220,0.15)" />
            </>
          )}

          {/* Upper eyelid */}
          <path d={`M 69,${135 - eyeRY - 0.5} Q 80,${129 - eyeRY} 91,${135 - eyeRY - 0.5}`}
            fill="none" stroke="#4a3728" strokeWidth="1.3" strokeLinecap="round" />
          {/* Eyelashes top */}
          <path d={`M 69,${135 - eyeRY - 1} Q 67,${133 - eyeRY} 66,${131 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.6" />
          <path d={`M 91,${135 - eyeRY - 1} Q 92,${133 - eyeRY} 92,${131 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.5" />
          {/* Lower lash line */}
          <path d={`M 71,${135 + eyeRY - 1} Q 80,${137 + eyeRY - 2} 89,${135 + eyeRY - 1}`}
            fill="none" stroke="#4a3728" strokeWidth="0.5" opacity="0.35" />
          {/* Eyelid crease */}
          <path d={`M 71,${128 - eyeRY * 0.3} Q 80,${124 - eyeRY * 0.3} 89,${128 - eyeRY * 0.3}`}
            fill="none" stroke="rgba(180,140,120,0.15)" strokeWidth="0.5" />

          {/* Right eye — mirror */}
          <ellipse cx="120" cy="133" rx="14" ry="10" fill="rgba(180,140,120,0.08)" />
          <ellipse cx="120" cy="135" rx="11" ry={eyeRY + 1} fill="#f8f5f0" />

          {blinking ? (
            <path d="M 109,135 Q 120,137 131,135" fill="none" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx={120 + pupilShift * 0.5} cy="135" rx="6.5" ry="6.5" fill="url(#la-iris)" />
              <ellipse cx={120 + pupilShift * 0.5} cy="135" rx="6.5" ry="6.5" fill="url(#la-iris-ring)" />
              {[0,1,2,3,4,5].map(i => {
                const angle = (i / 6) * Math.PI * 2
                const ix = (120 + pupilShift * 0.5) + Math.cos(angle) * 2.5
                const iy = 135 + Math.sin(angle) * 2.5
                const ox = (120 + pupilShift * 0.5) + Math.cos(angle) * 5.5
                const oy = 135 + Math.sin(angle) * 5.5
                return <line key={`ir${i}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(180,140,60,0.15)" strokeWidth="0.3" />
              })}
              <circle cx={120 + pupilShift * 0.5} cy="135" r="3.2" fill="#1a1408" />
              <circle cx={122 + pupilShift * 0.5} cy="132" r="1.8" fill="white" opacity="0.9" />
              <circle cx={118 + pupilShift * 0.5} cy="137" r="0.8" fill="white" opacity="0.4" />
              <rect x={117 + pupilShift * 0.5} y="133" width="2" height="1" rx="0.3" fill="rgba(100,150,220,0.15)" />
            </>
          )}

          <path d={`M 109,${135 - eyeRY - 0.5} Q 120,${129 - eyeRY} 131,${135 - eyeRY - 0.5}`}
            fill="none" stroke="#4a3728" strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M 109,${135 - eyeRY - 1} Q 108,${133 - eyeRY} 107,${131 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.6" />
          <path d={`M 131,${135 - eyeRY - 1} Q 132,${133 - eyeRY} 133,${131 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.5" />
          <path d={`M 111,${135 + eyeRY - 1} Q 120,${137 + eyeRY - 2} 129,${135 + eyeRY - 1}`}
            fill="none" stroke="#4a3728" strokeWidth="0.5" opacity="0.35" />
          <path d={`M 111,${128 - eyeRY * 0.3} Q 120,${124 - eyeRY * 0.3} 129,${128 - eyeRY * 0.3}`}
            fill="none" stroke="rgba(180,140,120,0.15)" strokeWidth="0.5" />
        </g>

        {/* Nose — refined with bridge and tip */}
        <path d="M 99,130 Q 98,140 97,148 Q 96,153 93,158"
          fill="none" stroke="url(#la-nose-shadow)" strokeWidth="1" />
        <path d="M 93,158 Q 95,162 100,163 Q 105,162 107,158"
          fill="none" stroke="rgba(180,140,110,0.25)" strokeWidth="0.8" />
        {/* Nostril hints */}
        <ellipse cx="95" cy="160" rx="2" ry="1.2" fill="rgba(180,140,110,0.12)" />
        <ellipse cx="105" cy="160" rx="2" ry="1.2" fill="rgba(180,140,110,0.12)" />
        {/* Nose tip highlight */}
        <circle cx="100" cy="157" r="2" fill="rgba(255,230,210,0.15)" />

        {/* Mouth — detailed with lip texture */}
        <path d={mouthPaths[mouthState]}
          fill={mouthState === 'closed' ? 'none' : 'url(#la-lip)'}
          stroke={mouthState === 'closed' ? '#b87070' : 'none'}
          strokeWidth={mouthState === 'closed' ? '1.3' : '0'}
        />
        {/* Upper lip line */}
        {mouthState !== 'closed' && (
          <path d={mouthState === 'half'
            ? 'M 85,177 Q 93,183 100,185 Q 107,183 115,177'
            : 'M 83,175 Q 92,190 100,193 Q 108,190 117,175'}
            fill="none" stroke="#a05555" strokeWidth="0.8" />
        )}
        {/* Lip shine */}
        {mouthState !== 'closed' && (
          <ellipse cx="100" cy={mouthState === 'half' ? 180 : 182} rx="6" ry="2"
            fill="url(#la-lip-shine)" />
        )}
        {/* Teeth when open */}
        {mouthState === 'open' && (
          <>
            <path d="M 90,180 Q 100,177 110,180" fill="#f5f0eb" opacity="0.85" />
            <line x1="95" y1="178" x2="95" y2="180" stroke="rgba(200,190,180,0.3)" strokeWidth="0.3" />
            <line x1="100" y1="177" x2="100" y2="180" stroke="rgba(200,190,180,0.3)" strokeWidth="0.3" />
            <line x1="105" y1="178" x2="105" y2="180" stroke="rgba(200,190,180,0.3)" strokeWidth="0.3" />
          </>
        )}
        {/* Closed mouth — cupid bow */}
        {mouthState === 'closed' && (
          <path d="M 96,177 Q 98,175 100,176 Q 102,175 104,177"
            fill="none" stroke="rgba(180,100,100,0.3)" strokeWidth="0.5" />
        )}

        {/* Smile dimples */}
        {expression === 'smiling' && (
          <>
            <path d="M 80,174 Q 78,178 80,182" fill="none" stroke="rgba(180,140,120,0.15)" strokeWidth="0.6" />
            <path d="M 120,174 Q 122,178 120,182" fill="none" stroke="rgba(180,140,120,0.15)" strokeWidth="0.6" />
          </>
        )}

        {/* Chin subtle */}
        <ellipse cx="100" cy="193" rx="6" ry="3" fill="rgba(255,230,210,0.06)" />

      </g>
    </svg>
  )
}
