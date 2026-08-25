'use client'

import React, { useEffect, useState, useRef } from 'react'

interface LolaHomeProps {
  width: number
  height: number
  screenContent?: string | null
  audioActive?: boolean
  lolaEmotion?: 'neutral' | 'happy' | 'thinking' | 'listening' | 'excited'
  mouthState?: 'closed' | 'half' | 'open'
  blinking?: boolean
  expression?: 'neutral' | 'listening' | 'thinking' | 'smiling'
  breathPhase?: number
  headTiltX?: number
  eyeShiftX?: number
  eyeShiftY?: number
  microExpression?: 'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'
  speaking?: boolean
  listening?: boolean
  statusText?: string
  tickerMessages?: string[]
}

export default function LolaHome({
  width, height, screenContent, audioActive, lolaEmotion = 'neutral',
  mouthState = 'closed', blinking = false, expression = 'neutral',
  breathPhase = 0, headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', speaking = false, listening = false,
  statusText = 'EN LIGNE',
  tickerMessages = ['Lola — Assistante IA • TC Expertise & Énergie • Christophe Talloen'],
}: LolaHomeProps) {

  const [tickerX, setTickerX] = useState(width || 390)
  const [displayedText, setDisplayedText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const animRef = useRef<number | null>(null)

  // Ticker scrolling
  useEffect(() => {
    const msg = tickerMessages[0] + '   •   ' + tickerMessages[0]
    let x = width
    const speed = 1.2
    const tick = () => {
      x -= speed
      if (x < -msg.length * 8.5) x = width
      setTickerX(x)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [width, tickerMessages])

  // Typewriter for screen content
  useEffect(() => {
    if (!screenContent) { setDisplayedText(''); setCharIdx(0); return }
    setDisplayedText('')
    setCharIdx(0)
    let i = 0
    const id = setInterval(() => {
      if (i >= screenContent.length) { clearInterval(id); return }
      setDisplayedText(screenContent.slice(0, i + 1))
      i++
    }, 16)
    return () => clearInterval(id)
  }, [screenContent])

  const breathY = Math.sin(breathPhase * Math.PI * 2) * 1.5
  const eyeRY = blinking ? 0.3 : 6.5
  const px = eyeShiftX * 0.5
  const py = eyeShiftY * 0.5
  const browY = microExpression === 'brow-raise' ? -3 : 0
  const tilt = headTiltX * 0.4
  const mouthPath = {
    closed: microExpression === 'slight-smile' ? 'M 87,177 Q 94,183 100,184 Q 106,183 113,177' : 'M 88,179 Q 94,182 100,183 Q 106,182 112,179',
    half: 'M 85,177 Q 93,185 100,187 Q 107,185 115,177 Q 107,183 100,184 Q 93,183 85,177',
    open: 'M 83,175 Q 91,193 100,196 Q 109,193 117,175 Q 109,187 100,189 Q 91,187 83,175',
  }[mouthState]

  const statusColor = listening ? '#e74c3c' : speaking ? '#2ecc71' : lolaEmotion === 'thinking' ? '#9b59b6' : '#27ae60'
  const barH = Math.max(52, height * 0.07)
  const tickerH = Math.max(22, height * 0.03)
  const totalBarH = barH + tickerH

  // Screen area: left 58% of width, top to bar
  const screenW = width * 0.58
  const screenH = height - totalBarH
  // Lola area: right 42%, shown from waist up
  const lolaAreaX = screenW
  const lolaAreaW = width - screenW
  // Lola SVG scale — she appears from ~halfway up
  const lolaScale = lolaAreaW / 200
  const lolaH = 480 * lolaScale
  const lolaTop = height - totalBarH - lolaH + lolaH * 0.1 // légèrement dans le bas

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1a120a' }}>

      {/* ══ STUDIO BACKGROUND ══ */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 40%, #2a1e0e 0%, #1a1208 50%, #0e0c06 100%)',
      }} />

      {/* Ambient studio lights */}
      <div style={{ position: 'absolute', top: 0, left: '60%', right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,200,100,0.08) 0%, transparent 70%)',
        pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: screenW, bottom: totalBarH,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(0,180,80,0.06) 0%, transparent 70%)',
        pointerEvents: 'none' }} />

      {/* ══ GRAND ÉCRAN GAUCHE ══ */}
      <div style={{
        position: 'absolute', left: 12, top: 12,
        width: screenW - 24, height: screenH - 20,
        borderRadius: 8,
        background: '#020802',
        border: '2px solid rgba(0,200,80,0.3)',
        boxShadow: '0 0 30px rgba(0,200,80,0.12), inset 0 0 40px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Screen header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 24,
          background: 'rgba(0,0,0,0.7)',
          borderBottom: '1px solid rgba(0,200,80,0.15)',
          display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 6,
        }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ['#e74c3c','#f39c12','#2ecc71'][i], opacity: 0.7 }} />)}
          <span style={{ fontSize: 9, color: 'rgba(0,200,80,0.5)', fontFamily: 'monospace', letterSpacing: 2, marginLeft: 6 }}>LOLA DISPLAY</span>
          {/* LED status */}
          <div style={{ marginLeft: 'auto', marginRight: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 8, color: 'rgba(0,200,80,0.4)', fontFamily: 'monospace' }}>LIVE</span>
          </div>
        </div>

        {/* Grid overlay */}
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <line key={`v${i}`} x1={`${i*10}%`} y1="0" x2={`${i*10}%`} y2="100%"
              stroke="rgba(0,200,80,0.03)" strokeWidth="0.5" />
          ))}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <line key={`h${i}`} x1="0" y1={`${i*10}%`} x2="100%" y2={`${i*10}%`}
              stroke="rgba(0,200,80,0.03)" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Screen content */}
        {screenContent ? (
          <div style={{
            position: 'absolute', inset: '28px 0 0 0',
            padding: '14px 16px', overflowY: 'auto',
            fontFamily: '"Courier New", monospace',
            fontSize: Math.max(11, width * 0.022),
            color: '#00e050', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            textShadow: '0 0 8px rgba(0,220,80,0.5)',
          }}>
            {displayedText}
            <span style={{ opacity: 0.7, animation: 'pulse 0.8s infinite' }}>|</span>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: '28px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {/* Waveform if speaking */}
            {audioActive ? (
              <svg width={screenW * 0.7} height="60">
                {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => {
                  const h = 6 + Math.sin(i * 0.85) * 22
                  return (
                    <rect key={i} x={i * (screenW * 0.7 / 15)} y={30 - h/2}
                      width={screenW * 0.7 / 15 - 4} height={h} rx="3"
                      fill="rgba(0,220,80,0.6)">
                      <animate attributeName="height"
                        values={`${h};${5+Math.random()*32};${h}`}
                        dur={`${0.22+i*0.04}s`} repeatCount="indefinite" />
                    </rect>
                  )
                })}
              </svg>
            ) : (
              <>
                {/* Idle matrix rain */}
                <svg width={screenW - 48} height={(screenH - 50) * 0.6} style={{ opacity: 0.6 }}>
                  {['L','O','L','A','0','1','∆','λ','Ω','▓','░','╬','►','◄','◆'].map((c, i) => (
                    <text key={i} x={(i % 10) * ((screenW-48)/10)} fontFamily="monospace"
                      fontSize={Math.max(10, screenW * 0.025)}
                      fill={`rgba(0,${170+i*5},${50+i*4},0.7)`} y="20">
                      {c}
                      <animate attributeName="y" values={`0;${(screenH-80)*0.6};0`}
                        dur={`${3.5+i*0.5}s`} begin={`${i*0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0.8;0.4;0.8;0"
                        dur={`${3.5+i*0.5}s`} begin={`${i*0.3}s`} repeatCount="indefinite" />
                    </text>
                  ))}
                </svg>
                <div style={{ fontFamily: 'monospace', fontSize: Math.max(9, screenW * 0.018), color: 'rgba(0,200,80,0.2)', letterSpacing: 3, textAlign: 'center' }}>
                  SYSTÈME ACTIF
                </div>
              </>
            )}
            {/* Corner brackets */}
            <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
              {[[6,28,'10,28 6,28 6,38'],[`calc(100% - 6)`,28,`calc(100% - 16),28 calc(100% - 6),28 calc(100% - 6),38`]].map((_, i) => null)}
              {['M 10 28 L 6 28 L 6 38','M calc(100% - 10) 28 L calc(100% - 6) 28 L calc(100% - 6) 38',
                'M 10 calc(100% - 6) L 6 calc(100% - 6) L 6 calc(100% - 16)',
                'M calc(100% - 10) calc(100% - 6) L calc(100% - 6) calc(100% - 6) L calc(100% - 6) calc(100% - 16)'].map((d,i) => (
                <path key={i} d={d} fill="none" stroke="rgba(0,200,80,0.3)" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* ══ LOLA — CÔTÉ DROIT, MI-CORPS ══ */}
      <div style={{
        position: 'absolute',
        left: lolaAreaX,
        top: lolaTop,
        width: lolaAreaW,
        height: lolaH,
        pointerEvents: 'none',
      }}>
        {/* Studio lights sur Lola */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 40% 20%, rgba(255,210,140,0.12) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        <svg viewBox="0 0 200 480" width={lolaAreaW} height={lolaH}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible', filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.6)) drop-shadow(-4px 0 12px rgba(255,210,140,0.08))` }}>
          <defs>
            <radialGradient id="n-skin" cx="44%" cy="32%" r="60%">
              <stop offset="0%" stopColor="#fde8ce" /><stop offset="40%" stopColor="#f0cfa8" /><stop offset="100%" stopColor="#d8a070" />
            </radialGradient>
            <linearGradient id="n-hair" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#5c3f2a" /><stop offset="50%" stopColor="#4a3020" /><stop offset="100%" stopColor="#2e1c0e" />
            </linearGradient>
            <linearGradient id="n-sweater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8dcc8" /><stop offset="100%" stopColor="#c4b49a" />
            </linearGradient>
            <linearGradient id="n-pants" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a3050" /><stop offset="100%" stopColor="#141830" />
            </linearGradient>
            <linearGradient id="n-slipper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a84c" /><stop offset="100%" stopColor="#9a7028" />
            </linearGradient>
            <radialGradient id="n-iris" cx="40%" cy="36%" r="62%">
              <stop offset="0%" stopColor="#ecc870" /><stop offset="50%" stopColor="#b88030" /><stop offset="100%" stopColor="#6a4510" />
            </radialGradient>
            <linearGradient id="n-lip" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d48080" /><stop offset="100%" stopColor="#a85050" />
            </linearGradient>
            <radialGradient id="n-blush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(220,130,130,0.22)" /><stop offset="100%" stopColor="rgba(220,130,130,0)" />
            </radialGradient>
          </defs>

          <g transform={`translate(0, ${breathY})`}>
            {/* Jambes */}
            <path d="M 76,308 Q 72,358 70,398 Q 68,428 72,448 Q 74,456 82,458 L 94,458 Q 100,456 100,448 Q 99,428 98,398 Q 97,358 95,308 Z" fill="url(#n-pants)" />
            <path d="M 105,308 Q 104,358 103,398 Q 102,428 101,448 Q 100,456 106,458 L 118,458 Q 126,456 128,448 Q 128,428 126,398 Q 124,358 122,308 Z" fill="url(#n-pants)" />
            {/* Chaussons */}
            <path d="M 68,450 Q 60,454 56,464 Q 54,472 62,475 L 98,475 Q 104,472 102,464 Q 100,456 95,452 Z" fill="url(#n-slipper)" />
            <circle cx="66" cy="458" r="5" fill="#e8c870" /><circle cx="66" cy="458" r="3" fill="#f0d888" />
            <path d="M 100,454 Q 98,460 96,466 Q 94,474 102,476 L 132,476 Q 140,472 138,464 Q 136,456 130,452 Z" fill="url(#n-slipper)" />
            <circle cx="130" cy="458" r="5" fill="#e8c870" /><circle cx="130" cy="458" r="3" fill="#f0d888" />
            {/* Ombre sol */}
            <ellipse cx="100" cy="476" rx="46" ry="6" fill="rgba(0,0,0,0.35)" />

            {/* Corps */}
            <path d="M 52,213 Q 44,238 42,268 Q 40,298 42,313 L 158,313 Q 160,298 158,268 Q 156,238 148,213 Q 138,203 100,201 Q 62,203 52,213 Z" fill="url(#n-sweater)" />
            {[0,1,2,3,4,5,6,7].map(i => <path key={i} d={`M ${50+i*14},218 Q ${57+i*14},223 ${50+i*14},228`} fill="none" stroke="rgba(160,140,100,0.07)" strokeWidth="0.6" />)}
            <path d="M 82,206 Q 82,198 88,196 L 112,196 Q 118,198 118,206 L 118,216 Q 118,222 112,224 L 88,224 Q 82,222 82,216 Z" fill="#d4c8b0" />

            {/* Bras gauche */}
            <path d="M 52,216 Q 36,226 28,246 Q 22,263 26,278 Q 30,290 40,294 L 48,284 Q 40,278 38,266 Q 36,253 44,236 Q 52,223 62,218 Z" fill="url(#n-sweater)" />
            <path d="M 26,278 Q 22,293 24,306 Q 26,318 36,320 L 44,310 Q 36,308 35,298 Q 34,288 40,284 Z" fill="url(#n-sweater)" />
            <path d="M 22,306 Q 18,314 20,324 Q 23,334 34,334 Q 44,334 46,326 Q 48,316 42,310 Z" fill="url(#n-skin)" />
            {/* Bras droit */}
            <path d="M 148,216 Q 163,226 170,243 Q 176,258 173,273 Q 169,286 160,292 L 152,282 Q 160,276 162,263 Q 163,250 157,238 Q 150,226 138,220 Z" fill="url(#n-sweater)" />
            <path d="M 173,273 Q 178,286 177,298 Q 175,310 166,316 L 158,306 Q 165,304 166,294 Q 167,284 162,278 Z" fill="url(#n-sweater)" />
            <path d="M 176,298 Q 182,305 181,316 Q 179,326 170,328 Q 160,330 158,320 Q 156,310 162,304 Z" fill="url(#n-skin)" />

            {/* Pendentif */}
            <path d="M 94,224 Q 96,231 100,236 Q 104,231 106,224" fill="none" stroke="rgba(0,200,80,0.5)" strokeWidth="0.8" />
            <path d="M 100,236 L 96,242 L 100,248 L 104,242 Z" fill="rgba(0,220,80,0.85)" />
            <circle cx="99" cy="240" r="1" fill="white" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" /></circle>

            {/* Cou */}
            <path d="M 87,200 L 87,213 Q 87,218 93,220 L 107,220 Q 113,218 113,213 L 113,200" fill="url(#n-skin)" />

            {/* TÊTE */}
            <g transform={`rotate(${tilt}, 100, 155)`}>
              <ellipse cx="100" cy="113" rx="63" ry="72" fill="url(#n-hair)" />
              <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="url(#n-skin)" />
              {/* Lumière studio warm */}
              <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(255,200,120,0.06)" />
              {/* Lumière écran vert */}
              <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(0,200,80,0.04)" />

              {/* Cheveux front */}
              <path d="M 53,110 Q 49,72 69,54 Q 83,41 100,39 Q 117,41 131,54 Q 151,72 147,110 Q 145,88 135,74 Q 125,62 114,62 Q 106,62 100,68 Q 90,60 79,63 Q 65,68 56,86 Z" fill="url(#n-hair)" />
              <path d="M 149,150 Q 157,170 158,200 Q 160,225 156,248 Q 152,265 148,272 Q 153,255 152,232 Q 151,206 146,185 Q 141,165 144,150 Z" fill="url(#n-hair)" />

              {/* Sourcils */}
              <g transform={`translate(0,${browY})`}>
                <path d="M 64,111 Q 71,105 79,106 Q 85,107 91,110" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 109,110 Q 115,107 121,106 Q 129,105 136,111" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
              </g>

              {/* Joues */}
              <ellipse cx="68" cy="156" rx="14" ry="9" fill="url(#n-blush)" />
              <ellipse cx="132" cy="156" rx="14" ry="9" fill="url(#n-blush)" />

              {/* Oeil gauche */}
              <ellipse cx="78" cy="130" rx="11.5" ry={eyeRY+1} fill="#f8f4f0" />
              {blinking ? <path d="M 67,130 Q 78,132 89,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" /> : <>
                <ellipse cx={78+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#n-iris)" />
                <circle cx={78+px} cy={130+py} r="3.4" fill="#140f04" />
                <circle cx={80+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
                <circle cx={76+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
              </>}
              <path d={`M 67,${130-eyeRY-0.5} Q 78,${124-eyeRY} 89,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />
              <path d={`M 67,${130-eyeRY-1} Q 65,${128-eyeRY} 63,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />
              <path d={`M 89,${130-eyeRY-1} Q 91,${128-eyeRY} 92,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />

              {/* Oeil droit */}
              <ellipse cx="122" cy="130" rx="11.5" ry={eyeRY+1} fill="#f8f4f0" />
              {blinking ? <path d="M 111,130 Q 122,132 133,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" /> : <>
                <ellipse cx={122+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#n-iris)" />
                <circle cx={122+px} cy={130+py} r="3.4" fill="#140f04" />
                <circle cx={124+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
                <circle cx={120+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
              </>}
              <path d={`M 111,${130-eyeRY-0.5} Q 122,${124-eyeRY} 133,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />
              <path d={`M 111,${130-eyeRY-1} Q 109,${128-eyeRY} 107,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />
              <path d={`M 133,${130-eyeRY-1} Q 135,${128-eyeRY} 137,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />

              {/* Nez */}
              <path d="M 99,128 Q 97,140 96,148 Q 92,156 92,158 Q 95,162 100,163 Q 105,162 108,158 Q 108,156 104,148 Q 103,140 101,128" fill="none" stroke="rgba(175,130,100,0.2)" strokeWidth="0.85" />
              <ellipse cx="93.5" cy="160" rx="2.2" ry="1.3" fill="rgba(175,130,105,0.12)" />
              <ellipse cx="106.5" cy="160" rx="2.2" ry="1.3" fill="rgba(175,130,105,0.12)" />

              {/* Bouche */}
              <path d={mouthPath} fill={mouthState !== 'closed' ? 'url(#n-lip)' : 'none'} stroke={mouthState === 'closed' ? '#b87272' : 'none'} strokeWidth="1.4" />
              {mouthState === 'open' && <path d="M 89,179 Q 100,176 111,179" fill="#f5f0ec" opacity="0.9" />}
              {(expression === 'smiling' || microExpression === 'slight-smile') && <>
                <path d="M 77,173 Q 75,177 77,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
                <path d="M 123,173 Q 125,177 123,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
              </>}

              {/* Aura écoute */}
              {listening && <circle cx="100" cy="124" r="76" fill="none" stroke="rgba(231,76,60,0.18)" strokeWidth="4"><animate attributeName="r" values="72;78;72" dur="1.4s" repeatCount="indefinite" /></circle>}
              {speaking && <circle cx="100" cy="124" r="74" fill="none" stroke="rgba(0,200,80,0.15)" strokeWidth="5"><animate attributeName="r" values="70;76;70" dur="0.55s" repeatCount="indefinite" /></circle>}
            </g>
          </g>
        </svg>
      </div>

      {/* ══ DESK / TABLE MI-CORPS ══ */}
      <div style={{
        position: 'absolute',
        left: lolaAreaX - 20, right: 0,
        bottom: totalBarH,
        height: Math.max(40, height * 0.06),
        background: 'linear-gradient(180deg, #2a1e0e 0%, #1a1208 100%)',
        borderTop: '2px solid rgba(201,168,76,0.25)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }} />

      {/* ══ BARRE PRINCIPALE (style JT) ══ */}
      <div style={{
        position: 'absolute', bottom: tickerH, left: 0, right: 0, height: barH,
        background: 'linear-gradient(90deg, rgba(10,6,4,0.97) 0%, rgba(15,10,6,0.95) 100%)',
        borderTop: '2px solid rgba(201,168,76,0.3)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 12, paddingRight: 12,
        gap: 10,
      }}>
        {/* Badge LIVE */}
        <div style={{
          background: statusColor, borderRadius: 4,
          padding: '2px 8px', flexShrink: 0,
        }}>
          <span style={{ fontSize: Math.max(9, barH * 0.18), fontWeight: 800, color: 'white', letterSpacing: 1, fontFamily: 'monospace' }}>
            {listening ? '⏺ ÉCOUTE' : speaking ? '▶ PARLE' : lolaEmotion === 'thinking' ? '◆ RÉFLÉCHIT' : '● EN LIGNE'}
          </span>
        </div>

        {/* Séparateur */}
        <div style={{ width: 1, height: '60%', background: 'rgba(201,168,76,0.3)', flexShrink: 0 }} />

        {/* Catégorie */}
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: Math.max(9, barH * 0.16), color: 'rgba(201,168,76,0.7)', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' }}>
            {lolaEmotion === 'thinking' ? 'ANALYSE' : lolaEmotion === 'listening' ? 'ÉCOUTE' : lolaEmotion === 'excited' ? 'RÉPONSE' : 'LOLA IA'}
          </span>
        </div>

        {/* Titre principal */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <span style={{
            fontSize: Math.max(11, barH * 0.22), fontWeight: 700,
            color: '#f0e8d8', fontFamily: 'Georgia, serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'block',
          }}>
            {statusText}
          </span>
        </div>

        {/* Logo TCEE */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: Math.max(8, barH * 0.14), color: 'rgba(201,168,76,0.5)', fontFamily: 'Georgia, serif', lineHeight: 1 }}>TC Expertise</div>
          <div style={{ fontSize: Math.max(7, barH * 0.12), color: 'rgba(201,168,76,0.3)', fontFamily: 'monospace', letterSpacing: 1 }}>& Énergie</div>
        </div>
      </div>

      {/* ══ TICKER SCROLLANT ══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: tickerH,
        background: 'rgba(201,168,76,0.15)',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute', whiteSpace: 'nowrap',
          transform: `translateX(${tickerX}px)`,
          fontSize: Math.max(9, tickerH * 0.42),
          color: 'rgba(255,240,200,0.6)',
          fontFamily: 'monospace', letterSpacing: 1,
        }}>
          {tickerMessages.join('   •   ')}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
