'use client'

import React from 'react'

interface LolaHomeProps {
  width: number
  height: number
  screenContent?: string | null
  audioActive?: boolean
  lolaEmotion?: 'neutral' | 'happy' | 'thinking' | 'listening' | 'excited'
  // Props Lola intégrée
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
}

export default function LolaHome({
  width, height, screenContent, audioActive, lolaEmotion = 'neutral',
  mouthState = 'closed', blinking = false, expression = 'neutral',
  breathPhase = 0, headTiltX = 0, eyeShiftX = 0, eyeShiftY = 0,
  microExpression = 'none', speaking = false, listening = false,
}: LolaHomeProps) {
  // L'écran est positionné DERRIÈRE Lola — zone 220-520 en y (milieu du SVG)
  // Lola se tient à ~87% de la hauteur = ~609px sur 700
  // Ses pieds sont à y≈615, sa tête à y≈220 → l'écran est à y=225-500

  return (
    <svg viewBox="0 0 400 700" width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0 }}
      preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="lh-sky" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1a0a2e" />
          <stop offset="50%" stopColor="#0d0620" />
          <stop offset="100%" stopColor="#060310" />
        </radialGradient>
        <radialGradient id="lh-walls" cx="50%" cy="60%" r="75%">
          <stop offset="0%" stopColor="#2a1e0e" />
          <stop offset="50%" stopColor="#1e1508" />
          <stop offset="100%" stopColor="#120d04" />
        </radialGradient>
        <radialGradient id="lh-fire-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="rgba(255,140,40,0.3)" />
          <stop offset="50%" stopColor="rgba(255,100,20,0.1)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="lh-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1206" />
          <stop offset="100%" stopColor="#0e0900" />
        </linearGradient>
        <linearGradient id="lh-vine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a5a20" />
          <stop offset="100%" stopColor="#1a3a10" />
        </linearGradient>
        <linearGradient id="lh-shelf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a2010" />
          <stop offset="100%" stopColor="#261408" />
        </linearGradient>
        <radialGradient id="lh-dome" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(200,230,255,0.04)" />
          <stop offset="100%" stopColor="rgba(100,160,220,0.06)" />
        </radialGradient>

        {/* Écran principal */}
        <linearGradient id="lh-screen-bg" x1="0%" y1="0%" x2="5%" y2="100%">
          <stop offset="0%" stopColor="#050e05" />
          <stop offset="100%" stopColor="#020802" />
        </linearGradient>
        <radialGradient id="lh-screen-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(0,200,80,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        <filter id="lh-glow-warm">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lh-glow-soft">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="lh-bloom">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="lh-screen-glow-filter">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <clipPath id="lh-dome-clip">
          <ellipse cx="200" cy="120" rx="170" ry="135" />
        </clipPath>
        <clipPath id="lh-screen-clip">
          <rect x="62" y="228" width="276" height="270" rx="6" />
        </clipPath>
      </defs>

      {/* ══ DÔME VERRE — forêt nocturne ══ */}
      <ellipse cx="200" cy="115" rx="175" ry="138" fill="url(#lh-sky)" />

      {/* Étoiles */}
      {[
        [75,28],[115,14],[158,7],[202,19],[242,11],[282,23],[318,17],[98,48],[262,43],
        [138,33],[182,58],[228,52],[298,38],[68,68],[338,62],[152,23],[295,28],[73,43]
      ].map(([x,y],i) => (
        <circle key={`st${i}`} cx={x} cy={y} r={0.5 + (i%3)*0.4} fill="white" opacity={0.3 + (i%4)*0.12}>
          <animate attributeName="opacity"
            values={`${0.2+(i%3)*0.2};${0.6+(i%4)*0.2};${0.2+(i%3)*0.2}`}
            dur={`${2.5+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Lune */}
      <circle cx="322" cy="38" r="17" fill="#ffe8b0" opacity="0.9" />
      <circle cx="328" cy="36" r="15" fill="#1a0a2e" opacity="0.88" />
      <circle cx="322" cy="38" r="24" fill="none" stroke="rgba(255,232,176,0.12)" strokeWidth="5" filter="url(#lh-glow-soft)" />

      {/* Lucioles */}
      {[58,118,178,248,318,82,212].map((x,i) => (
        <circle key={`ff${i}`} cx={x} cy={128+(i%3)*18} r="1.5" fill="#aaff88" opacity="0">
          <animate attributeName="opacity" values="0;0.9;0;0;0.5;0"
            dur={`${3+i*0.7}s`} begin={`${i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Forêt silhouette fond */}
      <path d="M 0,185 L 0,142 Q 10,102 20,112 Q 32,82 48,96 Q 58,62 73,78 Q 83,46 98,67 Q 112,42 128,60 Q 138,32 152,52 Q 163,27 178,48 L 202,40 L 228,50 Q 242,30 258,44 Q 270,24 282,42 Q 298,37 308,57 Q 322,47 333,64 Q 348,52 358,70 Q 372,60 382,80 Q 392,72 402,87 L 402,185 Z"
        fill="#0a0518" opacity="0.96" />
      {/* Arbres milieu */}
      <path d="M 0,225 Q 32,162 62,188 Q 82,152 112,172 Q 138,148 162,168 Q 182,142 208,160 Q 228,150 252,164 Q 272,147 298,168 Q 318,154 342,172 Q 368,160 402,178 L 402,225 Z"
        fill="#0d0720" opacity="0.82" />

      {/* Dôme verre */}
      <ellipse cx="200" cy="115" rx="175" ry="138" fill="url(#lh-dome)"
        stroke="rgba(180,220,255,0.1)" strokeWidth="1.5" />
      {/* Reflets dôme */}
      <path d="M 80,42 Q 122,22 162,37" fill="none" stroke="rgba(200,230,255,0.07)" strokeWidth="3" />

      {/* ══ MURS PIERRE ══ */}
      <rect x="0" y="225" width="400" height="475" fill="url(#lh-walls)" />

      {/* Texture pierres */}
      {[
        [12,240,26],[50,254,21],[88,238,24],[130,250,19],[170,244,23],[210,252,21],[250,240,25],[290,254,20],[330,247,24],[372,256,19],
        [4,282,17],[38,296,21],[75,280,19],[112,294,17],[150,284,21],[188,296,19],[226,283,17],[263,294,21],[300,280,19],[338,294,17],[376,283,21],
      ].map(([x,y,r],i) => (
        <circle key={`sw${i}`} cx={x} cy={y} r={r}
          fill="none" stroke="rgba(55,38,12,0.35)" strokeWidth="0.5" />
      ))}

      {/* Lueur chaude cheminée */}
      <ellipse cx="90" cy="560" rx="130" ry="110" fill="url(#lh-fire-glow)" filter="url(#lh-glow-soft)" />

      {/* ══ ÉCRAN PRINCIPAL — derrière Lola, bien visible ══ */}
      {/* Glow derrière l'écran */}
      <rect x="58" y="224" width="284" height="278" rx="8"
        fill="rgba(0,180,60,0.06)" filter="url(#lh-glow-soft)" />

      {/* Cadre écran — arche en pierre sculptée */}
      <path d="M 58,224 Q 58,214 72,210 L 328,210 Q 342,210 342,224 L 342,502 Q 342,512 328,516 L 72,516 Q 58,512 58,502 Z"
        fill="rgba(28,18,6,0.92)" stroke="rgba(0,200,80,0.2)" strokeWidth="1.5" />

      {/* Surface écran */}
      <rect x="62" y="228" width="276" height="270" rx="5" fill="url(#lh-screen-bg)" />

      {/* Contenu écran */}
      <g clipPath="url(#lh-screen-clip)">
        {screenContent ? (
          // Texte réponse Lola — style écriture verte
          <foreignObject x="62" y="228" width="276" height="270">
            <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>}
              style={{
                width: '100%', height: '100%',
                padding: '16px 18px', overflow: 'hidden',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: 12, color: '#00e050',
                lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                textShadow: '0 0 8px rgba(0,220,80,0.6)',
              }}>
              {screenContent}
            </div>
          </foreignObject>
        ) : (
          <>
            {/* Grid fine verte */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={`sg${i}`} x1={62+i*30} y1="228" x2={62+i*30} y2="498"
                stroke="rgba(0,200,60,0.04)" strokeWidth="0.4" />
            ))}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={`sh${i}`} x1="62" y1={228+i*30} x2="338" y2={228+i*30}
                stroke="rgba(0,200,60,0.04)" strokeWidth="0.4" />
            ))}

            {/* Glow centre */}
            <ellipse cx="200" cy="363" rx="100" ry="70" fill="url(#lh-screen-glow)" />

            {/* Idle — pluie de caractères style Matrix */}
            {[0,1,2,3,4,5,6,7,8].map(i => {
              const chars = ['L','O','L','A','0','1','∆','λ','Ω','█','▓','░','╬','►']
              const x = 72 + i * 31
              return (
                <g key={`mc${i}`}>
                  <text x={x} y="240" fontFamily="monospace" fontSize="8" fill="rgba(0,255,80,0.6)"
                    textAnchor="middle">
                    {chars[(i*3)%chars.length]}
                    <animate attributeName="y" values="228;498;228"
                      dur={`${4+i*0.7}s`} begin={`${i*0.4}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.8;0.4;0.8;0"
                      dur={`${4+i*0.7}s`} begin={`${i*0.4}s`} repeatCount="indefinite" />
                  </text>
                  <text x={x} y="260" fontFamily="monospace" fontSize="8"
                    fill={`rgba(0,${180+i*8},${50+i*5},0.4)`} textAnchor="middle">
                    {chars[(i*5+3)%chars.length]}
                    <animate attributeName="y" values="240;510;240"
                      dur={`${5+i*0.5}s`} begin={`${i*0.6+0.3}s`} repeatCount="indefinite" />
                  </text>
                </g>
              )
            })}

            {/* Logo LOLA en watermark */}
            <text x="200" y="358" textAnchor="middle"
              fontFamily="monospace" fontSize="32" fontWeight="700"
              fill="rgba(0,200,60,0.06)">LOLA</text>
            <text x="200" y="374" textAnchor="middle"
              fontFamily="monospace" fontSize="7" letterSpacing="3"
              fill="rgba(0,200,60,0.2)">SYSTÈME ACTIF</text>

            {/* Waveform audio */}
            {audioActive && [0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
              const bh = 6 + Math.sin(i*0.85)*20
              return (
                <rect key={`aw${i}`} x={106+i*10} y={363-bh/2} width="7" height={bh} rx="2"
                  fill="rgba(0,220,80,0.55)">
                  <animate attributeName="height" values={`${bh};${4+Math.random()*32};${bh}`}
                    dur={`${0.22+i*0.04}s`} repeatCount="indefinite" />
                </rect>
              )
            })}

            {/* Data lines bas de l'écran */}
            {[0,1,2,3,4].map(i => (
              <rect key={`dl${i}`} x={78+i*8} y={440+i*10} width={30+i*12} height="1.5" rx="0.8"
                fill="rgba(0,200,60,0.1)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
              </rect>
            ))}
          </>
        )}
      </g>

      {/* LED strip haut écran */}
      <rect x="62" y="228" width="276" height="2" rx="1"
        fill="rgba(0,220,80,0.4)">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
      </rect>

      {/* Coins décoratifs écran */}
      {[[66,232],[334,232],[66,494],[334,494]].map(([x,y],i) => (
        <g key={`ec${i}`}>
          <line x1={x} y1={y} x2={x+(i%2===0?10:-10)} y2={y}
            stroke="rgba(0,200,60,0.35)" strokeWidth="1.2" />
          <line x1={x} y1={y} x2={x} y2={y+(i<2?10:-10)}
            stroke="rgba(0,200,60,0.35)" strokeWidth="1.2" />
          <circle cx={x} cy={y} r="1.2" fill="rgba(0,220,80,0.5)" />
        </g>
      ))}

      {/* Status LEDs sur le cadre écran */}
      <circle cx="66" cy="216" r="2" fill="#2ecc71" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="74" cy="216" r="2" fill={lolaEmotion === 'listening' ? '#e74c3c' : lolaEmotion === 'excited' ? '#f39c12' : '#2ecc71'} opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* ══ ÉTAGÈRE GAUCHE ══ */}
      <rect x="0" y="268" width="46" height="152" rx="0" fill="#1a0e04" stroke="rgba(100,70,30,0.3)" strokeWidth="0.5" />
      {[0,1,2,3].map(i => (
        <rect key={`sh${i}`} x="0" y={268+i*38} width="46" height="3" fill="url(#lh-shelf)" />
      ))}
      {/* Livres */}
      {[
        [3,278,7,23,'#c0402a'],[11,276,5,25,'#2a6040'],[17,275,7,26,'#4040a0'],[25,278,5,23,'#806020'],[31,276,8,24,'#502060'],
        [2,312,6,23,'#205080'],[9,310,8,24,'#60402a'],[18,312,5,22,'#2a5020'],[24,311,7,23,'#804040'],[32,310,9,24,'#205050'],
        [2,348,8,25,'#a06020'],[11,347,6,24,'#402060'],[18,349,5,23,'#206040'],[24,348,9,25,'#603020'],[34,347,7,24,'#204060'],
      ].map(([x,y,w,h,fill],i) => (
        <g key={`bk${i}`}>
          <rect x={x} y={y} width={w} height={h} rx="0.5" fill={fill as string} opacity="0.88" />
          <rect x={x} y={y} width={w} height="2" rx="0.3" fill="rgba(255,255,255,0.09)" />
          {i%4===0 && (
            <rect x={x} y={y} width={w} height={h} rx="0.5" fill="rgba(0,200,80,0.07)">
              <animate attributeName="opacity" values="0;0.4;0" dur={`${3+i*0.5}s`} repeatCount="indefinite" />
            </rect>
          )}
        </g>
      ))}

      {/* Casier docs dans étagère */}
      <rect x="2" y="408" width="42" height="28" rx="2" fill="#0a0806" stroke="rgba(0,200,80,0.25)" strokeWidth="0.8" />
      <text x="23" y="419" textAnchor="middle" fontFamily="monospace" fontSize="4.5" fill="rgba(0,200,80,0.5)">INBOX</text>
      <rect x="5" y="421" width="36" height="3.5" rx="1" fill="rgba(0,200,80,0.08)" stroke="rgba(0,200,80,0.2)" strokeWidth="0.3" />
      <rect x="5" y="427" width="36" height="3.5" rx="1" fill="rgba(100,200,80,0.06)" stroke="rgba(100,200,80,0.2)" strokeWidth="0.3" />
      <circle cx="40" cy="415" r="1.5" fill="rgba(0,220,80,0.7)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* ══ CHEMINÉE DROITE ══ */}
      <path d="M 300,390 Q 298,350 314,340 L 402,340 L 402,700 L 300,700 Z"
        fill="#1a1006" stroke="rgba(80,55,20,0.4)" strokeWidth="0.5" />
      <path d="M 308,540 Q 306,500 318,490 L 382,490 L 382,650 L 308,650 Z" fill="#120a02" />

      {/* Feu */}
      <ellipse cx="345" cy="632" rx="38" ry="18" fill="rgba(255,140,20,0.28)" filter="url(#lh-glow-soft)">
        <animate attributeName="opacity" values="0.5;1;0.6;0.8;0.5" dur="1.1s" repeatCount="indefinite" />
      </ellipse>
      <path d="M 327,638 Q 322,610 331,590 Q 336,576 342,571 Q 343,581 340,594 Q 349,576 356,556 Q 359,571 354,589 Q 363,572 369,551 Q 373,568 366,589 Q 374,575 377,560 Q 378,577 372,597 Q 362,616 345,632 Z"
        fill="rgba(255,160,20,0.82)">
        <animate attributeName="d"
          values="M327,638 Q322,610 331,590 Q336,576 342,571 Q343,581 340,594 Q349,576 356,556 Q359,571 354,589 Q363,572 369,551 Q373,568 366,589 Q374,575 377,560 Q378,577 372,597 Q362,616 345,632 Z;M325,640 Q320,608 333,587 Q338,572 344,568 Q345,579 341,592 Q351,572 359,552 Q361,569 356,587 Q365,568 372,548 Q375,566 368,587 Q376,572 380,555 Q380,574 374,595 Q364,612 346,630 Z;M327,638 Q322,610 331,590 Q336,576 342,571 Q343,581 340,594 Q349,576 356,556 Q359,571 354,589 Q363,572 369,551 Q373,568 366,589 Q374,575 377,560 Q378,577 372,597 Q362,616 345,632 Z"
          dur="0.38s" repeatCount="indefinite" />
      </path>
      <path d="M 337,632 Q 334,614 341,600 Q 345,591 348,587 Q 349,597 347,606 Q 353,594 358,578 Q 361,591 357,606 Q 363,594 367,580 Q 368,594 363,608 Q 355,622 343,631 Z"
        fill="rgba(255,220,80,0.72)">
        <animate attributeName="d"
          values="M337,632 Q334,614 341,600 Q345,591 348,587 Q349,597 347,606 Q353,594 358,578 Q361,591 357,606 Q363,594 367,580 Q368,594 363,608 Q355,622 343,631 Z;M335,633 Q332,613 342,598 Q346,589 350,584 Q350,595 348,604 Q354,591 360,574 Q362,589 359,604 Q365,591 370,575 Q370,592 365,606 Q357,620 345,632 Z;M337,632 Q334,614 341,600 Q345,591 348,587 Q349,597 347,606 Q353,594 358,578 Q361,591 357,606 Q363,594 367,580 Q368,594 363,608 Q355,622 343,631 Z"
          dur="0.33s" repeatCount="indefinite" />
      </path>

      {/* Terminal holographique sur cheminée */}
      <rect x="310" y="492" width="70" height="48" rx="3"
        fill="rgba(0,200,80,0.04)" stroke="rgba(0,200,80,0.15)" strokeWidth="0.5" />
      <text x="345" y="506" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="rgba(0,200,80,0.5)">TEMP: 19.2°</text>
      <text x="345" y="516" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="rgba(0,200,80,0.4)">SYS: OK</text>
      {[0,1,2].map(i => (
        <rect key={`tp${i}`} x="318" y={522+i*7} width={18+i*10} height="2.5" rx="1"
          fill="rgba(0,200,80,0.15)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur={`${1.5+i*0.3}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* ══ LIANES ══ */}
      <path d="M 0,225 Q 20,235 15,255 Q 10,270 26,276 Q 42,282 37,302 Q 32,318 48,322"
        fill="none" stroke="url(#lh-vine)" strokeWidth="2.5" strokeLinecap="round" />
      {[[15,255],[26,276],[37,302]].map(([x,y],i) => (
        <ellipse key={`lv${i}`} cx={x+6} cy={y-3} rx="6" ry="3.5"
          fill="#2a6020" opacity="0.82" transform={`rotate(${-20+i*15},${x+6},${y-3})`} />
      ))}
      <path d="M 402,225 Q 382,238 387,258 Q 392,273 378,281 Q 363,288 368,308"
        fill="none" stroke="url(#lh-vine)" strokeWidth="2" strokeLinecap="round" />
      {[[382,258],[374,281],[368,308]].map(([x,y],i) => (
        <ellipse key={`rv${i}`} cx={x-6} cy={y-3} rx="5.5" ry="3"
          fill="#2a6020" opacity="0.72" transform={`rotate(${20-i*12},${x-6},${y-3})`} />
      ))}

      {/* ══ SOL PARQUET ══ */}
      <rect x="0" y="628" width="400" height="72" fill="url(#lh-floor)" />
      <line x1="0" y1="628" x2="400" y2="628" stroke="rgba(120,80,30,0.3)" strokeWidth="1" />
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`fp${i}`} x1={i*57} y1="628" x2={i*57} y2="700" stroke="rgba(80,50,15,0.18)" strokeWidth="0.5" />
      ))}
      {[0,1].map(i => (
        <line key={`fh${i}`} x1="0" y1={645+i*22} x2="400" y2={645+i*22} stroke="rgba(80,50,15,0.1)" strokeWidth="0.3" />
      ))}
      {/* Reflet cheminée au sol */}
      <ellipse cx="345" cy="642" rx="50" ry="10" fill="rgba(255,140,20,0.07)" filter="url(#lh-bloom)" />
      {/* Reflet écran au sol */}
      <ellipse cx="200" cy="638" rx="80" ry="8" fill="rgba(0,180,60,0.05)" filter="url(#lh-bloom)" />
      {/* LED sol */}
      <line x1="0" y1="629" x2="400" y2="629" stroke="rgba(0,180,60,0.08)" strokeWidth="1.2">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="5s" repeatCount="indefinite" />
      </line>

      {/* ══════════════════════════════════
          LOLA — intégrée dans la scène
          Debout sur le sol, devant l'écran
          ══════════════════════════════════ */}
      {(() => {
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

        // Lola centrée horizontalement, pieds sur le sol (y≈628)
        // viewBox 400x700, Lola SVG interne 200x480 → scale 0.72 → 144x346
        // Centrée x: (400-144)/2 = 128, Pieds à y=628, tête à y=628-346=282
        return (
          <g transform={`translate(128, ${628 - 346 + breathY})`}>
            <g transform={`scale(0.72)`}>
              <defs>
                <radialGradient id="li-skin" cx="44%" cy="32%" r="60%">
                  <stop offset="0%" stopColor="#fde8ce" /><stop offset="40%" stopColor="#f0cfa8" /><stop offset="100%" stopColor="#d8a070" />
                </radialGradient>
                <linearGradient id="li-hair" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#5c3f2a" /><stop offset="50%" stopColor="#4a3020" /><stop offset="100%" stopColor="#2e1c0e" />
                </linearGradient>
                <linearGradient id="li-sweater" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e8dcc8" /><stop offset="100%" stopColor="#c4b49a" />
                </linearGradient>
                <linearGradient id="li-pants" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2a3050" /><stop offset="100%" stopColor="#141830" />
                </linearGradient>
                <linearGradient id="li-slipper" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4a84c" /><stop offset="100%" stopColor="#9a7028" />
                </linearGradient>
                <radialGradient id="li-iris" cx="40%" cy="36%" r="62%">
                  <stop offset="0%" stopColor="#ecc870" /><stop offset="50%" stopColor="#b88030" /><stop offset="100%" stopColor="#6a4510" />
                </radialGradient>
                <linearGradient id="li-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d48080" /><stop offset="100%" stopColor="#a85050" />
                </linearGradient>
                <radialGradient id="li-blush" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(220,130,130,0.22)" /><stop offset="100%" stopColor="rgba(220,130,130,0)" />
                </radialGradient>
                <filter id="li-shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0a0500" floodOpacity="0.35" /></filter>
              </defs>

              {/* Ombre au sol */}
              <ellipse cx="100" cy="476" rx="46" ry="7" fill="rgba(0,0,0,0.4)" filter="url(#li-shadow)" />

              {/* Jambes */}
              <path d="M 76,308 Q 72,358 70,398 Q 68,428 72,448 Q 74,456 82,458 L 94,458 Q 100,456 100,448 Q 99,428 98,398 Q 97,358 95,308 Z" fill="url(#li-pants)" />
              <path d="M 105,308 Q 104,358 103,398 Q 102,428 101,448 Q 100,456 106,458 L 118,458 Q 126,456 128,448 Q 128,428 126,398 Q 124,358 122,308 Z" fill="url(#li-pants)" />

              {/* Chaussons */}
              <path d="M 68,450 Q 60,454 56,464 Q 54,472 62,475 L 98,475 Q 104,472 102,464 Q 100,456 95,452 Z" fill="url(#li-slipper)" />
              <circle cx="66" cy="458" r="5" fill="#e8c870" />
              <circle cx="66" cy="458" r="3" fill="#f0d888" />
              <path d="M 100,454 Q 98,460 96,466 Q 94,474 102,476 L 132,476 Q 140,472 138,464 Q 136,456 130,452 Z" fill="url(#li-slipper)" />
              <circle cx="130" cy="458" r="5" fill="#e8c870" />
              <circle cx="130" cy="458" r="3" fill="#f0d888" />

              {/* Corps — pull oversize */}
              <path d="M 52,213 Q 44,238 42,268 Q 40,298 42,313 L 158,313 Q 160,298 158,268 Q 156,238 148,213 Q 138,203 100,201 Q 62,203 52,213 Z" fill="url(#li-sweater)" filter="url(#li-shadow)" />
              {[0,1,2,3,4,5,6,7].map(i => <path key={`k${i}`} d={`M ${50+i*14},218 Q ${57+i*14},223 ${50+i*14},228`} fill="none" stroke="rgba(160,140,100,0.07)" strokeWidth="0.6" />)}
              <path d="M 82,206 Q 82,198 88,196 L 112,196 Q 118,198 118,206 L 118,216 Q 118,222 112,224 L 88,224 Q 82,222 82,216 Z" fill="#d4c8b0" />

              {/* Bras gauche */}
              <path d="M 52,216 Q 36,226 28,246 Q 22,263 26,278 Q 30,290 40,294 L 48,284 Q 40,278 38,266 Q 36,253 44,236 Q 52,223 62,218 Z" fill="url(#li-sweater)" />
              <path d="M 26,278 Q 22,293 24,306 Q 26,318 36,320 L 44,310 Q 36,308 35,298 Q 34,288 40,284 Z" fill="url(#li-sweater)" />
              <path d="M 22,306 Q 18,314 20,324 Q 23,334 34,334 Q 44,334 46,326 Q 48,316 42,310 Z" fill="url(#li-skin)" />

              {/* Bras droit */}
              <path d="M 148,216 Q 163,226 170,243 Q 176,258 173,273 Q 169,286 160,292 L 152,282 Q 160,276 162,263 Q 163,250 157,238 Q 150,226 138,220 Z" fill="url(#li-sweater)" />
              <path d="M 173,273 Q 178,286 177,298 Q 175,310 166,316 L 158,306 Q 165,304 166,294 Q 167,284 162,278 Z" fill="url(#li-sweater)" />
              <path d="M 176,298 Q 182,305 181,316 Q 179,326 170,328 Q 160,330 158,320 Q 156,310 162,304 Z" fill="url(#li-skin)" />

              {/* Pendentif */}
              <path d="M 94,224 Q 96,231 100,236 Q 104,231 106,224" fill="none" stroke="rgba(160,210,255,0.5)" strokeWidth="0.8" />
              <path d="M 100,236 L 96,242 L 100,248 L 104,242 Z" fill="rgba(140,210,255,0.9)" />
              <circle cx="99" cy="240" r="1" fill="white" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Cou */}
              <path d="M 87,200 L 87,213 Q 87,218 93,220 L 107,220 Q 113,218 113,213 L 113,200" fill="url(#li-skin)" />

              {/* ── TÊTE ── */}
              <g transform={`rotate(${tilt}, 100, 155)`}>
                {/* Cheveux fond */}
                <ellipse cx="100" cy="113" rx="63" ry="72" fill="url(#li-hair)" />

                {/* Visage */}
                <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="url(#li-skin)" />
                {/* Lumière cheminée */}
                <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(255,160,60,0.04)" />
                {/* Lumière écran */}
                <path d="M 52,124 Q 51,80 72,61 Q 86,48 100,48 Q 114,48 128,61 Q 149,80 148,124 Q 148,166 128,184 Q 115,195 100,197 Q 85,195 72,184 Q 52,166 52,124 Z" fill="rgba(0,200,80,0.04)" />

                {/* Cheveux front */}
                <path d="M 53,110 Q 49,72 69,54 Q 83,41 100,39 Q 117,41 131,54 Q 151,72 147,110 Q 145,88 135,74 Q 125,62 114,62 Q 106,62 100,68 Q 90,60 79,63 Q 65,68 56,86 Z" fill="url(#li-hair)" />
                <path d="M 149,150 Q 157,170 158,200 Q 160,225 156,248 Q 152,265 148,272 Q 153,255 152,232 Q 151,206 146,185 Q 141,165 144,150 Z" fill="url(#li-hair)" />

                {/* Sourcils */}
                <g transform={`translate(0,${browY})`}>
                  <path d="M 64,111 Q 71,105 79,106 Q 85,107 91,110" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 109,110 Q 115,107 121,106 Q 129,105 136,111" fill="none" stroke="#4e3420" strokeWidth="2.2" strokeLinecap="round" />
                </g>

                {/* Joues */}
                <ellipse cx="68" cy="156" rx="14" ry="9" fill="url(#li-blush)" />
                <ellipse cx="132" cy="156" rx="14" ry="9" fill="url(#li-blush)" />

                {/* Oeil gauche */}
                <ellipse cx="78" cy="130" rx="11.5" ry={eyeRY + 1} fill="#f8f4f0" />
                {blinking
                  ? <path d="M 67,130 Q 78,132 89,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" />
                  : <>
                    <ellipse cx={78+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#li-iris)" />
                    <circle cx={78+px} cy={130+py} r="3.4" fill="#140f04" />
                    <circle cx={80+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
                    <circle cx={76+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
                  </>
                }
                <path d={`M 67,${130-eyeRY-0.5} Q 78,${124-eyeRY} 89,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />
                <path d={`M 67,${130-eyeRY-1} Q 65,${128-eyeRY} 63,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />
                <path d={`M 89,${130-eyeRY-1} Q 91,${128-eyeRY} 92,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />

                {/* Oeil droit */}
                <ellipse cx="122" cy="130" rx="11.5" ry={eyeRY + 1} fill="#f8f4f0" />
                {blinking
                  ? <path d="M 111,130 Q 122,132 133,130" fill="none" stroke="#4e3420" strokeWidth="1.6" strokeLinecap="round" />
                  : <>
                    <ellipse cx={122+px} cy={130+py} rx="6.5" ry="6.5" fill="url(#li-iris)" />
                    <circle cx={122+px} cy={130+py} r="3.4" fill="#140f04" />
                    <circle cx={124+px} cy={127+py} r="2.1" fill="white" opacity="0.92" />
                    <circle cx={120+px} cy={132+py} r="0.8" fill="white" opacity="0.4" />
                  </>
                }
                <path d={`M 111,${130-eyeRY-0.5} Q 122,${124-eyeRY} 133,${130-eyeRY-0.5}`} fill="none" stroke="#4e3420" strokeWidth="1.4" strokeLinecap="round" />
                <path d={`M 111,${130-eyeRY-1} Q 109,${128-eyeRY} 107,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />
                <path d={`M 133,${130-eyeRY-1} Q 135,${128-eyeRY} 137,${126-eyeRY}`} fill="none" stroke="#3a2515" strokeWidth="0.7" strokeLinecap="round" />

                {/* Nez */}
                <path d="M 99,128 Q 97,140 96,148 Q 92,156 92,158 Q 95,162 100,163 Q 105,162 108,158 Q 108,156 104,148 Q 103,140 101,128" fill="none" stroke="rgba(175,130,100,0.2)" strokeWidth="0.85" />
                <ellipse cx="93.5" cy="160" rx="2.2" ry="1.3" fill="rgba(175,130,105,0.12)" />
                <ellipse cx="106.5" cy="160" rx="2.2" ry="1.3" fill="rgba(175,130,105,0.12)" />

                {/* Bouche */}
                <path d={mouthPath} fill={mouthState !== 'closed' ? 'url(#li-lip)' : 'none'} stroke={mouthState === 'closed' ? '#b87272' : 'none'} strokeWidth="1.4" />
                {mouthState === 'open' && <path d="M 89,179 Q 100,176 111,179" fill="#f5f0ec" opacity="0.9" />}
                {(expression === 'smiling' || microExpression === 'slight-smile') && (
                  <>
                    <path d="M 77,173 Q 75,177 77,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
                    <path d="M 123,173 Q 125,177 123,181" fill="none" stroke="rgba(180,135,115,0.18)" strokeWidth="0.65" />
                  </>
                )}

                {/* Aura écoute */}
                {listening && <circle cx="100" cy="124" r="76" fill="none" stroke="rgba(200,100,100,0.18)" strokeWidth="4"><animate attributeName="r" values="72;78;72" dur="1.4s" repeatCount="indefinite" /></circle>}
                {/* Aura parole */}
                {speaking && <circle cx="100" cy="124" r="74" fill="none" stroke="rgba(0,200,80,0.12)" strokeWidth="5"><animate attributeName="r" values="70;76;70" dur="0.55s" repeatCount="indefinite" /></circle>}
              </g>
            </g>
          </g>
        )
      })()}

      {/* ══ BUREAU ══ */}
      <path d="M 0,600 L 400,600 L 400,618 L 0,618 Z" fill="#141c24" />
      <line x1="0" y1="600" x2="400" y2="600" stroke="rgba(0,180,60,0.12)" strokeWidth="1" />

      {/* Objets bureau */}
      <rect x="145" y="603" width="110" height="10" rx="3" fill="#0d1218" stroke="rgba(0,180,60,0.06)" strokeWidth="0.4" />
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={`kb${i}`} x={149+i*9.5} y="605" width="7" height="4" rx="0.8"
          fill="rgba(0,180,60,0.02)" stroke="rgba(0,180,60,0.04)" strokeWidth="0.2" />
      ))}
      <ellipse cx="284" cy="608" rx="8" ry="5" fill="#0d1218" stroke="rgba(0,180,60,0.06)" strokeWidth="0.4" />
      {/* Mug */}
      <rect x="88" y="597" width="13" height="9" rx="2.5" fill="#1a2040" stroke="rgba(0,180,60,0.1)" strokeWidth="0.4" />
      <path d="M 101,600 Q 105,600 105,604 Q 105,607 101,607" fill="none" stroke="rgba(0,180,60,0.08)" strokeWidth="0.5" />
      <path d="M 92,596 Q 93,592 92,589" fill="none" stroke="rgba(200,200,200,0.06)" strokeWidth="0.5">
        <animate attributeName="d" values="M92,596 Q93,592 92,589;M92,596 Q91,592 93,589;M92,596 Q93,592 92,589"
          dur="3s" repeatCount="indefinite" />
      </path>
      {/* Plante */}
      <rect x="315" y="594" width="11" height="8" rx="2" fill="#1a2040" />
      <path d="M 320,594 Q 317,590 319,586 Q 322,590 320,594" fill="rgba(46,180,80,0.22)" />
      <path d="M 320,593 Q 315,588 317,584" fill="none" stroke="rgba(46,180,80,0.14)" strokeWidth="0.5" />

      {/* ══ PARTICULES MAGIQUES ══ */}
      {[
        [78,350,'rgba(255,220,100,0.7)'],[148,420,'rgba(0,200,80,0.6)'],[218,382,'rgba(180,140,255,0.6)'],
        [288,450,'rgba(255,220,100,0.5)'],[58,490,'rgba(0,200,80,0.5)'],[338,400,'rgba(180,140,255,0.4)'],
        [178,462,'rgba(255,220,100,0.6)'],[118,522,'rgba(0,200,80,0.5)'],
      ].map(([x,y,fill],i) => (
        <circle key={`dp${i}`} cx={x as number} cy={y as number} r={0.9+(i%3)*0.6}
          fill={fill as string} opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur={`${4.5+i*0.6}s`} begin={`${i*0.7}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${y};${(y as number)-28};${y}`}
            dur={`${5+i*0.5}s`} begin={`${i*0.7}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  )
}
