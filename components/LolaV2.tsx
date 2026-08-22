'use client'

import React from 'react'

interface LolaV2Props {
  mouthState: 'closed' | 'half' | 'open'
  blinking: boolean
  expression: 'neutral' | 'listening' | 'thinking' | 'smiling'
  breathPhase?: number
  headTiltX?: number
  eyeShiftX?: number
  eyeShiftY?: number
  microExpression?: 'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'
  speaking?: boolean
  listening?: boolean
  width?: number
}

export default function LolaV2({
  mouthState, blinking, expression, breathPhase = 0,
  headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', speaking = false, listening = false, width = 180,
}: LolaV2Props) {
  const h = width * 2.4
  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.5
  const breathS = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.004
  const headTilt = (expression === 'listening' ? 4 : expression === 'thinking' ? -3 : 0) + headTiltX
  const eyeRY = blinking ? 0.3 : 6.5
  const px = eyeShiftX * 0.6
  const py = eyeShiftY * 0.6
  const browY = microExpression === 'brow-raise' ? -3.5 : 0
  const mouth = {
    closed: microExpression === 'slight-smile' ? 'M 87,177 Q 94,183 100,184 Q 106,183 113,177' : 'M 88,179 Q 94,182 100,183 Q 106,182 112,179',
    half: 'M 85,177 Q 93,185 100,187 Q 107,185 115,177 Q 107,183 100,184 Q 93,183 85,177',
    open: 'M 83,175 Q 91,193 100,196 Q 109,193 117,175 Q 109,187 100,189 Q 91,187 83,175',
  }[mouthState]

  return (
    <svg viewBox="0 0 200 480" width={width} height={h} xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.6))' }}>
      <defs>
        {/* ─── SKIN ─── */}
        <radialGradient id="v2-skin" cx="44%" cy="32%" r="60%" fx="40%" fy="28%">
          <stop offset="0%" stopColor="#fde8ce" />
          <stop offset="30%" stopColor="#f5d4b4" />
          <stop offset="65%" stopColor="#ecc09a" />
          <stop offset="100%" stopColor="#d9a880" />
        </radialGradient>
        <radialGradient id="v2-skin2" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#f8d8b8" />
          <stop offset="100%" stopColor="#d8a878" />
        </radialGradient>

        {/* ─── HAIR ─── rich chestnut */}
        <linearGradient id="v2-hair" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#5c3f2a" />
          <stop offset="25%" stopColor="#6d4c35" />
          <stop offset="55%" stopColor="#4e3420" />
          <stop offset="85%" stopColor="#3a2515" />
          <stop offset="100%" stopColor="#2e1c0e" />
        </linearGradient>
        <linearGradient id="v2-hair-hi" x1="20%" y1="0%" x2="60%" y2="30%">
          <stop offset="0%" stopColor="rgba(185,145,95,0)" />
          <stop offset="45%" stopColor="rgba(185,145,95,0.3)" />
          <stop offset="100%" stopColor="rgba(185,145,95,0)" />
        </linearGradient>

        {/* ─── OUTFIT — pull oversize doux crème */}
        <linearGradient id="v2-sweater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8dcc8" />
          <stop offset="40%" stopColor="#d8cab4" />
          <stop offset="100%" stopColor="#c4b49a" />
        </linearGradient>
        <linearGradient id="v2-sweater-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(80,55,20,0.15)" />
          <stop offset="50%" stopColor="rgba(80,55,20,0)" />
          <stop offset="100%" stopColor="rgba(80,55,20,0.15)" />
        </linearGradient>

        {/* ─── PANTS — tapered dark navy */}
        <linearGradient id="v2-pants" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a3050" />
          <stop offset="50%" stopColor="#1e2240" />
          <stop offset="100%" stopColor="#141830" />
        </linearGradient>

        {/* ─── SLIPPERS — chaussons dorés */}
        <linearGradient id="v2-slipper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a84c" />
          <stop offset="50%" stopColor="#b88c38" />
          <stop offset="100%" stopColor="#9a7028" />
        </linearGradient>

        {/* ─── EYES ─── amber/gold deep */}
        <radialGradient id="v2-iris" cx="40%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#ecc870" />
          <stop offset="20%" stopColor="#d4a040" />
          <stop offset="50%" stopColor="#b88030" />
          <stop offset="78%" stopColor="#8a5e20" />
          <stop offset="100%" stopColor="#6a4510" />
        </radialGradient>
        <radialGradient id="v2-iris-limbus" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="rgba(0,0,0,0)" />
          <stop offset="88%" stopColor="rgba(50,30,5,0.45)" />
          <stop offset="100%" stopColor="rgba(40,22,3,0.7)" />
        </radialGradient>

        {/* ─── LIPS */}
        <linearGradient id="v2-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d48080" />
          <stop offset="50%" stopColor="#c06868" />
          <stop offset="100%" stopColor="#a85050" />
        </linearGradient>
        <radialGradient id="v2-lip-shine" cx="50%" cy="15%" r="50%">
          <stop offset="0%" stopColor="rgba(255,210,210,0.35)" />
          <stop offset="100%" stopColor="rgba(255,210,210,0)" />
        </radialGradient>

        {/* ─── BLUSH */}
        <radialGradient id="v2-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,130,130,0.24)" />
          <stop offset="65%" stopColor="rgba(220,130,130,0.08)" />
          <stop offset="100%" stopColor="rgba(220,130,130,0)" />
        </radialGradient>

        {/* ─── CRYSTALS on sweater */}
        <radialGradient id="v2-crystal-pendant" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#a8e8ff" />
          <stop offset="50%" stopColor="#70c0f0" />
          <stop offset="100%" stopColor="#4090c8" />
        </radialGradient>

        {/* ─── FILTERS */}
        <filter id="v2-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1a0a02" floodOpacity="0.25" />
        </filter>
        <filter id="v2-head-shadow">
          <feDropShadow dx="1" dy="3" stdDeviation="4" floodColor="#1a0a02" floodOpacity="0.2" />
        </filter>
        <filter id="v2-glow-cyan">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="v2-glow-listening">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <g transform={`translate(0, ${breathY}) scale(1, ${breathS})`} style={{ transformOrigin: 'center' }}>

        {/* ══════════════════════════════
            LEGS & FEET — on the ground
            ══════════════════════════════ */}
        {/* Left leg */}
        <path d="M 76,310 Q 72,360 70,400 Q 68,430 72,450 Q 74,458 82,460 L 94,460 Q 100,458 100,450 Q 99,430 98,400 Q 97,360 95,310 Z"
          fill="url(#v2-pants)" />
        {/* Right leg */}
        <path d="M 105,310 Q 104,360 103,400 Q 102,430 101,450 Q 100,458 106,460 L 118,460 Q 126,458 128,450 Q 128,430 126,400 Q 124,360 122,310 Z"
          fill="url(#v2-pants)" />
        {/* Leg crease details */}
        <path d="M 83,320 Q 82,360 82,390" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <path d="M 116,320 Q 116,360 116,390" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

        {/* Left slipper — touching floor */}
        <path d="M 68,452 Q 60,456 56,466 Q 54,474 62,477 L 98,477 Q 104,474 102,466 Q 100,458 95,454 Z"
          fill="url(#v2-slipper)" filter="url(#v2-shadow)" />
        {/* Slipper pompom */}
        <circle cx="68" cy="460" r="5" fill="#e8c870" opacity="0.9" />
        <circle cx="68" cy="460" r="3" fill="#f0d888" />
        {/* Slipper highlight */}
        <path d="M 62,462 Q 74,458 84,460" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Right slipper */}
        <path d="M 100,456 Q 98,462 96,468 Q 94,476 102,478 L 132,478 Q 140,474 138,466 Q 136,458 130,454 Z"
          fill="url(#v2-slipper)" filter="url(#v2-shadow)" />
        <circle cx="130" cy="460" r="5" fill="#e8c870" opacity="0.9" />
        <circle cx="130" cy="460" r="3" fill="#f0d888" />
        <path d="M 104,464 Q 115,460 124,462" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Floor shadow */}
        <ellipse cx="100" cy="479" rx="48" ry="6" fill="rgba(0,0,0,0.3)" />

        {/* ══════════════════════════════
            BODY — pull oversize doux
            ══════════════════════════════ */}
        {/* Main sweater body */}
        <path d="M 52,215 Q 44,240 42,270 Q 40,300 42,315 L 158,315 Q 160,300 158,270 Q 156,240 148,215 Q 138,205 100,203 Q 62,205 52,215 Z"
          fill="url(#v2-sweater)" filter="url(#v2-shadow)" />
        {/* Sweater texture — subtle knit lines */}
        <path d="M 52,215 L 158,215" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <path key={`kl${i}`}
            d={`M ${50+i*14},220 Q ${57+i*14},225 ${50+i*14},230`}
            fill="none" stroke="rgba(160,140,100,0.08)" strokeWidth="0.6" />
        ))}
        {/* Sweater shadow overlay */}
        <path d="M 52,215 Q 44,240 42,270 Q 40,300 42,315 L 158,315 Q 160,300 158,270 Q 156,240 148,215 Q 138,205 100,203 Q 62,205 52,215 Z"
          fill="url(#v2-sweater-shadow)" />

        {/* Turtleneck / collar ribbing */}
        <path d="M 82,208 Q 82,200 88,198 L 112,198 Q 118,200 118,208 L 118,218 Q 118,224 112,226 L 88,226 Q 82,224 82,218 Z"
          fill="#d4c8b0" />
        {[0,1,2,3,4].map(i => (
          <line key={`rn${i}`} x1="85" y1={200+i*5} x2="115" y2={200+i*5}
            stroke="rgba(140,120,80,0.12)" strokeWidth="0.5" />
        ))}

        {/* ─── LEFT ARM — détendu, légèrement posé ─── */}
        {/* Upper arm */}
        <path d="M 52,218 Q 36,228 28,248 Q 22,265 26,280 Q 30,292 40,296 L 48,286 Q 40,280 38,268 Q 36,255 44,238 Q 52,225 62,220 Z"
          fill="url(#v2-sweater)" />
        {/* Forearm — posed naturally, hanging */}
        <path d="M 26,280 Q 22,295 24,308 Q 26,320 36,322 L 44,312 Q 36,310 35,300 Q 34,290 40,286 Z"
          fill="url(#v2-sweater)" />
        {/* Left hand — relaxed */}
        <path d="M 22,308 Q 18,316 20,326 Q 23,336 34,336 Q 44,336 46,328 Q 48,318 42,312 Z"
          fill="url(#v2-skin2)" />
        {/* Fingers */}
        <path d="M 22,320 Q 20,330 22,336" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 28,322 Q 27,333 28,338" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 34,323 Q 34,334 35,339" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 40,320 Q 41,330 42,334" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        {/* Knuckle hint */}
        <path d="M 22,318 Q 32,315 42,318" fill="none" stroke="rgba(180,140,110,0.12)" strokeWidth="0.5" />

        {/* ─── RIGHT ARM — légèrement levé, geste ouvert ─── */}
        {/* Upper arm */}
        <path d="M 148,218 Q 163,228 170,245 Q 176,260 173,275 Q 169,288 160,294 L 152,284 Q 160,278 162,265 Q 163,252 157,240 Q 150,228 138,222 Z"
          fill="url(#v2-sweater)" />
        {/* Forearm */}
        <path d="M 173,275 Q 178,288 177,300 Q 175,312 166,318 L 158,308 Q 165,306 166,296 Q 167,286 162,280 Z"
          fill="url(#v2-sweater)" />
        {/* Right hand — slightly open/welcoming */}
        <path d="M 176,300 Q 182,307 181,318 Q 179,328 170,330 Q 160,332 158,322 Q 156,312 162,306 Z"
          fill="url(#v2-skin2)" />
        {/* Fingers right */}
        <path d="M 182,312 Q 183,322 182,328" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 177,308 Q 179,320 178,326" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 171,308 Q 172,320 171,326" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 165,310 Q 164,320 164,325" fill="none" stroke="rgba(180,140,110,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 163,308 Q 172,305 182,308" fill="none" stroke="rgba(180,140,110,0.12)" strokeWidth="0.5" />

        {/* ─── CRYSTAL PENDANT ─── */}
        <path d="M 94,226 Q 96,233 100,238 Q 104,233 106,226"
          fill="none" stroke="rgba(160,210,255,0.5)" strokeWidth="0.8" />
        <path d="M 100,238 L 96,244 L 100,250 L 104,244 Z" fill="url(#v2-crystal-pendant)" />
        <path d="M 100,238 L 100,250" fill="none" stroke="rgba(200,240,255,0.3)" strokeWidth="0.4" />
        <circle cx="99" cy="242" r="1" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Pendant glow */}
        <circle cx="100" cy="244" r="6" fill="rgba(140,210,255,0.15)" filter="url(#v2-glow-cyan)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* ══════════════════════════════
            NECK
            ══════════════════════════════ */}
        <path d="M 87,202 L 87,215 Q 87,220 93,222 L 107,222 Q 113,220 113,215 L 113,202"
          fill="url(#v2-skin)" />
        <ellipse cx="100" cy="202" rx="14" ry="3" fill="rgba(200,155,110,0.15)" />

        {/* ══════════════════════════════
            HEAD — haute qualité
            ══════════════════════════════ */}
        <g transform={`rotate(${headTilt}, 100, 158)`}>

          {/* Hair back volume */}
          <ellipse cx="100" cy="115" rx="64" ry="74" fill="url(#v2-hair)" />

          {/* Face shape — smooth, organic */}
          <path d="M 52,126 Q 51,82 72,63 Q 86,50 100,50 Q 114,50 128,63 Q 149,82 148,126 Q 148,168 128,186 Q 115,197 100,199 Q 85,197 72,186 Q 52,168 52,126 Z"
            fill="url(#v2-skin)" filter="url(#v2-head-shadow)" />

          {/* Skin warm overlay */}
          <path d="M 52,126 Q 51,82 72,63 Q 86,50 100,50 Q 114,50 128,63 Q 149,82 148,126 Q 148,168 128,186 Q 115,197 100,199 Q 85,197 72,186 Q 52,168 52,126 Z"
            fill="rgba(255,190,160,0.06)" />

          {/* Screen ambient light on face — cyan/blue */}
          <path d="M 52,126 Q 51,82 72,63 Q 86,50 100,50 Q 114,50 128,63 Q 149,82 148,126 Q 148,168 128,186 Q 115,197 100,199 Q 85,197 72,186 Q 52,168 52,126 Z"
            fill="rgba(100,200,255,0.05)" />

          {/* Fireplace warm light on face */}
          <path d="M 52,126 Q 51,82 72,63 Q 86,50 100,50 Q 114,50 128,63 Q 149,82 148,126 Q 148,168 128,186 Q 115,197 100,199 Q 85,197 72,186 Q 52,168 52,126 Z"
            fill="rgba(255,160,60,0.04)" />

          {/* ─── HAIR FRONT ─── */}
          <path d="M 53,112 Q 49,74 69,56 Q 83,43 100,41 Q 117,43 131,56 Q 151,74 147,112 Q 145,90 135,76 Q 125,64 114,64 Q 106,64 100,70 Q 90,62 79,65 Q 65,70 56,88 Z"
            fill="url(#v2-hair)" />
          {/* Hair shine */}
          <path d="M 67,58 Q 82,47 100,45 Q 116,47 128,57 Q 116,51 100,49 Q 84,51 67,58 Z"
            fill="url(#v2-hair-hi)" />
          {/* Left side volume */}
          <path d="M 53,112 Q 47,84 55,64 Q 50,78 48,96 Q 47,110 50,126 Z"
            fill="#3a2515" opacity="0.7" />
          {/* Right flowing hair — natural fall */}
          <path d="M 147,112 Q 153,88 151,72 Q 156,90 155,114 Q 154,136 149,152 Q 152,134 147,112 Z"
            fill="#4e3420" opacity="0.6" />
          <path d="M 149,152 Q 157,175 160,205 Q 162,228 158,250 Q 154,268 149,274 Q 154,258 154,235 Q 154,210 148,188 Q 143,168 146,152 Z"
            fill="url(#v2-hair)" />
          {/* Strand details */}
          <path d="M 60,80 Q 58,93 56,108" fill="none" stroke="rgba(90,58,35,0.3)" strokeWidth="0.6" />
          <path d="M 75,58 Q 72,70 71,84" fill="none" stroke="rgba(110,72,45,0.22)" strokeWidth="0.5" />
          <path d="M 142,68 Q 147,82 148,98" fill="none" stroke="rgba(90,58,35,0.2)" strokeWidth="0.5" />
          <path d="M 133,56 Q 136,68 136,82" fill="none" stroke="rgba(110,72,45,0.18)" strokeWidth="0.5" />

          {/* ─── EYEBROWS ─── */}
          <g transform={`translate(0, ${browY})`}>
            <path d="M 64,113 Q 71,107 79,108 Q 85,109 91,112"
              fill="none" stroke="#4e3420" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M 109,112 Q 115,109 121,108 Q 129,107 136,113"
              fill="none" stroke="#4e3420" strokeWidth="2.3" strokeLinecap="round" />
            {/* Brow fill volume */}
            <path d="M 65,114 Q 71,108 79,109 Q 85,110 90,113 Q 85,112 79,111 Q 71,110 65,114 Z"
              fill="#4e3420" opacity="0.3" />
            <path d="M 110,113 Q 115,110 121,109 Q 129,108 135,114 Q 129,110 121,110 Q 115,111 110,113 Z"
              fill="#4e3420" opacity="0.3" />
          </g>

          {/* ─── CHEEKS ─── */}
          <ellipse cx="68" cy="158" rx="15" ry="9.5" fill="url(#v2-blush)" />
          <ellipse cx="132" cy="158" rx="15" ry="9.5" fill="url(#v2-blush)" />

          {/* ─── EYES ─── */}
          {/* Left eye */}
          <ellipse cx="78" cy="130" rx="14.5" ry="11" fill="rgba(170,130,110,0.07)" />
          <ellipse cx="78" cy="132" rx="11.5" ry={eyeRY + 1} fill="#f8f4f0" />
          {blinking
            ? <path d="M 67,132 Q 78,134 89,132" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" />
            : <>
                <ellipse cx={78+px} cy={132+py} rx="6.8" ry="6.8" fill="url(#v2-iris)" />
                <ellipse cx={78+px} cy={132+py} rx="6.8" ry="6.8" fill="url(#v2-iris-limbus)" />
                {[0,1,2,3,4,5,6,7].map(i => {
                  const a = (i/8)*Math.PI*2
                  return <line key={`el${i}`}
                    x1={(78+px)+Math.cos(a)*2.8} y1={(132+py)+Math.sin(a)*2.8}
                    x2={(78+px)+Math.cos(a)*5.8} y2={(132+py)+Math.sin(a)*5.8}
                    stroke="rgba(190,145,60,0.13)" strokeWidth="0.3" />
                })}
                <circle cx={78+px} cy={132+py} r="3.5" fill="#140f04" />
                {/* Main highlight */}
                <circle cx={80+px} cy={129+py} r="2.2" fill="white" opacity="0.92" />
                {/* Secondary highlight */}
                <circle cx={76+px} cy={134+py} r="0.9" fill="white" opacity="0.45" />
                {/* Screen reflection */}
                <rect x={75+px} y={130+py} width="2.5" height="1.2" rx="0.4" fill="rgba(120,200,255,0.18)" />
                {/* Fire reflection */}
                <rect x={78+px} y={133+py} width="2" height="1" rx="0.3" fill="rgba(255,160,60,0.12)" />
              </>
          }
          {/* Upper lid */}
          <path d={`M 67,${132-eyeRY-0.5} Q 78,${126-eyeRY} 89,${132-eyeRY-0.5}`}
            fill="none" stroke="#4e3420" strokeWidth="1.5" strokeLinecap="round" />
          {/* Eyelashes top */}
          <path d={`M 67,${132-eyeRY-1} Q 65,${130-eyeRY} 63,${128-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M 71,${132-eyeRY-1.5} Q 70,${129-eyeRY} 70,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.6" strokeLinecap="round" />
          <path d={`M 75,${132-eyeRY-2} Q 75,${129-eyeRY} 76,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.5" strokeLinecap="round" />
          <path d={`M 89,${132-eyeRY-1} Q 91,${130-eyeRY} 92,${128-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M 85,${132-eyeRY-1.5} Q 86,${129-eyeRY} 86,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.5" strokeLinecap="round" />
          {/* Lower lashes */}
          <path d={`M 69,${132+eyeRY-1} Q 78,${134+eyeRY-1} 87,${132+eyeRY-1}`}
            fill="none" stroke="#4e3420" strokeWidth="0.55" opacity="0.32" />
          {/* Eyelid crease */}
          <path d={`M 70,${126-eyeRY*0.4} Q 78,${122-eyeRY*0.4} 86,${126-eyeRY*0.4}`}
            fill="none" stroke="rgba(175,130,105,0.14)" strokeWidth="0.5" />

          {/* Right eye */}
          <ellipse cx="122" cy="130" rx="14.5" ry="11" fill="rgba(170,130,110,0.07)" />
          <ellipse cx="122" cy="132" rx="11.5" ry={eyeRY + 1} fill="#f8f4f0" />
          {blinking
            ? <path d="M 111,132 Q 122,134 133,132" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" />
            : <>
                <ellipse cx={122+px} cy={132+py} rx="6.8" ry="6.8" fill="url(#v2-iris)" />
                <ellipse cx={122+px} cy={132+py} rx="6.8" ry="6.8" fill="url(#v2-iris-limbus)" />
                {[0,1,2,3,4,5,6,7].map(i => {
                  const a = (i/8)*Math.PI*2
                  return <line key={`er${i}`}
                    x1={(122+px)+Math.cos(a)*2.8} y1={(132+py)+Math.sin(a)*2.8}
                    x2={(122+px)+Math.cos(a)*5.8} y2={(132+py)+Math.sin(a)*5.8}
                    stroke="rgba(190,145,60,0.13)" strokeWidth="0.3" />
                })}
                <circle cx={122+px} cy={132+py} r="3.5" fill="#140f04" />
                <circle cx={124+px} cy={129+py} r="2.2" fill="white" opacity="0.92" />
                <circle cx={120+px} cy={134+py} r="0.9" fill="white" opacity="0.45" />
                <rect x={119+px} y={130+py} width="2.5" height="1.2" rx="0.4" fill="rgba(120,200,255,0.18)" />
                <rect x={122+px} y={133+py} width="2" height="1" rx="0.3" fill="rgba(255,160,60,0.12)" />
              </>
          }
          <path d={`M 111,${132-eyeRY-0.5} Q 122,${126-eyeRY} 133,${132-eyeRY-0.5}`}
            fill="none" stroke="#4e3420" strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M 111,${132-eyeRY-1} Q 109,${130-eyeRY} 107,${128-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M 115,${132-eyeRY-1.5} Q 114,${129-eyeRY} 114,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.6" strokeLinecap="round" />
          <path d={`M 119,${132-eyeRY-2} Q 119,${129-eyeRY} 120,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.5" strokeLinecap="round" />
          <path d={`M 133,${132-eyeRY-1} Q 135,${130-eyeRY} 137,${128-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M 129,${132-eyeRY-1.5} Q 130,${129-eyeRY} 130,${126-eyeRY}`}
            fill="none" stroke="#3a2515" strokeWidth="0.5" strokeLinecap="round" />
          <path d={`M 113,${132+eyeRY-1} Q 122,${134+eyeRY-1} 131,${132+eyeRY-1}`}
            fill="none" stroke="#4e3420" strokeWidth="0.55" opacity="0.32" />
          <path d={`M 114,${126-eyeRY*0.4} Q 122,${122-eyeRY*0.4} 130,${126-eyeRY*0.4}`}
            fill="none" stroke="rgba(175,130,105,0.14)" strokeWidth="0.5" />

          {/* ─── NOSE ─── */}
          <path d="M 99,132 Q 97,143 96,150 Q 95,155 92,160"
            fill="none" stroke="rgba(180,140,110,0.22)" strokeWidth="0.9" />
          <path d="M 92,160 Q 94,165 100,166 Q 106,165 108,160"
            fill="none" stroke="rgba(180,140,110,0.28)" strokeWidth="0.85" />
          <ellipse cx="93.5" cy="162" rx="2.5" ry="1.5" fill="rgba(175,135,105,0.14)" />
          <ellipse cx="106.5" cy="162" rx="2.5" ry="1.5" fill="rgba(175,135,105,0.14)" />
          <ellipse cx="100" cy="158" rx="3" ry="2" fill="rgba(255,235,215,0.1)" />

          {/* ─── MOUTH ─── */}
          <path d={mouth}
            fill={mouthState === 'closed' ? 'none' : 'url(#v2-lip)'}
            stroke={mouthState === 'closed' ? '#b87272' : 'none'}
            strokeWidth={mouthState === 'closed' ? '1.4' : '0'} />
          {mouthState !== 'closed' && (
            <>
              <path d={mouthState === 'half'
                ? 'M 85,177 Q 93,185 100,187 Q 107,185 115,177'
                : 'M 83,175 Q 91,193 100,196 Q 109,193 117,175'}
                fill="none" stroke="#a05858" strokeWidth="0.85" />
              {/* Lip shine */}
              <ellipse cx="100" cy={mouthState === 'half' ? 181 : 183} rx="7" ry="2.5"
                fill="url(#v2-lip-shine)" />
            </>
          )}
          {mouthState === 'open' && (
            <>
              <path d="M 89,181 Q 100,178 111,181" fill="#f5f0ec" opacity="0.9" />
              {[92,97,103,108].map(x => (
                <line key={`to${x}`} x1={x} y1="179" x2={x} y2="181" stroke="rgba(200,190,180,0.28)" strokeWidth="0.3" />
              ))}
            </>
          )}
          {mouthState === 'closed' && (
            <path d="M 96,177 Q 98,175 100,176 Q 102,175 104,177"
              fill="none" stroke="rgba(180,100,100,0.28)" strokeWidth="0.45" />
          )}
          {/* Smile dimples */}
          {(expression === 'smiling' || microExpression === 'slight-smile') && (
            <>
              <path d="M 77,175 Q 75,179 77,183" fill="none" stroke="rgba(180,135,115,0.2)" strokeWidth="0.7" />
              <path d="M 123,175 Q 125,179 123,183" fill="none" stroke="rgba(180,135,115,0.2)" strokeWidth="0.7" />
            </>
          )}

          {/* Chin subtle */}
          <ellipse cx="100" cy="195" rx="8" ry="3.5" fill="rgba(255,225,205,0.08)" />

          {/* ─── LISTENING AURA ─── */}
          {listening && (
            <>
              <circle cx="100" cy="126" r="76" fill="none"
                stroke="rgba(200,100,100,0.2)" strokeWidth="4" filter="url(#v2-glow-listening)">
                <animate attributeName="r" values="73;79;73" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="126" r="68" fill="none"
                stroke="rgba(220,120,120,0.1)" strokeWidth="2">
                <animate attributeName="r" values="65;72;65" dur="1.4s" begin="0.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* ─── SPEAKING AURA ─── */}
          {speaking && (
            <circle cx="100" cy="126" r="74" fill="none"
              stroke="rgba(140,210,255,0.15)" strokeWidth="5" filter="url(#v2-glow-cyan)">
              <animate attributeName="r" values="70;76;70" dur="0.55s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      </g>
    </svg>
  )
}
