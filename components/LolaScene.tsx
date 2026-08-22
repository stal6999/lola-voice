'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, useAnimationControls } from 'motion/react'

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

// Positions de Lola dans la scène (% de la largeur/hauteur du SVG 800x600)
const POSITIONS = {
  center:  { x: 380, y: 520 },  // debout centre
  left:    { x: 220, y: 520 },  // vers la fenêtre
  desk:    { x: 560, y: 520 },  // devant son bureau
  sitting: { x: 420, y: 560 },  // assise (pieds plus bas)
}

// Comportements selon l'état
const STATE_BEHAVIORS: Record<LolaState, { pos: keyof typeof POSITIONS; sitting: boolean; action: string }> = {
  idle:      { pos: 'center', sitting: false, action: 'wander' },
  listening: { pos: 'center', sitting: false, action: 'attentive' },
  thinking:  { pos: 'desk',   sitting: true,  action: 'coffee' },
  speaking:  { pos: 'center', sitting: false, action: 'gesture' },
  loading:   { pos: 'desk',   sitting: true,  action: 'wait' },
  alert:     { pos: 'center', sitting: false, action: 'alert' },
  happy:     { pos: 'center', sitting: false, action: 'celebrate' },
}

export default function LolaScene({
  width, height, screenContent, speaking = false, listening = false,
  loading = false, lolaState = 'idle',
  mouthState = 'closed', blinking = false, expression = 'neutral',
  breathPhase = 0, headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', mobileMode = false,
}: LolaSceneProps) {

  const [displayedText, setDisplayedText] = useState('')
  const [lolaPos, setLolaPos] = useState(POSITIONS.center)
  const [isSitting, setIsSitting] = useState(false)
  const [tickerX, setTickerX] = useState(width)
  const animRef = useRef<number | null>(null)
  const prevState = useRef<LolaState>('idle')

  // Typewriter
  useEffect(() => {
    if (!screenContent) { setDisplayedText(''); return }
    let i = 0; setDisplayedText('')
    const id = setInterval(() => {
      if (i >= screenContent.length) { clearInterval(id); return }
      setDisplayedText(screenContent.slice(0, i + 1)); i++
    }, 14)
    return () => clearInterval(id)
  }, [screenContent])

  // Ticker
  useEffect(() => {
    const msg = 'Lola — TC Expertise & Énergie  •  Assistante IA personnelle  •  '
    let x = width
    const tick = () => {
      x -= 0.8; if (x < -msg.length * 7) x = width
      setTickerX(x); animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [width])

  // Comportement selon état
  useEffect(() => {
    if (lolaState === prevState.current) return
    prevState.current = lolaState
    const behavior = STATE_BEHAVIORS[lolaState]
    // Transition position fluide (déclenché par motion animate)
    setLolaPos(POSITIONS[behavior.pos])
    setIsSitting(behavior.sitting)
  }, [lolaState])

  // SVG viewBox — toujours 800x600 (scaled)
  const VW = 800, VH = 600

  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.8
  const eyeRY = blinking ? 0.3 : 6.5
  const px = eyeShiftX * 0.5
  const py = eyeShiftY * 0.5
  const browY = microExpression === 'brow-raise' ? -3 : 0
  const tilt = headTiltX * 0.35
  const mouthPath = {
    closed: microExpression === 'slight-smile' ? 'M 87,177 Q 94,183 100,184 Q 106,183 113,177' : 'M 88,179 Q 94,182 100,183 Q 106,182 112,179',
    half: 'M 85,177 Q 93,185 100,187 Q 107,185 115,177 Q 107,183 100,184 Q 93,183 85,177',
    open: 'M 83,175 Q 91,193 100,196 Q 109,193 117,175 Q 109,187 100,189 Q 91,187 83,175',
  }[mouthState]

  // Lola scale selon si elle est sur PC ou mobile
  const lolaScale = mobileMode ? 0.85 : 0.92
  const lolaBodyH = 480 * lolaScale
  const lolaPosY = isSitting ? lolaPos.y + 30 : lolaPos.y

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Studio background */}
        <linearGradient id="sc-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1508" />
          <stop offset="60%" stopColor="#0e0c05" />
          <stop offset="100%" stopColor="#080602" />
        </linearGradient>
        {/* Fenêtre — forêt lumineuse */}
        <linearGradient id="sc-window-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="50%" stopColor="#b8e4f0" />
          <stop offset="100%" stopColor="#d4f0c8" />
        </linearGradient>
        {/* Spot lumière sur Lola */}
        <radialGradient id="sc-spotlight" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stopColor="rgba(255,220,160,0.14)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Lueur écran vert sur Lola */}
        <radialGradient id="sc-screen-glow" cx="75%" cy="25%" r="35%">
          <stop offset="0%" stopColor="rgba(0,200,80,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Peau Lola */}
        <radialGradient id="sc-skin" cx="44%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#fde8ce" />
          <stop offset="40%" stopColor="#f0cfa8" />
          <stop offset="100%" stopColor="#d8a070" />
        </radialGradient>
        <linearGradient id="sc-hair" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#5c3f2a" />
          <stop offset="50%" stopColor="#4a3020" />
          <stop offset="100%" stopColor="#2e1c0e" />
        </linearGradient>
        <linearGradient id="sc-sweater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8dcc8" />
          <stop offset="100%" stopColor="#c4b49a" />
        </linearGradient>
        <linearGradient id="sc-pants" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a3050" />
          <stop offset="100%" stopColor="#141830" />
        </linearGradient>
        <linearGradient id="sc-slipper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a84c" />
          <stop offset="100%" stopColor="#9a7028" />
        </linearGradient>
        <radialGradient id="sc-iris" cx="40%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#ecc870" />
          <stop offset="50%" stopColor="#b88030" />
          <stop offset="100%" stopColor="#6a4510" />
        </radialGradient>
        <linearGradient id="sc-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d48080" />
          <stop offset="100%" stopColor="#a85050" />
        </linearGradient>
        <radialGradient id="sc-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,130,130,0.22)" />
          <stop offset="100%" stopColor="rgba(220,130,130,0)" />
        </radialGradient>
        {/* Écran */}
        <linearGradient id="sc-screen-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020a02" />
          <stop offset="100%" stopColor="#010601" />
        </linearGradient>
        <clipPath id="sc-screen-clip"><rect x="492" y="42" width="248" height="180" rx="4" /></clipPath>
        <clipPath id="sc-window-clip"><rect x="44" y="58" width="180" height="240" rx="4" /></clipPath>
        <filter id="sc-glow-warm"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="sc-glow-green"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="sc-shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.5"/></filter>
      </defs>

      {/* ══ FOND STUDIO ══ */}
      <rect width={VW} height={VH} fill="url(#sc-bg)" />

      {/* Spot lumière centre scène */}
      <ellipse cx="400" cy="200" rx="320" ry="260" fill="url(#sc-spotlight)" />
      <ellipse cx="600" cy="150" rx="200" ry="180" fill="url(#sc-screen-glow)" />

      {/* ══ FENÊTRE GAUCHE (forêt lumineuse) ══ */}
      <rect x="44" y="58" width="180" height="240" rx="4" fill="url(#sc-window-sky)" clipPath="url(#sc-window-clip)" />
      {/* Arbres dans la fenêtre */}
      <g clipPath="url(#sc-window-clip)">
        <path d="M 44,260 Q 80,180 110,220 Q 130,170 160,200 Q 180,155 224,185 L 224,298 L 44,298 Z" fill="#3a8a22" opacity="0.9" />
        <path d="M 44,298 Q 90,250 130,270 Q 160,240 224,260 L 224,298 Z" fill="#4aaa2a" opacity="0.7" />
        {/* Lumière soleil */}
        <circle cx="190" cy="85" r="25" fill="rgba(255,240,160,0.6)" />
        <circle cx="190" cy="85" r="40" fill="rgba(255,240,160,0.15)" />
        {/* Nuages */}
        <ellipse cx="80" cy="95" rx="28" ry="10" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="68" cy="99" rx="18" ry="9" fill="rgba(255,255,255,0.65)" />
      </g>
      {/* Cadre fenêtre */}
      <rect x="44" y="58" width="180" height="240" rx="4" fill="none" stroke="#3a2818" strokeWidth="8" />
      <line x1="134" y1="58" x2="134" y2="298" stroke="#3a2818" strokeWidth="5" />
      <line x1="44" y1="178" x2="224" y2="178" stroke="#3a2818" strokeWidth="4" />
      {/* Rebord fenêtre */}
      <rect x="38" y="295" width="192" height="12" rx="3" fill="#4a3018" />

      {/* ══ ÉTAGÈRES GAUCHE ══ */}
      <rect x="30" y="310" width="210" height="8" rx="3" fill="#5a3c1a" />
      <rect x="30" y="370" width="210" height="8" rx="3" fill="#5a3c1a" />
      <rect x="30" y="430" width="210" height="8" rx="3" fill="#5a3c1a" />
      {/* Livres sur étagères */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={`b1${i}`} x={38+i*28} y={278+i%2*4} width={22} height={30} rx={2}
          fill={['#c44','#48a','#8a4','#a84','#648','#884','#468'][i]} opacity="0.85" />
      ))}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={`b2${i}`} x={38+i*28} y={338+i%2*3} width={18} height={30} rx={2}
          fill={['#a66','#68c','#6a6','#ca6','#86a','#aa6','#688'][i]} opacity="0.75" />
      ))}

      {/* ══ ÉCRAN DROIT ══ */}
      {/* Cadre TV */}
      <rect x="484" y="34" width="264" height="196" rx="10" fill="#0a0a08" />
      <rect x="492" y="42" width="248" height="180" rx="4" fill="url(#sc-screen-bg)" />
      {/* Lueur écran */}
      <rect x="492" y="42" width="248" height="180" rx="4" fill="none" stroke="rgba(0,200,80,0.35)" strokeWidth="1.5" />
      <rect x="484" y="34" width="264" height="196" rx="10" fill="none" stroke="rgba(0,200,80,0.12)" strokeWidth="2" filter="url(#sc-glow-green)" />
      {/* Pied écran */}
      <rect x="590" y="230" width="20" height="30" fill="#1a1a16" />
      <rect x="570" y="258" width="60" height="8" rx="4" fill="#1a1a16" />

      {/* Contenu écran — foreignObject */}
      <foreignObject x={492} y={42} width={248} height={180} clipPath="url(#sc-screen-clip)">
        {/* @ts-expect-error foreignObject div requires xmlns in SVG context */}
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', height: '100%',
          padding: '10px 12px',
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: '#00e050',
          lineHeight: '1.6',
          overflowY: 'auto',
          background: 'transparent',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textShadow: '0 0 6px rgba(0,220,80,0.5)',
        }}>
          {screenContent ? displayedText : (
            speaking ? '▶ LOLA SPEAKING...' :
            loading ? '◆ PROCESSING...' :
            listening ? '⏺ LISTENING...' :
            '■ LOLA SYSTEM ACTIVE\n> Prêt pour vos instructions\n> Mémoire chargée\n> Connexion établie'
          )}
          {screenContent && <span style={{ opacity: 0.7 }}>|</span>}
        </div>
      </foreignObject>

      {/* Header écran */}
      <rect x="492" y="42" width="248" height="16" rx="0" fill="rgba(0,0,0,0.5)" />
      {[0,1,2].map(i => <circle key={i} cx={500+i*10} cy={50} r={3} fill={['#e74c3c','#f39c12','#2ecc71'][i]} opacity="0.7" />)}
      <text x="616" y="53" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="rgba(0,200,80,0.4)" letterSpacing="2">LOLA DISPLAY</text>

      {/* Waveform si Lola parle */}
      {speaking && (
        <g>
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => {
            const bh = 6 + Math.sin(i * 0.8) * 14
            return (
              <rect key={i} x={516+i*14} y={120-bh/2} width={10} height={bh} rx="3"
                fill="rgba(0,220,80,0.55)">
                <animate attributeName="height" values={`${bh};${5+Math.random()*28};${bh}`}
                  dur={`${0.2+i*0.04}s`} repeatCount="indefinite" />
              </rect>
            )
          })}
        </g>
      )}

      {/* ══ BUREAU / ESPACE SOL ══ */}
      {/* Sol parquet */}
      <path d="M 0,480 L 800,480 L 800,600 L 0,600 Z" fill="#1a1208" />
      <line x1="0" y1="480" x2="800" y2="480" stroke="rgba(120,80,30,0.3)" strokeWidth="1" />
      {/* Planches parquet */}
      {[0,1,2,3,4].map(i => <line key={`fl${i}`} x1="0" y1={490+i*22} x2="800" y2={490+i*22} stroke="rgba(90,60,20,0.18)" strokeWidth="0.8" />)}

      {/* Bureau à droite */}
      <rect x="440" y="420" width="340" height="16" rx="4" fill="#3a2810" />
      <rect x="440" y="436" width="340" height="8" rx="2" fill="#2a1e0a" opacity="0.6" />
      {/* Objets bureau */}
      {/* Tasse café */}
      <ellipse cx="490" cy="418" rx="16" ry="8" fill="#1a1008" />
      <rect x="476" y="402" width="28" height="16" rx="4" fill="#2a1e10" />
      <ellipse cx="490" cy="402" rx="14" ry="5" fill="#3a2a18" />
      <path d="M 504,408 Q 514,412 504,416" fill="none" stroke="#3a2a18" strokeWidth="2" />
      {/* Vapeur café si réflexion */}
      {(lolaState === 'thinking' || lolaState === 'loading') && (
        <g opacity="0.5">
          <path d="M 486,400 Q 484,394 486,388 Q 488,382 486,376" fill="none" stroke="#a0a090" strokeWidth="1.2"><animate attributeName="opacity" values="0;0.6;0" dur="2s" repeatCount="indefinite" /></path>
          <path d="M 492,400 Q 494,393 492,386 Q 490,380 492,374" fill="none" stroke="#a0a090" strokeWidth="1"><animate attributeName="opacity" values="0;0.5;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" /></path>
        </g>
      )}
      {/* Anti-stress si chargement long */}
      {lolaState === 'loading' && (
        <g transform="translate(740, 418)">
          <ellipse cx="0" cy="0" rx="14" ry="10" fill="#4a8a4a" opacity="0.8" />
          <circle cx="0" cy="-2" r="5" fill="#6aaa6a" opacity="0.7">
            <animateTransform attributeName="transform" type="scale" values="1;0.9;1" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* ══ LOLA — personnage vivant dans la scène ══ */}
      <g
        transform={`translate(${lolaPos.x - 100 * lolaScale}, ${lolaPosY - lolaBodyH + breathY})`}
        filter="url(#sc-shadow)"
        style={{ transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <g transform={`scale(${lolaScale})`}>
          {/* Ombre au sol */}
          <ellipse cx="100" cy={isSitting ? 510 : 476} rx={isSitting ? 55 : 46} ry="7"
            fill="rgba(0,0,0,0.5)" />

          {/* === CORPS === */}
          {/* Jambes */}
          {!isSitting ? (
            <>
              <path d="M 76,308 Q 72,358 70,398 Q 68,428 72,448 Q 74,456 82,458 L 94,458 Q 100,456 100,448 Q 99,428 98,398 Q 97,358 95,308 Z" fill="url(#sc-pants)" />
              <path d="M 105,308 Q 104,358 103,398 Q 102,428 101,448 Q 100,456 106,458 L 118,458 Q 126,456 128,448 Q 128,428 126,398 Q 124,358 122,308 Z" fill="url(#sc-pants)" />
              {/* Chaussons */}
              <path d="M 68,450 Q 60,454 56,464 Q 54,472 62,475 L 98,475 Q 104,472 102,464 Q 100,456 95,452 Z" fill="url(#sc-slipper)" />
              <circle cx="66" cy="458" r="5" fill="#e8c870" /><circle cx="66" cy="458" r="3" fill="#f0d888" />
              <path d="M 100,454 Q 98,460 96,466 Q 94,474 102,476 L 132,476 Q 140,472 138,464 Q 136,456 130,452 Z" fill="url(#sc-slipper)" />
              <circle cx="130" cy="458" r="5" fill="#e8c870" /><circle cx="130" cy="458" r="3" fill="#f0d888" />
            </>
          ) : (
            <>
              {/* Jambes assises */}
              <path d="M 62,310 Q 50,340 48,370 Q 46,390 52,400 Q 60,410 80,408 L 90,400 Q 78,395 76,380 Q 74,360 82,330 Z" fill="url(#sc-pants)" />
              <path d="M 118,310 Q 130,340 132,370 Q 134,390 128,400 Q 120,410 100,408 L 92,400 Q 104,395 106,380 Q 108,360 100,330 Z" fill="url(#sc-pants)" />
              {/* Chaussons assis */}
              <path d="M 44,398 Q 38,408 42,416 Q 46,422 62,420 Q 76,418 80,412 Q 82,406 78,400 Z" fill="url(#sc-slipper)" />
              <path d="M 116,398 Q 118,408 122,414 Q 126,420 142,418 Q 156,416 158,408 Q 158,402 150,398 Z" fill="url(#sc-slipper)" />
            </>
          )}

          {/* Corps pull */}
          <path d="M 52,213 Q 44,238 42,268 Q 40,298 42,313 L 158,313 Q 160,298 158,268 Q 156,238 148,213 Q 138,203 100,201 Q 62,203 52,213 Z" fill="url(#sc-sweater)" />
          <path d="M 82,206 Q 82,198 88,196 L 112,196 Q 118,198 118,206 L 118,216 Q 118,222 112,224 L 88,224 Q 82,222 82,216 Z" fill="#d4c8b0" />

          {/* Bras — position selon action */}
          {lolaState === 'speaking' ? (
            <>
              {/* Bras gauche levé (geste) */}
              <path d="M 52,216 Q 30,200 18,175 Q 10,155 18,142 Q 26,130 38,136 L 44,148 Q 36,148 34,158 Q 30,172 46,186 Q 56,195 64,210 Z" fill="url(#sc-sweater)" />
              <path d="M 14,142 Q 6,134 8,120 Q 12,108 26,108 Q 38,108 40,120 Q 42,132 36,140 Z" fill="url(#sc-skin)" />
              {/* Bras droit normal */}
              <path d="M 148,216 Q 163,226 170,243 Q 176,258 173,273 Q 169,286 160,292 L 152,282 Q 160,276 162,263 Q 163,250 157,238 Q 150,226 138,220 Z" fill="url(#sc-sweater)" />
              <path d="M 176,298 Q 182,305 181,316 Q 179,326 170,328 Q 160,330 158,320 Q 156,310 162,304 Z" fill="url(#sc-skin)" />
            </>
          ) : lolaState === 'thinking' || lolaState === 'loading' ? (
            <>
              {/* Bras droit vers la tasse */}
              <path d="M 148,216 Q 155,224 152,240 Q 150,252 140,258 Q 132,264 124,256 L 128,246 Q 134,252 140,246 Q 148,236 142,222 Z" fill="url(#sc-sweater)" />
              <path d="M 110,254 Q 108,264 112,272 Q 118,280 130,278 Q 140,274 142,264 Q 142,256 136,252 Z" fill="url(#sc-skin)" />
              {/* Bras gauche normal */}
              <path d="M 52,216 Q 36,226 28,246 Q 22,263 26,278 Q 30,290 40,294 L 48,284 Q 40,278 38,266 Q 36,253 44,236 Q 52,223 62,218 Z" fill="url(#sc-sweater)" />
              <path d="M 22,306 Q 18,314 20,324 Q 23,334 34,334 Q 44,334 46,326 Q 48,316 42,310 Z" fill="url(#sc-skin)" />
            </>
          ) : (
            <>
              {/* Bras gauche normal */}
              <path d="M 52,216 Q 36,226 28,246 Q 22,263 26,278 Q 30,290 40,294 L 48,284 Q 40,278 38,266 Q 36,253 44,236 Q 52,223 62,218 Z" fill="url(#sc-sweater)" />
              <path d="M 26,278 Q 22,293 24,306 Q 26,318 36,320 L 44,310 Q 36,308 35,298 Q 34,288 40,284 Z" fill="url(#sc-sweater)" />
              <path d="M 22,306 Q 18,314 20,324 Q 23,334 34,334 Q 44,334 46,326 Q 48,316 42,310 Z" fill="url(#sc-skin)" />
              {/* Bras droit normal */}
              <path d="M 148,216 Q 163,226 170,243 Q 176,258 173,273 Q 169,286 160,292 L 152,282 Q 160,276 162,263 Q 163,250 157,238 Q 150,226 138,220 Z" fill="url(#sc-sweater)" />
              <path d="M 173,273 Q 178,286 177,298 Q 175,310 166,316 L 158,306 Q 165,304 166,294 Q 167,284 162,278 Z" fill="url(#sc-sweater)" />
              <path d="M 176,298 Q 182,305 181,316 Q 179,326 170,328 Q 160,330 158,320 Q 156,310 162,304 Z" fill="url(#sc-skin)" />
            </>
          )}

          {/* Pendentif */}
          <path d="M 94,224 Q 96,231 100,236 Q 104,231 106,224" fill="none" stroke="rgba(0,200,80,0.5)" strokeWidth="0.8" />
          <path d="M 100,236 L 96,242 L 100,248 L 104,242 Z" fill="rgba(0,220,80,0.85)" />
          <circle cx="99" cy="240" r="1" fill="white" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" /></circle>

          {/* Cou */}
          <path d="M 87,200 L 87,213 Q 87,218 93,220 L 107,220 Q 113,218 113,213 L 113,200" fill="url(#sc-skin)" />

          {/* === TÊTE === */}
          <g transform={`rotate(${tilt}, 100, 155)`}>
            <ellipse cx="100" cy="113" rx="63" ry="72" fill="url(#sc-hair)" />
            <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="url(#sc-skin)" />
            {/* Lumières sur visage */}
            <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(255,200,120,0.05)" />
            <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(0,200,80,0.03)" />

            {/* Cheveux */}
            <path d="M 53,110 Q 49,72 69,54 Q 83,41 100,39 Q 117,41 131,54 Q 151,72 147,110 Q 145,88 135,74 Q 125,62 114,62 Q 106,62 100,68 Q 90,60 79,63 Q 65,68 56,86 Z" fill="url(#sc-hair)" />
            <path d="M 149,150 Q 157,170 158,200 Q 160,225 156,248 Q 152,265 148,272 Q 153,255 152,232 Q 151,206 146,185 Q 141,165 144,150 Z" fill="url(#sc-hair)" />

            {/* Sourcils */}
            <g transform={`translate(0,${browY})`}>
              <path d="M 64,111 Q 71,105 79,106 Q 85,107 91,110" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 109,110 Q 115,107 121,106 Q 129,105 136,111" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Joues */}
            <ellipse cx="68" cy="156" rx="14" ry="9" fill="url(#sc-blush)" />
            <ellipse cx="132" cy="156" rx="14" ry="9" fill="url(#sc-blush)" />

            {/* Oeil gauche */}
            <ellipse cx="78" cy="130" rx="11.5" ry={eyeRY+1} fill="#f8f4f0" />
            {blinking ? <path d="M 67,130 Q 78,132 89,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" /> : <>
              <ellipse cx={78+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#sc-iris)" />
              <circle cx={78+px} cy={130+py} r="3.4" fill="#140f04" />
              <circle cx={80+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
              <circle cx={76+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
            </>}
            <path d={`M 67,${130-eyeRY-0.5} Q 78,${124-eyeRY} 89,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />
            <path d={`M 67,${130-eyeRY-1} Q 65,${128-eyeRY} 63,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />

            {/* Oeil droit */}
            <ellipse cx="122" cy="130" rx="11.5" ry={eyeRY+1} fill="#f8f4f0" />
            {blinking ? <path d="M 111,130 Q 122,132 133,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" /> : <>
              <ellipse cx={122+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#sc-iris)" />
              <circle cx={122+px} cy={130+py} r="3.4" fill="#140f04" />
              <circle cx={124+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
              <circle cx={120+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
            </>}
            <path d={`M 111,${130-eyeRY-0.5} Q 122,${124-eyeRY} 133,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />

            {/* Nez */}
            <path d="M 99,128 Q 97,140 96,148 Q 92,156 92,158 Q 95,162 100,163 Q 105,162 108,158 Q 108,156 104,148 Q 103,140 101,128" fill="none" stroke="rgba(175,130,100,0.2)" strokeWidth="0.85" />

            {/* Bouche */}
            <path d={mouthPath} fill={mouthState !== 'closed' ? 'url(#sc-lip)' : 'none'} stroke={mouthState === 'closed' ? '#b87272' : 'none'} strokeWidth="1.4" />
            {mouthState === 'open' && <path d="M 89,179 Q 100,176 111,179" fill="#f5f0ec" opacity="0.9" />}
            {(expression === 'smiling' || microExpression === 'slight-smile') && <>
              <path d="M 77,173 Q 75,177 77,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
              <path d="M 123,173 Q 125,177 123,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
            </>}

            {/* Auras état */}
            {listening && <circle cx="100" cy="124" r="78" fill="none" stroke="rgba(231,76,60,0.2)" strokeWidth="4"><animate attributeName="r" values="74;80;74" dur="1.4s" repeatCount="indefinite" /></circle>}
            {speaking && <circle cx="100" cy="124" r="76" fill="none" stroke="rgba(0,200,80,0.15)" strokeWidth="5"><animate attributeName="r" values="72;78;72" dur="0.55s" repeatCount="indefinite" /></circle>}
            {loading && <circle cx="100" cy="124" r="78" fill="none" stroke="rgba(155,89,182,0.15)" strokeWidth="3"><animate attributeName="r" values="75;82;75" dur="2s" repeatCount="indefinite" /></circle>}
          </g>
        </g>
      </g>

      {/* ══ BARRE BAS — ticker ══ */}
      <rect x="0" y={VH - 28} width={VW} height="28" fill="rgba(4,3,1,0.9)" />
      <line x1="0" y1={VH - 28} x2={VW} y2={VH - 28} stroke="rgba(201,168,76,0.25)" strokeWidth="1" />
      {/* Badge état */}
      <rect x="8" y={VH - 22} width="80" height="14" rx="3" fill={
        listening ? 'rgba(231,76,60,0.8)' : speaking ? 'rgba(46,204,113,0.8)' : loading ? 'rgba(155,89,182,0.7)' : 'rgba(39,174,96,0.7)'
      } />
      <text x="48" y={VH - 12} textAnchor="middle" fontFamily="monospace" fontSize="7" fill="white" fontWeight="bold" letterSpacing="1.5">
        {listening ? '⏺ ÉCOUTE' : speaking ? '▶ PARLE' : loading ? '◆ ANALYSE' : '● EN LIGNE'}
      </text>
      {/* Séparateur */}
      <line x1="96" y1={VH - 24} x2="96" y2={VH - 4} stroke="rgba(201,168,76,0.2)" strokeWidth="1" />
      {/* Ticker text */}
      <clipPath id="sc-ticker-clip"><rect x="100" y={VH - 28} width={VW - 180} height="28" /></clipPath>
      <text x={tickerX + 100} y={VH - 11} fontFamily="monospace" fontSize="9" fill="rgba(255,240,200,0.5)" letterSpacing="1" clipPath="url(#sc-ticker-clip)">
        Lola — TC Expertise & Énergie  •  Assistante IA personnelle  •  lola-voice.vercel.app
      </text>
      {/* Logo droite */}
      <text x={VW - 8} y={VH - 14} textAnchor="end" fontFamily="Georgia, serif" fontSize="8" fill="rgba(201,168,76,0.45)" letterSpacing="0.5">TC Expertise & Énergie</text>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </svg>
  )
}
