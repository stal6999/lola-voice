'use client'

import React from 'react'

interface LolaFullBodyProps {
  mouthState: 'closed' | 'half' | 'open'
  blinking: boolean
  expression: 'neutral' | 'listening' | 'thinking' | 'smiling'
  breathPhase?: number
  headTiltX?: number
  eyeShiftX?: number
  eyeShiftY?: number
  microExpression?: 'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'
  width?: number
  speaking?: boolean
  listening?: boolean
}

export default function LolaFullBody({
  mouthState, blinking, expression, breathPhase = 0,
  headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', width = 220,
  speaking = false, listening = false,
}: LolaFullBodyProps) {
  const h = width * 2.1

  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.2
  const headTilt = (expression === 'listening' ? 3 : expression === 'thinking' ? -2 : 0) + headTiltX
  const eyeRY = blinking ? 0.3 : expression === 'listening' ? 7 : 6
  const pupilX = eyeShiftX * 0.7
  const pupilY = eyeShiftY * 0.7
  const browY = (microExpression === 'brow-raise' ? -3 : 0) + (expression === 'listening' ? -1 : 0)

  const mouthPath = {
    closed: microExpression === 'slight-smile'
      ? 'M 86,177 Q 94,183 100,184 Q 106,183 114,177'
      : 'M 88,178 Q 94,182 100,183 Q 106,182 112,178',
    half: 'M 85,177 Q 93,184 100,186 Q 107,184 115,177 Q 107,182 100,183 Q 93,182 85,177',
    open: 'M 83,175 Q 92,192 100,195 Q 108,192 117,175 Q 108,186 100,188 Q 92,186 83,175',
  }[mouthState]

  return (
    <svg viewBox="0 0 200 420" width={width} height={h} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))', overflow: 'visible' }}>
      <defs>
        {/* Skin */}
        <radialGradient id="lf-skin" cx="45%" cy="35%" r="58%" fx="42%" fy="30%">
          <stop offset="0%" stopColor="#fde8d0" />
          <stop offset="35%" stopColor="#f5d5b8" />
          <stop offset="70%" stopColor="#ecc4a0" />
          <stop offset="100%" stopColor="#dcb08a" />
        </radialGradient>
        <radialGradient id="lf-skin-neck" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#f5d5b8" />
          <stop offset="100%" stopColor="#e0b898" />
        </radialGradient>
        <radialGradient id="lf-skin-arm" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#f5d5b8" />
          <stop offset="100%" stopColor="#ddb08a" />
        </radialGradient>
        <radialGradient id="lf-skin-hand" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fde8d0" />
          <stop offset="100%" stopColor="#e0b898" />
        </radialGradient>

        {/* Hair */}
        <linearGradient id="lf-hair" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#5a3e2b" />
          <stop offset="30%" stopColor="#6b4a34" />
          <stop offset="65%" stopColor="#4a3528" />
          <stop offset="100%" stopColor="#3a2515" />
        </linearGradient>
        <linearGradient id="lf-hair-shine" x1="25%" y1="0%" x2="65%" y2="35%">
          <stop offset="0%" stopColor="rgba(180,140,95,0)" />
          <stop offset="45%" stopColor="rgba(180,140,95,0.28)" />
          <stop offset="100%" stopColor="rgba(180,140,95,0)" />
        </linearGradient>

        {/* Clothing */}
        <linearGradient id="lf-blazer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2f3450" />
          <stop offset="50%" stopColor="#242840" />
          <stop offset="100%" stopColor="#1a1e32" />
        </linearGradient>
        <linearGradient id="lf-blazer-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#282c42" />
          <stop offset="100%" stopColor="#1c2035" />
        </linearGradient>
        <linearGradient id="lf-turtleneck" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2248" />
          <stop offset="100%" stopColor="#0d1530" />
        </linearGradient>
        <linearGradient id="lf-pants" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1e32" />
          <stop offset="100%" stopColor="#111428" />
        </linearGradient>
        <linearGradient id="lf-shoes" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1818" />
          <stop offset="100%" stopColor="#0a0808" />
        </linearGradient>

        {/* Eyes */}
        <radialGradient id="lf-iris" cx="42%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#e8c06a" />
          <stop offset="25%" stopColor="#d4a040" />
          <stop offset="55%" stopColor="#b88035" />
          <stop offset="80%" stopColor="#8a6020" />
          <stop offset="100%" stopColor="#6a4810" />
        </radialGradient>

        {/* Gold */}
        <linearGradient id="lf-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d878" />
          <stop offset="50%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#a08030" />
        </linearGradient>

        {/* Lips */}
        <linearGradient id="lf-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d07575" />
          <stop offset="100%" stopColor="#a85555" />
        </linearGradient>

        {/* Blush */}
        <radialGradient id="lf-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,130,130,0.22)" />
          <stop offset="100%" stopColor="rgba(220,130,130,0)" />
        </radialGradient>

        {/* Nose shadow */}
        <linearGradient id="lf-nose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(180,140,110,0.2)" />
          <stop offset="100%" stopColor="rgba(180,140,110,0)" />
        </linearGradient>

        {/* Filters */}
        <filter id="lf-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.2" />
        </filter>
        <filter id="lf-glow-gold">
          <feGaussianBlur stdDeviation="2" />
        </filter>

        {/* Floor shadow */}
        <radialGradient id="lf-floor-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <g transform={`translate(0, ${breathY})`}>

        {/* ── LEGS ── */}
        {/* Left leg */}
        <path d="M 78,285 L 74,370 Q 74,378 80,380 L 92,380 Q 96,378 95,370 L 95,285 Z"
          fill="url(#lf-pants)" />
        {/* Right leg */}
        <path d="M 105,285 L 105,370 Q 105,378 108,380 L 120,380 Q 126,378 126,370 L 122,285 Z"
          fill="url(#lf-pants)" />

        {/* Left shoe */}
        <path d="M 74,372 Q 70,376 66,382 Q 65,388 72,390 L 96,390 Q 100,388 98,382 Q 96,378 93,374 Z"
          fill="url(#lf-shoes)" filter="url(#lf-shadow)" />
        {/* Shoe highlight */}
        <path d="M 70,380 Q 78,376 86,378" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Right shoe */}
        <path d="M 105,374 Q 103,378 102,382 Q 100,388 104,390 L 128,390 Q 134,388 134,382 Q 132,376 128,372 Z"
          fill="url(#lf-shoes)" filter="url(#lf-shadow)" />
        <path d="M 106,380 Q 114,376 122,378" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Floor shadow under feet */}
        <ellipse cx="100" cy="395" rx="42" ry="8" fill="url(#lf-floor-shadow)" />

        {/* ── BODY ── */}
        {/* Main torso */}
        <path d="M 60,200 Q 56,220 55,250 Q 54,270 56,285 L 144,285 Q 146,270 145,250 Q 144,220 140,200 Q 130,192 100,190 Q 70,192 60,200 Z"
          fill="url(#lf-blazer)" filter="url(#lf-shadow)" />

        {/* Blazer lapel left */}
        <path d="M 60,200 L 55,220 L 60,240 L 75,250 L 86,220 L 82,200 Z"
          fill="url(#lf-blazer-left)" />
        <path d="M 60,200 L 55,220 L 60,240" fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="0.8" />

        {/* Blazer lapel right */}
        <path d="M 140,200 L 145,220 L 140,240 L 125,250 L 114,220 L 118,200 Z"
          fill="url(#lf-blazer-left)" />
        <path d="M 140,200 L 145,220 L 140,240" fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="0.8" />

        {/* Turtleneck visible */}
        <path d="M 86,198 L 86,215 Q 86,220 92,222 L 108,222 Q 114,220 114,215 L 114,198 Q 107,194 100,194 Q 93,194 86,198 Z"
          fill="url(#lf-turtleneck)" />
        {/* Ribbing */}
        {[0,1,2].map(i => (
          <line key={`rb${i}`} x1="89" y1={202 + i * 5} x2="111" y2={202 + i * 5}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        ))}

        {/* Pendant */}
        <path d="M 96,222 Q 98,228 100,232 Q 102,228 104,222"
          fill="none" stroke="#C9A84C" strokeWidth="0.7" opacity="0.6" />
        <path d="M 100,232 L 97,236 L 100,241 L 103,236 Z" fill="url(#lf-gold)" />
        <circle cx="99.5" cy="235" r="0.7" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Pocket square hint */}
        <path d="M 126,218 L 130,218 L 132,214 L 128,213 Z" fill="rgba(201,168,76,0.15)" />

        {/* ── ARMS ── */}
        {/* Left arm — légèrement levé pour attitude naturelle */}
        <path d="M 60,202 Q 45,210 38,225 Q 34,238 38,248 Q 44,258 52,262 L 56,255 Q 50,250 48,240 Q 46,230 52,220 Q 58,212 68,208 Z"
          fill="url(#lf-blazer)" />
        {/* Left forearm */}
        <path d="M 38,248 Q 34,262 36,275 Q 38,284 46,286 L 52,278 Q 46,276 45,268 Q 44,258 52,262 Z"
          fill="url(#lf-blazer)" />
        {/* Left hand */}
        <path d="M 36,275 Q 32,280 34,287 Q 36,294 44,294 Q 50,294 52,288 Q 54,282 50,278 Z"
          fill="url(#lf-skin-hand)" />
        {/* Fingers hint */}
        {[0,1,2].map(i => (
          <path key={`lf${i}`} d={`M ${36 + i * 5},285 Q ${36 + i * 5},294 ${38 + i * 5},296`}
            fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.5" />
        ))}

        {/* Right arm — légèrement levé, geste naturel */}
        <path d="M 140,202 Q 155,210 162,225 Q 166,238 162,248 Q 156,258 148,262 L 144,255 Q 150,250 152,240 Q 154,230 148,220 Q 142,212 132,208 Z"
          fill="url(#lf-blazer)" />
        {/* Right forearm */}
        <path d="M 162,248 Q 166,260 165,272 Q 163,282 155,285 L 150,278 Q 156,276 157,266 Q 158,256 152,262 Z"
          fill="url(#lf-blazer)" />
        {/* Right hand — légèrement levée, accueil */}
        <path d="M 164,272 Q 168,278 167,286 Q 165,293 158,294 Q 152,294 150,288 Q 148,282 152,278 Z"
          fill="url(#lf-skin-hand)" />
        {[0,1,2].map(i => (
          <path key={`rf${i}`} d={`M ${165 - i * 5},283 Q ${166 - i * 5},292 ${164 - i * 5},295`}
            fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.5" />
        ))}

        {/* ── NECK ── */}
        <path d="M 88,196 L 88,210 Q 88,216 94,218 L 106,218 Q 112,216 112,210 L 112,196"
          fill="url(#lf-skin-neck)" />

        {/* ── HEAD ── */}
        <g transform={`rotate(${headTilt}, 100, 160)`}>

          {/* Hair behind */}
          <ellipse cx="100" cy="118" rx="63" ry="73" fill="url(#lf-hair)" />

          {/* Face shape */}
          <path d="M 53,128 Q 53,84 73,66 Q 87,53 100,53 Q 113,53 127,66 Q 147,84 147,128 Q 147,170 127,188 Q 114,198 100,200 Q 86,198 73,188 Q 53,170 53,128 Z"
            fill="url(#lf-skin)" filter="url(#lf-shadow)" />

          {/* Warm overlay */}
          <path d="M 53,128 Q 53,84 73,66 Q 87,53 100,53 Q 113,53 127,66 Q 147,84 147,128 Q 147,170 127,188 Q 114,198 100,200 Q 86,198 73,188 Q 53,170 53,128 Z"
            fill="rgba(255,200,170,0.06)" />

          {/* ── HAIR FRONT ── */}
          <path d="M 55,112 Q 51,76 70,58 Q 84,45 100,43 Q 116,43 130,56 Q 148,74 146,110 Q 143,90 134,78 Q 124,68 114,68 Q 106,68 100,74 Q 90,66 78,68 Q 64,72 57,90 Z"
            fill="url(#lf-hair)" />
          {/* Hair shine */}
          <path d="M 68,62 Q 82,50 100,48 Q 116,50 128,60 Q 114,54 100,52 Q 86,54 68,62 Z"
            fill="url(#lf-hair-shine)" />
          {/* Side volume */}
          <path d="M 55,112 Q 49,86 57,66 Q 52,80 50,98 Q 49,112 52,126 Z" fill="#3d2b1f" opacity="0.65" />
          {/* Right flowing hair */}
          <path d="M 147,110 Q 152,90 150,74 Q 155,90 154,112 Q 153,132 148,148 Q 151,130 147,110 Z"
            fill="#4a3728" opacity="0.5" />
          <path d="M 148,148 Q 156,168 158,195 Q 160,218 156,240 Q 152,256 148,260 Q 153,245 153,224 Q 153,200 147,180 Q 142,162 145,148 Z"
            fill="url(#lf-hair)" />
          {/* Strand details */}
          <path d="M 62,82 Q 60,94 58,108" fill="none" stroke="rgba(90,60,40,0.25)" strokeWidth="0.5" />
          <path d="M 76,60 Q 73,72 72,84" fill="none" stroke="rgba(110,75,50,0.2)" strokeWidth="0.5" />
          <path d="M 142,70 Q 147,83 148,98" fill="none" stroke="rgba(90,60,40,0.18)" strokeWidth="0.5" />

          {/* ── FACE ── */}
          {/* Cheeks */}
          <ellipse cx="70" cy="160" rx="14" ry="9" fill="url(#lf-blush)" />
          <ellipse cx="130" cy="160" rx="14" ry="9" fill="url(#lf-blush)" />

          {/* Eyebrows */}
          <g transform={`translate(0, ${browY})`}>
            <path d="M 66,115 Q 73,109 81,110 Q 87,111 91,114"
              fill="none" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 109,114 Q 113,111 119,110 Q 127,109 134,115"
              fill="none" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" />
            {/* Brow fill */}
            <path d="M 67,116 Q 73,110 81,111 Q 87,112 90,115 Q 87,114 81,113 Q 73,112 67,116 Z"
              fill="#4a3728" opacity="0.28" />
            <path d="M 110,115 Q 113,112 119,111 Q 127,110 133,116 Q 127,112 119,112 Q 113,113 110,115 Z"
              fill="#4a3728" opacity="0.28" />
          </g>

          {/* ── EYES ── */}
          {/* Left eye socket shadow */}
          <ellipse cx="79" cy="132" rx="14" ry="10" fill="rgba(180,140,120,0.07)" />
          {/* Left white */}
          <ellipse cx="79" cy="134" rx="11" ry={eyeRY + 1} fill="#f8f5f2" />
          {blinking ? (
            <path d="M 68,134 Q 79,136 90,134" fill="none" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx={79 + pupilX} cy={134 + pupilY} rx="6.5" ry="6.5" fill="url(#lf-iris)" />
              <ellipse cx={79 + pupilX} cy={134 + pupilY} rx="6.5" ry="6.5"
                fill="none" stroke="rgba(80,55,15,0.5)" strokeWidth="0.5" />
              {[0,1,2,3,4,5].map(i => {
                const a = (i / 6) * Math.PI * 2
                return <line key={`li${i}`}
                  x1={(79 + pupilX) + Math.cos(a) * 2.5} y1={(134 + pupilY) + Math.sin(a) * 2.5}
                  x2={(79 + pupilX) + Math.cos(a) * 5.5} y2={(134 + pupilY) + Math.sin(a) * 5.5}
                  stroke="rgba(180,135,55,0.15)" strokeWidth="0.3" />
              })}
              <circle cx={79 + pupilX} cy={134 + pupilY} r="3.3" fill="#1a1408" />
              <circle cx={81 + pupilX} cy={131 + pupilY} r="1.9" fill="white" opacity="0.9" />
              <circle cx={77 + pupilX} cy={136 + pupilY} r="0.8" fill="white" opacity="0.4" />
              <rect x={76 + pupilX} y={132 + pupilY} width="2" height="1" rx="0.3" fill="rgba(100,150,230,0.12)" />
            </>
          )}
          <path d={`M 68,${134 - eyeRY - 0.5} Q 79,${128 - eyeRY} 90,${134 - eyeRY - 0.5}`}
            fill="none" stroke="#4a3728" strokeWidth="1.4" strokeLinecap="round" />
          {/* Lashes top left */}
          <path d={`M 68,${134 - eyeRY - 1} Q 66,${132 - eyeRY} 65,${130 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.7" />
          <path d={`M 72,${134 - eyeRY - 1.5} Q 71,${131 - eyeRY} 71,${128 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.5" />
          <path d={`M 90,${134 - eyeRY - 1} Q 91,${132 - eyeRY} 92,${130 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.6" />
          <path d={`M 70,${134 + eyeRY - 1} Q 79,${136 + eyeRY - 1} 88,${134 + eyeRY - 1}`}
            fill="none" stroke="#4a3728" strokeWidth="0.5" opacity="0.3" />
          <path d={`M 70,${127 - eyeRY * 0.4} Q 79,${123 - eyeRY * 0.4} 88,${127 - eyeRY * 0.4}`}
            fill="none" stroke="rgba(180,140,120,0.12)" strokeWidth="0.5" />

          {/* Right eye */}
          <ellipse cx="121" cy="132" rx="14" ry="10" fill="rgba(180,140,120,0.07)" />
          <ellipse cx="121" cy="134" rx="11" ry={eyeRY + 1} fill="#f8f5f2" />
          {blinking ? (
            <path d="M 110,134 Q 121,136 132,134" fill="none" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx={121 + pupilX} cy={134 + pupilY} rx="6.5" ry="6.5" fill="url(#lf-iris)" />
              <ellipse cx={121 + pupilX} cy={134 + pupilY} rx="6.5" ry="6.5"
                fill="none" stroke="rgba(80,55,15,0.5)" strokeWidth="0.5" />
              {[0,1,2,3,4,5].map(i => {
                const a = (i / 6) * Math.PI * 2
                return <line key={`ri${i}`}
                  x1={(121 + pupilX) + Math.cos(a) * 2.5} y1={(134 + pupilY) + Math.sin(a) * 2.5}
                  x2={(121 + pupilX) + Math.cos(a) * 5.5} y2={(134 + pupilY) + Math.sin(a) * 5.5}
                  stroke="rgba(180,135,55,0.15)" strokeWidth="0.3" />
              })}
              <circle cx={121 + pupilX} cy={134 + pupilY} r="3.3" fill="#1a1408" />
              <circle cx={123 + pupilX} cy={131 + pupilY} r="1.9" fill="white" opacity="0.9" />
              <circle cx={119 + pupilX} cy={136 + pupilY} r="0.8" fill="white" opacity="0.4" />
              <rect x={118 + pupilX} y={132 + pupilY} width="2" height="1" rx="0.3" fill="rgba(100,150,230,0.12)" />
            </>
          )}
          <path d={`M 110,${134 - eyeRY - 0.5} Q 121,${128 - eyeRY} 132,${134 - eyeRY - 0.5}`}
            fill="none" stroke="#4a3728" strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M 110,${134 - eyeRY - 1} Q 109,${132 - eyeRY} 108,${130 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.7" />
          <path d={`M 114,${134 - eyeRY - 1.5} Q 113,${131 - eyeRY} 113,${128 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.5" />
          <path d={`M 132,${134 - eyeRY - 1} Q 133,${132 - eyeRY} 134,${130 - eyeRY}`}
            fill="none" stroke="#3d2b1f" strokeWidth="0.6" />
          <path d={`M 112,${134 + eyeRY - 1} Q 121,${136 + eyeRY - 1} 130,${134 + eyeRY - 1}`}
            fill="none" stroke="#4a3728" strokeWidth="0.5" opacity="0.3" />

          {/* Nose */}
          <path d="M 99,130 Q 98,140 97,148 Q 96,153 93,158"
            fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" />
          <path d="M 93,158 Q 95,163 100,164 Q 105,163 107,158"
            fill="none" stroke="rgba(180,140,110,0.25)" strokeWidth="0.8" />
          <ellipse cx="94.5" cy="160" rx="2.2" ry="1.3" fill="rgba(180,140,110,0.12)" />
          <ellipse cx="105.5" cy="160" rx="2.2" ry="1.3" fill="rgba(180,140,110,0.12)" />
          <circle cx="100" cy="157" r="2" fill="rgba(255,235,215,0.12)" />

          {/* Mouth */}
          <path d={mouthPath}
            fill={mouthState === 'closed' ? 'none' : 'url(#lf-lip)'}
            stroke={mouthState === 'closed' ? '#b87070' : 'none'}
            strokeWidth={mouthState === 'closed' ? '1.4' : '0'} />
          {mouthState !== 'closed' && (
            <path d={mouthState === 'half'
              ? 'M 85,177 Q 93,184 100,186 Q 107,184 115,177'
              : 'M 83,175 Q 92,192 100,195 Q 108,192 117,175'}
              fill="none" stroke="#a05555" strokeWidth="0.8" />
          )}
          {mouthState === 'open' && (
            <>
              <path d="M 90,180 Q 100,177 110,180" fill="#f5f0eb" opacity="0.9" />
              {[93,98,103,108].map(x => (
                <line key={`t${x}`} x1={x} y1="178" x2={x} y2="180"
                  stroke="rgba(200,190,180,0.3)" strokeWidth="0.3" />
              ))}
            </>
          )}
          {mouthState === 'closed' && (
            <path d="M 96,176 Q 98,174 100,175 Q 102,174 104,176"
              fill="none" stroke="rgba(180,100,100,0.25)" strokeWidth="0.4" />
          )}
          {/* Smile dimples */}
          {(expression === 'smiling' || microExpression === 'slight-smile') && (
            <>
              <path d="M 79,174 Q 77,178 79,182" fill="none" stroke="rgba(180,140,120,0.18)" strokeWidth="0.6" />
              <path d="M 121,174 Q 123,178 121,182" fill="none" stroke="rgba(180,140,120,0.18)" strokeWidth="0.6" />
            </>
          )}

          {/* Chin */}
          <ellipse cx="100" cy="194" rx="7" ry="3" fill="rgba(255,225,205,0.07)" />

          {/* Listening glow around head */}
          {listening && (
            <circle cx="100" cy="128" r="72" fill="none"
              stroke="rgba(231,76,60,0.15)" strokeWidth="3">
              <animate attributeName="r" values="70;76;70" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Speaking glow */}
          {speaking && (
            <circle cx="100" cy="128" r="72" fill="none"
              stroke="rgba(201,168,76,0.12)" strokeWidth="4">
              <animate attributeName="r" values="68;74;68" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      </g>
    </svg>
  )
}
