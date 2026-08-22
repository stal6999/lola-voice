'use client'

import React, { useEffect, useState, useRef } from 'react'

type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'loading' | 'alert' | 'happy'
type MouthState = 'closed' | 'half' | 'open'
type Expression = 'neutral' | 'listening' | 'thinking' | 'smiling'

interface LolaSceneProps {
  width: number
  height: number
  screenContent?: string | null
  speaking?: boolean
  listening?: boolean
  loading?: boolean
  lolaState?: LolaState
  mouthState?: MouthState
  blinking?: boolean
  expression?: Expression
  breathPhase?: number
  headTiltX?: number
  eyeShiftX?: number
  eyeShiftY?: number
  microExpression?: 'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'
  mobileMode?: boolean
}

const POSITIONS = {
  center: { x: 400, y: 490 },
  left:   { x: 240, y: 490 },
  desk:   { x: 530, y: 490 },
}

const STATE_POS: Record<LolaState, { pos: keyof typeof POSITIONS; sitting: boolean }> = {
  idle:      { pos: 'center', sitting: false },
  listening: { pos: 'center', sitting: false },
  thinking:  { pos: 'desk',   sitting: true  },
  speaking:  { pos: 'center', sitting: false },
  loading:   { pos: 'desk',   sitting: true  },
  alert:     { pos: 'center', sitting: false },
  happy:     { pos: 'center', sitting: false },
}

export default function LolaScene({
  width, height, screenContent,
  speaking = false, listening = false, loading = false,
  lolaState = 'idle',
  mouthState = 'closed', blinking = false, expression = 'neutral',
  breathPhase = 0, headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', mobileMode = false,
}: LolaSceneProps) {

  const [displayedText, setDisplayedText] = useState('')
  const [lolaPos, setLolaPos] = useState(POSITIONS.center)
  const [isSitting, setIsSitting] = useState(false)
  const [tickerX, setTickerX] = useState(800)
  const animRef = useRef<number | null>(null)

  // Typewriter
  useEffect(() => {
    if (!screenContent) { setDisplayedText(''); return }
    let i = 0; setDisplayedText('')
    const id = setInterval(() => {
      if (i >= screenContent.length) { clearInterval(id); return }
      setDisplayedText(screenContent.slice(0, ++i))
    }, 14)
    return () => clearInterval(id)
  }, [screenContent])

  // Ticker
  useEffect(() => {
    let x = 800
    const tick = () => {
      x -= 0.8; if (x < -700) x = 800
      setTickerX(x); animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  // Comportement Lola
  useEffect(() => {
    const b = STATE_POS[lolaState]
    setLolaPos(POSITIONS[b.pos])
    setIsSitting(b.sitting)
  }, [lolaState])

  const VW = 800, VH = 600
  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.8
  const eyeRY = blinking ? 0.3 : 6.5
  const px = eyeShiftX * 0.5
  const py = eyeShiftY * 0.5
  const browY = microExpression === 'brow-raise' ? -3 : 0
  const tilt = headTiltX * 0.35
  const mouthPath = {
    closed: microExpression === 'slight-smile'
      ? 'M 87,177 Q 94,183 100,184 Q 106,183 113,177'
      : 'M 88,179 Q 94,182 100,183 Q 106,182 112,179',
    half: 'M 85,177 Q 93,185 100,187 Q 107,185 115,177 Q 107,183 100,184 Q 93,183 85,177',
    open: 'M 83,175 Q 91,193 100,196 Q 109,193 117,175 Q 109,187 100,189 Q 91,187 83,175',
  }[mouthState]

  // Taille Lola dans le viewBox 800×600
  // PC: scale 0.58 → corps ~278px haut → tête visible, pieds sur le sol
  // Mobile: scale 0.48
  const sc = mobileMode ? 0.48 : 0.58
  const lH = 480 * sc   // hauteur totale du sprite
  // Position Y pieds = sol SVG (480) — tête commence à lolaPos.y - lH
  const footY = 480      // sol à y=480 dans le viewBox
  const bodyTop = footY - lH + breathY
  const bodyLeft = lolaPos.x - 100 * sc  // centré sur lolaPos.x

  const statusColor = listening ? '#e74c3c' : speaking ? '#2ecc71' : loading ? '#9b59b6' : '#27ae60'

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* ── Fond studio ── */}
        <linearGradient id="s-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a1f0e"/>
          <stop offset="55%" stopColor="#1c1509"/>
          <stop offset="100%" stopColor="#120e04"/>
        </linearGradient>
        {/* ── Ciel fenêtre VIVE ── */}
        <linearGradient id="s-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4fc3f7"/>
          <stop offset="45%" stopColor="#81d4fa"/>
          <stop offset="100%" stopColor="#b3e5fc"/>
        </linearGradient>
        {/* ── Sol parquet ── */}
        <linearGradient id="s-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6d4c1f"/>
          <stop offset="100%" stopColor="#4e3414"/>
        </linearGradient>
        {/* ── Écran TV ── */}
        <linearGradient id="s-scr" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#010a01"/>
          <stop offset="100%" stopColor="#000500"/>
        </linearGradient>
        {/* ── Peau Lola ── */}
        <radialGradient id="s-skin" cx="44%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#fde8ce"/>
          <stop offset="40%" stopColor="#f0cfa8"/>
          <stop offset="100%" stopColor="#d8a070"/>
        </radialGradient>
        <linearGradient id="s-hair" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#6b4c30"/>
          <stop offset="50%" stopColor="#543826"/>
          <stop offset="100%" stopColor="#3a2616"/>
        </linearGradient>
        <linearGradient id="s-sweat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0e6d0"/>
          <stop offset="100%" stopColor="#d4c4a4"/>
        </linearGradient>
        <linearGradient id="s-pants" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3d4d7a"/>
          <stop offset="100%" stopColor="#1e2640"/>
        </linearGradient>
        <linearGradient id="s-slip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c84c"/>
          <stop offset="100%" stopColor="#a88c28"/>
        </linearGradient>
        <radialGradient id="s-iris" cx="38%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#f0d070"/>
          <stop offset="50%" stopColor="#c09030"/>
          <stop offset="100%" stopColor="#705010"/>
        </radialGradient>
        <linearGradient id="s-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e08888"/>
          <stop offset="100%" stopColor="#b05050"/>
        </linearGradient>
        <radialGradient id="s-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(230,140,140,0.25)"/>
          <stop offset="100%" stopColor="rgba(230,140,140,0)"/>
        </radialGradient>
        {/* Clip */}
        <clipPath id="s-win-clip"><rect x="50" y="55" width="185" height="235" rx="3"/></clipPath>
        <clipPath id="s-scr-clip"><rect x="500" y="45" width="242" height="175" rx="4"/></clipPath>
        {/* Filtres */}
        <filter id="s-shadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.45"/></filter>
        <filter id="s-glow-g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="s-glow-s"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>

      {/* ══ FOND STUDIO ══ */}
      <rect width={VW} height={VH} fill="url(#s-bg)"/>

      {/* Lumière spot chaude sur scène */}
      <ellipse cx="400" cy="240" rx="350" ry="270" fill="rgba(255,200,100,0.06)"/>

      {/* ══ FENÊTRE GAUCHE — vive et lumineuse ══ */}
      {/* Ciel */}
      <rect x="50" y="55" width="185" height="235" rx="3" fill="url(#s-sky)" clipPath="url(#s-win-clip)"/>
      <g clipPath="url(#s-win-clip)">
        {/* Soleil */}
        <circle cx="195" cy="85" r="28" fill="#FFE066" opacity="0.95"/>
        <circle cx="195" cy="85" r="42" fill="rgba(255,224,80,0.2)" filter="url(#s-glow-s)"/>
        {/* Rayons soleil */}
        {[0,45,90,135,180,225,270,315].map((a,i) => (
          <line key={i}
            x1={195 + Math.cos(a*Math.PI/180)*34} y1={85 + Math.sin(a*Math.PI/180)*34}
            x2={195 + Math.cos(a*Math.PI/180)*52} y2={85 + Math.sin(a*Math.PI/180)*52}
            stroke="#FFE066" strokeWidth="2.5" opacity="0.5"/>
        ))}
        {/* Nuages */}
        <ellipse cx="85" cy="105" rx="32" ry="13" fill="white" opacity="0.9"/>
        <ellipse cx="70" cy="109" rx="20" ry="11" fill="white" opacity="0.85"/>
        <ellipse cx="104" cy="107" rx="18" ry="10" fill="white" opacity="0.8"/>
        <ellipse cx="155" cy="78" rx="22" ry="9" fill="white" opacity="0.8"/>
        {/* Arbres verts vifs */}
        <path d="M 50,255 Q 80,185 108,220 Q 128,172 155,200 Q 178,158 235,185 L 235,290 L 50,290 Z"
          fill="#43A047" opacity="0.95"/>
        <path d="M 50,272 Q 95,240 135,260 Q 170,235 235,255 L 235,290 L 50,290 Z"
          fill="#66BB6A" opacity="0.85"/>
        {/* Touches de lumière sur les arbres */}
        <path d="M 80,210 Q 100,198 120,208" fill="none" stroke="rgba(200,255,150,0.3)" strokeWidth="4"/>
        <path d="M 160,185 Q 185,173 210,183" fill="none" stroke="rgba(200,255,150,0.25)" strokeWidth="3"/>
      </g>
      {/* Cadre fenêtre bois chaud */}
      <rect x="50" y="55" width="185" height="235" rx="3" fill="none" stroke="#7B5230" strokeWidth="9"/>
      <line x1="142" y1="55" x2="142" y2="290" stroke="#7B5230" strokeWidth="6"/>
      <line x1="50" y1="172" x2="235" y2="172" stroke="#7B5230" strokeWidth="5"/>
      {/* Rebord */}
      <rect x="42" y="287" width="200" height="13" rx="4" fill="#8D6030"/>

      {/* ══ ÉTAGÈRES — livres COLORÉS ══ */}
      {/* Étagère 1 */}
      <rect x="32" y="305" width="215" height="7" rx="3" fill="#8D6030"/>
      {[
        ['#E53935','#1E88E5','#43A047','#FB8C00','#8E24AA','#00ACC1','#F4511E'],
      ].map((colors, row) => colors.map((c, i) => (
        <rect key={`r${row}b${i}`} x={40+i*29} y={row===0?274:340} width={23} height={row===0?30:28} rx={2} fill={c} opacity="0.92"/>
      )))}
      {/* Étagère 2 */}
      <rect x="32" y="372" width="215" height="7" rx="3" fill="#8D6030"/>
      {['#EF5350','#5C6BC0','#26A69A','#D4A020','#7E57C2','#66BB6A','#EC407A'].map((c,i) => (
        <rect key={`b2${i}`} x={40+i*29} y={343} width={21} height={28} rx={2} fill={c} opacity="0.85"/>
      ))}
      {/* Quelques objets sur étagère */}
      <ellipse cx="58" cy="303" rx="8" ry="5" fill="#C0392B" opacity="0.7"/>
      <circle cx="210" cy="300" r="6" fill="#2980B9" opacity="0.6"/>

      {/* ══ ÉCRAN TV DROIT ══ */}
      {/* Corps TV */}
      <rect x="490" y="36" width="262" height="192" rx="10" fill="#0d0d0a"/>
      <rect x="500" y="45" width="242" height="175" rx="4" fill="url(#s-scr)"/>
      {/* Bordure lueur verte */}
      <rect x="500" y="45" width="242" height="175" rx="4" fill="none"
        stroke="rgba(0,220,80,0.5)" strokeWidth="1.5" filter="url(#s-glow-g)"/>
      {/* Pied TV */}
      <rect x="598" y="228" width="22" height="28" fill="#1a1a14"/>
      <rect x="574" y="254" width="70" height="8" rx="4" fill="#1a1a14"/>

      {/* Contenu écran */}
      <foreignObject x={500} y={45} width={242} height={175} clipPath="url(#s-scr-clip)">
        {/* @ts-expect-error xmlns needed for foreignObject */}
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width:'100%', height:'100%', padding:'10px 12px',
          fontFamily:'"Courier New",monospace', fontSize:'11px',
          color:'#00e855', lineHeight:'1.65',
          overflowY:'auto', background:'transparent',
          whiteSpace:'pre-wrap', wordBreak:'break-word',
          textShadow:'0 0 7px rgba(0,240,80,0.6)',
        }}>
          {screenContent ? displayedText : (
            speaking  ? '▶ LOLA EN LIGNE...' :
            loading   ? '◆ ANALYSE EN COURS...' :
            listening ? '⏺ ÉCOUTE ACTIVE...' :
            '■ SYSTÈME ACTIF\n\n> Mémoire chargée ✓\n> Connexion établie ✓\n> Prêt pour vous aider'
          )}
          {screenContent && <span style={{opacity:0.6}}>█</span>}
        </div>
      </foreignObject>

      {/* Header écran */}
      <rect x="500" y="45" width="242" height="16" fill="rgba(0,0,0,0.6)"/>
      {[0,1,2].map(i => <circle key={i} cx={509+i*10} cy={53} r={3}
        fill={['#e74c3c','#f39c12','#2ecc71'][i]} opacity="0.8"/>)}
      <text x="621" y="56" textAnchor="middle" fontFamily="monospace" fontSize="8"
        fill="rgba(0,220,80,0.5)" letterSpacing="2">LOLA DISPLAY</text>

      {/* Waveform si parle */}
      {speaking && Array.from({length:14},(_,i) => {
        const bh = 8+Math.sin(i*0.9)*16
        return <rect key={i} x={522+i*15} y={126-bh/2} width={11} height={bh} rx="3"
          fill="rgba(0,230,80,0.6)">
          <animate attributeName="height" values={`${bh};${6+Math.random()*26};${bh}`}
            dur={`${0.2+i*0.04}s`} repeatCount="indefinite"/>
        </rect>
      })}

      {/* ══ SOL PARQUET ══ */}
      <rect x="0" y="480" width={VW} height="120" fill="url(#s-floor)"/>
      <line x1="0" y1="480" x2={VW} y2="480" stroke="rgba(180,130,60,0.35)" strokeWidth="1.5"/>
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="0" y1={490+i*24} x2={VW} y2={490+i*24}
          stroke="rgba(120,80,30,0.2)" strokeWidth="0.7"/>
      ))}
      {/* Joints parquet verticaux */}
      {[120,240,360,480,600,720].map(x => (
        <line key={x} x1={x} y1="480" x2={x} y2="600"
          stroke="rgba(100,65,20,0.18)" strokeWidth="0.5"/>
      ))}

      {/* ══ BUREAU DROIT ══ */}
      <rect x="440" y="422" width="345" height="14" rx="4" fill="#5a3c1a"/>
      <rect x="440" y="434" width="345" height="7" rx="2" fill="rgba(0,0,0,0.2)"/>
      {/* Tasse café */}
      <rect x="474" y="400" width="30" height="22" rx="5" fill="#2c1f10"/>
      <ellipse cx="489" cy="400" rx="15" ry="5" fill="#3d2a16"/>
      <ellipse cx="489" cy="422" rx="15" ry="5" fill="#2c1f10"/>
      <path d="M 504,408 Q 514,414 504,420" fill="none" stroke="#3d2a16" strokeWidth="2.5"/>
      {/* Vapeur café si thinking */}
      {(lolaState==='thinking'||lolaState==='loading') && [0,1,2].map(i => (
        <path key={i} d={`M ${484+i*5},398 Q ${482+i*5},390 ${484+i*5},382`}
          fill="none" stroke="#b0b0a0" strokeWidth="1.2" opacity="0">
          <animate attributeName="opacity" values="0;0.55;0" dur={`${2+i*0.6}s`}
            begin={`${i*0.4}s`} repeatCount="indefinite"/>
        </path>
      ))}

      {/* ══ LOLA — personnage ══ */}
      <g transform={`translate(${bodyLeft}, ${bodyTop})`} filter="url(#s-shadow)">
        <g transform={`scale(${sc})`}>

          {/* Ombre sol */}
          <ellipse cx="100" cy={isSitting?520:475} rx="50" ry="7" fill="rgba(0,0,0,0.4)"/>

          {/* Jambes */}
          {!isSitting ? (<>
            <path d="M 76,308 Q 72,360 70,400 Q 68,430 73,450 Q 76,458 85,459 L 95,459 Q 101,456 101,448 Q 100,430 99,400 Q 97,360 95,308 Z" fill="url(#s-pants)"/>
            <path d="M 105,308 Q 104,360 103,400 Q 102,430 101,448 Q 100,456 107,459 L 118,459 Q 127,456 128,448 Q 128,430 126,400 Q 124,360 122,308 Z" fill="url(#s-pants)"/>
            {/* Chaussons */}
            <path d="M 66,450 Q 57,455 53,465 Q 51,474 60,476 L 100,476 Q 106,473 104,464 Q 102,456 95,452 Z" fill="url(#s-slip)"/>
            <circle cx="63" cy="458" r="5.5" fill="#f0d060"/><circle cx="63" cy="458" r="3" fill="#fff8a0"/>
            <path d="M 100,453 Q 98,461 97,468 Q 95,476 104,477 L 134,477 Q 142,473 140,464 Q 138,456 131,452 Z" fill="url(#s-slip)"/>
            <circle cx="132" cy="458" r="5.5" fill="#f0d060"/><circle cx="132" cy="458" r="3" fill="#fff8a0"/>
          </>) : (<>
            {/* Jambes assises */}
            <path d="M 60,310 Q 48,345 46,375 Q 44,395 52,406 Q 60,414 80,412 L 90,402 Q 76,397 74,380 Q 72,362 80,332 Z" fill="url(#s-pants)"/>
            <path d="M 140,310 Q 152,345 154,375 Q 156,395 148,406 Q 140,414 120,412 L 110,402 Q 124,397 126,380 Q 128,362 120,332 Z" fill="url(#s-pants)"/>
            <path d="M 42,402 Q 36,413 40,422 Q 44,430 62,428 Q 80,426 84,416 Q 86,408 80,402 Z" fill="url(#s-slip)"/>
            <path d="M 118,402 Q 118,413 122,420 Q 128,428 146,426 Q 162,422 162,412 Q 160,404 152,400 Z" fill="url(#s-slip)"/>
          </>)}

          {/* Corps pull */}
          <path d="M 52,215 Q 44,240 42,270 Q 40,300 42,315 L 158,315 Q 160,300 158,270 Q 156,240 148,215 Q 138,204 100,202 Q 62,204 52,215 Z" fill="url(#s-sweat)"/>
          {/* Col */}
          <path d="M 82,207 Q 82,198 88,196 L 112,196 Q 118,198 118,207 L 118,218 Q 118,224 112,226 L 88,226 Q 82,224 82,218 Z" fill="#ddd4bc"/>

          {/* Bras selon état */}
          {lolaState==='speaking' ? (<>
            {/* bras gauche levé */}
            <path d="M 52,218 Q 28,200 16,172 Q 8,150 18,138 Q 28,128 40,136 L 46,150 Q 34,150 32,162 Q 28,178 46,192 Q 56,198 64,212 Z" fill="url(#s-sweat)"/>
            <path d="M 14,138 Q 6,128 8,114 Q 12,104 26,104 Q 40,104 42,116 Q 44,130 36,140 Z" fill="url(#s-skin)"/>
            {/* bras droit bas */}
            <path d="M 148,218 Q 165,228 172,246 Q 178,262 174,276 Q 170,288 160,294 L 152,284 Q 162,278 164,264 Q 165,250 158,238 Q 150,226 138,220 Z" fill="url(#s-sweat)"/>
            <path d="M 178,300 Q 184,308 182,320 Q 180,330 170,332 Q 160,334 158,322 Q 156,312 163,306 Z" fill="url(#s-skin)"/>
          </>) : (lolaState==='thinking'||lolaState==='loading') ? (<>
            {/* bras droit vers tasse */}
            <path d="M 148,218 Q 158,226 156,244 Q 154,256 142,262 Q 132,266 124,258 L 128,248 Q 136,254 142,248 Q 150,238 142,222 Z" fill="url(#s-sweat)"/>
            <path d="M 110,256 Q 108,266 113,274 Q 120,282 132,280 Q 143,276 144,266 Q 144,257 138,253 Z" fill="url(#s-skin)"/>
            {/* bras gauche repos */}
            <path d="M 52,218 Q 36,228 28,248 Q 22,265 26,280 Q 30,292 40,296 L 48,286 Q 40,280 38,268 Q 36,254 44,238 Q 52,224 62,220 Z" fill="url(#s-sweat)"/>
            <path d="M 22,308 Q 18,316 20,326 Q 24,336 35,336 Q 45,336 47,327 Q 49,317 43,311 Z" fill="url(#s-skin)"/>
          </>) : (<>
            {/* bras normaux */}
            <path d="M 52,218 Q 36,228 28,248 Q 22,265 26,280 Q 30,292 40,296 L 48,286 Q 40,280 38,268 Q 36,254 44,238 Q 52,224 62,220 Z" fill="url(#s-sweat)"/>
            <path d="M 26,280 Q 22,295 24,308 Q 26,320 36,322 L 44,312 Q 36,310 35,300 Q 34,290 40,286 Z" fill="url(#s-sweat)"/>
            <path d="M 22,308 Q 18,316 20,326 Q 24,336 35,336 Q 45,336 47,327 Q 49,317 43,311 Z" fill="url(#s-skin)"/>
            <path d="M 148,218 Q 165,228 172,246 Q 178,262 174,276 Q 170,288 160,294 L 152,284 Q 162,278 164,264 Q 165,250 158,238 Q 150,226 138,220 Z" fill="url(#s-sweat)"/>
            <path d="M 174,276 Q 180,290 178,302 Q 176,314 166,318 L 158,308 Q 166,306 167,296 Q 168,286 162,280 Z" fill="url(#s-sweat)"/>
            <path d="M 178,300 Q 184,308 182,320 Q 180,330 170,332 Q 160,334 158,322 Q 156,312 163,306 Z" fill="url(#s-skin)"/>
          </>)}

          {/* Pendentif cristal vert */}
          <path d="M 94,226 Q 97,234 100,238 Q 103,234 106,226" fill="none" stroke="rgba(0,210,80,0.55)" strokeWidth="0.9"/>
          <path d="M 100,238 L 96,244 L 100,251 L 104,244 Z" fill="rgba(0,230,80,0.9)"/>
          <circle cx="100" cy="244" r="1.2" fill="white" opacity="0.85">
            <animate attributeName="opacity" values="0.85;0.3;0.85" dur="2s" repeatCount="indefinite"/>
          </circle>

          {/* Cou */}
          <path d="M 87,202 L 87,215 Q 87,220 93,222 L 107,222 Q 113,220 113,215 L 113,202" fill="url(#s-skin)"/>

          {/* ── TÊTE ── */}
          <g transform={`rotate(${tilt},100,155)`}>
            {/* Cheveux fond */}
            <ellipse cx="100" cy="112" rx="65" ry="74" fill="url(#s-hair)"/>

            {/* Visage */}
            <path d="M 51,122 Q 50,78 72,59 Q 86,46 100,46 Q 114,46 128,59 Q 150,78 149,122 Q 149,166 128,185 Q 115,196 100,198 Q 85,196 72,185 Q 51,166 51,122 Z" fill="url(#s-skin)"/>
            {/* Lumière chaude */}
            <path d="M 51,122 Q 50,78 72,59 Q 86,46 100,46 Q 114,46 128,59 Q 150,78 149,122 Q 149,166 128,185 Q 115,196 100,198 Q 85,196 72,185 Q 51,166 51,122 Z" fill="rgba(255,210,130,0.06)"/>

            {/* Cheveux avant */}
            <path d="M 52,108 Q 48,70 68,52 Q 83,39 100,37 Q 117,39 132,52 Q 152,70 148,108 Q 146,86 136,72 Q 126,60 115,60 Q 107,60 100,67 Q 90,58 78,62 Q 64,67 55,86 Z" fill="url(#s-hair)"/>
            <path d="M 150,150 Q 158,172 158,202 Q 160,228 155,250 Q 150,268 147,274 Q 153,256 152,232 Q 151,206 146,185 Q 141,165 145,150 Z" fill="url(#s-hair)"/>

            {/* Sourcils */}
            <g transform={`translate(0,${browY})`}>
              <path d="M 63,110 Q 71,104 80,105 Q 86,106 92,109" fill="none" stroke="#4a321c" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M 108,109 Q 114,106 122,105 Q 130,104 137,110" fill="none" stroke="#4a321c" strokeWidth="2.4" strokeLinecap="round"/>
            </g>

            {/* Joues */}
            <ellipse cx="67" cy="155" rx="15" ry="10" fill="url(#s-blush)"/>
            <ellipse cx="133" cy="155" rx="15" ry="10" fill="url(#s-blush)"/>

            {/* Oeil G */}
            <ellipse cx="78" cy="129" rx="12" ry={eyeRY+1} fill="#f9f5f1"/>
            {blinking
              ? <path d="M 67,129 Q 78,131 89,129" fill="none" stroke="#4a321c" strokeWidth="1.8" strokeLinecap="round"/>
              : <><ellipse cx={78+px} cy={129+py} rx="6.8" ry="6.8" fill="url(#s-iris)"/>
                 <circle cx={78+px} cy={129+py} r="3.6" fill="#120e04"/>
                 <circle cx={80+px} cy={126+py} r="2.2" fill="white" opacity="0.95"/>
                 <circle cx={76+px} cy={131+py} r="0.9" fill="white" opacity="0.45"/></>
            }
            <path d={`M 66,${129-eyeRY-0.5} Q 78,${123-eyeRY} 90,${129-eyeRY-0.5}`} fill="none" stroke="#4a321c" strokeWidth="1.5" strokeLinecap="round"/>
            <path d={`M 66,${129-eyeRY-1} Q 64,${127-eyeRY} 62,${125-eyeRY}`} fill="none" stroke="#3a2414" strokeWidth="0.75" strokeLinecap="round"/>
            <path d={`M 90,${129-eyeRY-1} Q 92,${127-eyeRY} 94,${125-eyeRY}`} fill="none" stroke="#3a2414" strokeWidth="0.75" strokeLinecap="round"/>

            {/* Oeil D */}
            <ellipse cx="122" cy="129" rx="12" ry={eyeRY+1} fill="#f9f5f1"/>
            {blinking
              ? <path d="M 111,129 Q 122,131 133,129" fill="none" stroke="#4a321c" strokeWidth="1.8" strokeLinecap="round"/>
              : <><ellipse cx={122+px} cy={129+py} rx="6.8" ry="6.8" fill="url(#s-iris)"/>
                 <circle cx={122+px} cy={129+py} r="3.6" fill="#120e04"/>
                 <circle cx={124+px} cy={126+py} r="2.2" fill="white" opacity="0.95"/>
                 <circle cx={120+px} cy={131+py} r="0.9" fill="white" opacity="0.45"/></>
            }
            <path d={`M 111,${129-eyeRY-0.5} Q 122,${123-eyeRY} 133,${129-eyeRY-0.5}`} fill="none" stroke="#4a321c" strokeWidth="1.5" strokeLinecap="round"/>
            <path d={`M 111,${129-eyeRY-1} Q 109,${127-eyeRY} 107,${125-eyeRY}`} fill="none" stroke="#3a2414" strokeWidth="0.75" strokeLinecap="round"/>
            <path d={`M 133,${129-eyeRY-1} Q 135,${127-eyeRY} 137,${125-eyeRY}`} fill="none" stroke="#3a2414" strokeWidth="0.75" strokeLinecap="round"/>

            {/* Nez */}
            <path d="M 99,127 Q 97,140 96,148 Q 92,156 92,159 Q 95,163 100,164 Q 105,163 108,159 Q 108,156 104,148 Q 103,140 101,127" fill="none" stroke="rgba(175,130,100,0.22)" strokeWidth="0.9"/>
            <ellipse cx="93" cy="161" rx="2.4" ry="1.4" fill="rgba(175,130,100,0.13)"/>
            <ellipse cx="107" cy="161" rx="2.4" ry="1.4" fill="rgba(175,130,100,0.13)"/>

            {/* Bouche */}
            <path d={mouthPath} fill={mouthState!=='closed'?'url(#s-lip)':'none'} stroke={mouthState==='closed'?'#c08080':'none'} strokeWidth="1.5"/>
            {mouthState==='open' && <path d="M 88,180 Q 100,177 112,180" fill="#f5f0ec" opacity="0.9"/>}
            {(expression==='smiling'||microExpression==='slight-smile') && <>
              <path d="M 76,173 Q 74,177 76,181" fill="none" stroke="rgba(180,135,115,0.2)" strokeWidth="0.7"/>
              <path d="M 124,173 Q 126,177 124,181" fill="none" stroke="rgba(180,135,115,0.2)" strokeWidth="0.7"/>
            </>}

            {/* Auras état */}
            {listening && <circle cx="100" cy="123" r="80" fill="none" stroke="rgba(231,76,60,0.22)" strokeWidth="4">
              <animate attributeName="r" values="76;82;76" dur="1.4s" repeatCount="indefinite"/>
            </circle>}
            {speaking && <circle cx="100" cy="123" r="78" fill="none" stroke="rgba(46,204,113,0.18)" strokeWidth="5">
              <animate attributeName="r" values="74;80;74" dur="0.55s" repeatCount="indefinite"/>
            </circle>}
            {loading && <circle cx="100" cy="123" r="80" fill="none" stroke="rgba(155,89,182,0.15)" strokeWidth="3">
              <animate attributeName="r" values="77;84;77" dur="2s" repeatCount="indefinite"/>
            </circle>}
          </g>
        </g>
      </g>

      {/* ══ BARRE BAS TICKER ══ */}
      <rect x="0" y={VH-26} width={VW} height="26" fill="rgba(8,6,2,0.93)"/>
      <line x1="0" y1={VH-26} x2={VW} y2={VH-26} stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
      {/* Badge état */}
      <rect x="8" y={VH-20} width="88" height="14" rx="3" fill={statusColor} opacity="0.85"/>
      <text x="52" y={VH-10} textAnchor="middle" fontFamily="monospace" fontSize="7.5"
        fill="white" fontWeight="700" letterSpacing="1.5">
        {listening?'⏺ ÉCOUTE':speaking?'▶ PARLE':loading?'◆ ANALYSE':'● EN LIGNE'}
      </text>
      {/* Séparateur */}
      <line x1="102" y1={VH-23} x2="102" y2={VH-3} stroke="rgba(201,168,76,0.25)" strokeWidth="1"/>
      {/* Ticker */}
      <clipPath id="s-tick-clip"><rect x="106" y={VH-26} width={VW-200} height="26"/></clipPath>
      <text x={tickerX+106} y={VH-10} fontFamily="monospace" fontSize="9"
        fill="rgba(255,240,200,0.55)" letterSpacing="1" clipPath="url(#s-tick-clip)">
        Lola — TC Expertise &amp; Énergie  •  Assistante IA personnelle  •  lola-voice.vercel.app
      </text>
      {/* Logo */}
      <text x={VW-10} y={VH-13} textAnchor="end" fontFamily="Georgia,serif" fontSize="8.5"
        fill="rgba(201,168,76,0.5)">TC Expertise &amp; Énergie</text>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </svg>
  )
}
