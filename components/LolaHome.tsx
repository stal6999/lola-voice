'use client'

import React from 'react'

interface LolaHomeProps {
  width: number
  height: number
  screenContent?: string | null
  audioActive?: boolean
  lolaEmotion?: 'neutral' | 'happy' | 'thinking' | 'listening' | 'excited'
}

export default function LolaHome({ width, height, screenContent, audioActive, lolaEmotion = 'neutral' }: LolaHomeProps) {

  // Crystal pulse color based on emotion
  const crystalColor = {
    neutral:   'rgba(140,200,255,0.6)',
    happy:     'rgba(255,220,100,0.7)',
    thinking:  'rgba(180,140,255,0.6)',
    listening: 'rgba(255,120,120,0.6)',
    excited:   'rgba(120,255,180,0.7)',
  }[lolaEmotion]

  const crystalDur = lolaEmotion === 'listening' ? '0.6s' : lolaEmotion === 'excited' ? '0.8s' : '2.5s'

  return (
    <svg viewBox="0 0 400 700" width={width} height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0 }}
      preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Sky / background forest night */}
        <radialGradient id="lh-sky" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1a0a2e" />
          <stop offset="50%" stopColor="#0d0620" />
          <stop offset="100%" stopColor="#060310" />
        </radialGradient>

        {/* Room walls — warm stone */}
        <radialGradient id="lh-walls" cx="50%" cy="60%" r="75%">
          <stop offset="0%" stopColor="#2a1e0e" />
          <stop offset="50%" stopColor="#1e1508" />
          <stop offset="100%" stopColor="#120d04" />
        </radialGradient>

        {/* Fireplace glow */}
        <radialGradient id="lh-fire-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="rgba(255,140,40,0.35)" />
          <stop offset="50%" stopColor="rgba(255,100,20,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Floor warm wood */}
        <linearGradient id="lh-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1206" />
          <stop offset="100%" stopColor="#0e0900" />
        </linearGradient>

        {/* Holographic screen */}
        <linearGradient id="lh-holo" x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%" stopColor="rgba(100,220,255,0.08)" />
          <stop offset="100%" stopColor="rgba(80,180,255,0.03)" />
        </linearGradient>

        {/* Crystal gradients */}
        <linearGradient id="lh-crystal-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a0e0ff" />
          <stop offset="50%" stopColor="#60c0f0" />
          <stop offset="100%" stopColor="#3090d0" />
        </linearGradient>
        <linearGradient id="lh-crystal-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d0a0ff" />
          <stop offset="50%" stopColor="#b070f0" />
          <stop offset="100%" stopColor="#8040d0" />
        </linearGradient>
        <linearGradient id="lh-crystal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe080" />
          <stop offset="50%" stopColor="#ffc040" />
          <stop offset="100%" stopColor="#e09020" />
        </linearGradient>

        {/* Vine / plant */}
        <linearGradient id="lh-vine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a5a20" />
          <stop offset="100%" stopColor="#1a3a10" />
        </linearGradient>

        {/* Bookshelf wood */}
        <linearGradient id="lh-shelf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a2010" />
          <stop offset="100%" stopColor="#261408" />
        </linearGradient>

        {/* Dome glass */}
        <radialGradient id="lh-dome" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(200,230,255,0.04)" />
          <stop offset="70%" stopColor="rgba(150,200,255,0.02)" />
          <stop offset="100%" stopColor="rgba(100,160,220,0.06)" />
        </radialGradient>

        {/* Filters */}
        <filter id="lh-glow-warm">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lh-glow-crystal">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lh-glow-soft">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="lh-bloom">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* Clip paths */}
        <clipPath id="lh-dome-clip">
          <ellipse cx="200" cy="120" rx="160" ry="130" />
        </clipPath>
        <clipPath id="lh-holo-clip">
          <rect x="45" y="55" width="220" height="155" rx="8" />
        </clipPath>
      </defs>

      {/* ══════════════════════════════════
          DÔME DE VERRE — vue forêt nocturne
          ══════════════════════════════════ */}
      {/* Night sky behind dome */}
      <ellipse cx="200" cy="110" rx="165" ry="135" fill="url(#lh-sky)" />

      {/* Stars */}
      {[
        [80,30],[120,15],[160,8],[200,20],[240,12],[280,25],[320,18],[100,50],[260,45],
        [140,35],[180,60],[230,55],[300,40],[70,70],[340,65],[155,25],[295,30],[75,45]
      ].map(([x,y],i) => (
        <circle key={`st${i}`} cx={x} cy={y} r={0.5 + Math.random() * 1} fill="white" opacity={0.3 + Math.random() * 0.5}>
          <animate attributeName="opacity" values={`${0.3 + Math.random() * 0.3};${0.7 + Math.random() * 0.3};${0.3 + Math.random() * 0.3}`}
            dur={`${2 + Math.random() * 3}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Moon */}
      <circle cx="320" cy="40" r="18" fill="#ffe8b0" opacity="0.9" />
      <circle cx="326" cy="38" r="16" fill="#1a0a2e" opacity="0.85" />
      {/* Moon glow */}
      <circle cx="320" cy="40" r="26" fill="none" stroke="rgba(255,232,176,0.15)" strokeWidth="6" filter="url(#lh-glow-soft)" />

      {/* Forest silhouette */}
      <path d="M 0,180 L 0,140 Q 10,100 20,110 Q 30,80 45,95 Q 55,60 70,75 Q 80,45 95,65 Q 110,40 125,58 Q 135,30 150,50 Q 160,25 175,45 L 200,38 L 225,48 Q 240,28 255,42 Q 268,22 280,40 Q 295,35 305,55 Q 320,45 330,62 Q 345,50 355,68 Q 370,58 380,78 Q 390,70 400,85 L 400,180 Z"
        fill="#0a0518" opacity="0.95" />

      {/* Mid trees */}
      <path d="M 0,220 Q 30,160 60,185 Q 80,150 110,170 Q 135,145 160,165 Q 180,140 205,158 Q 225,148 250,162 Q 270,145 295,165 Q 315,152 340,170 Q 365,158 400,175 L 400,220 Z"
        fill="#0d0720" opacity="0.8" />

      {/* Fireflies */}
      {[60,120,180,250,320,80,210].map((x, i) => (
        <circle key={`ff${i}`} cx={x} cy={130 + (i % 3) * 20} r="1.5" fill="#aaff88" opacity="0">
          <animate attributeName="opacity" values="0;0.8;0;0;0.5;0" dur={`${3 + i * 0.7}s`}
            begin={`${i * 0.5}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate"
            values={`0,0; ${-5 + i * 2},${-3}; ${3},${5}; 0,0`}
            dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Dome glass */}
      <ellipse cx="200" cy="110" rx="165" ry="135" fill="url(#lh-dome)"
        stroke="rgba(180,220,255,0.12)" strokeWidth="1.5" />
      {/* Dome reflections */}
      <path d="M 80,40 Q 120,20 160,35" fill="none" stroke="rgba(200,230,255,0.08)" strokeWidth="3" />
      <path d="M 90,70 Q 140,50 190,65" fill="none" stroke="rgba(200,230,255,0.05)" strokeWidth="2" />

      {/* ══════════════════════════════════
          ROOM — murs pierres rondes
          ══════════════════════════════════ */}

      {/* Background room wall */}
      <rect x="0" y="220" width="400" height="480" fill="url(#lh-walls)" />

      {/* Stone wall texture — circles/blobs */}
      {[
        [15,240,28],[55,255,22],[92,235,25],[135,248,20],[178,242,24],[218,250,22],[258,238,26],[298,252,21],[338,245,25],[375,255,20],
        [5,285,18],[40,298,22],[78,282,20],[115,295,18],[152,285,22],[190,298,20],[228,285,18],[265,295,22],[302,282,20],[340,295,18],[378,285,22],
      ].map(([x,y,r],i) => (
        <circle key={`sw${i}`} cx={x} cy={y} r={r}
          fill="none" stroke="rgba(60,40,15,0.4)" strokeWidth="0.5" />
      ))}

      {/* Warm ambient glow from fireplace */}
      <ellipse cx="92" cy="560" rx="120" ry="100" fill="url(#lh-fire-glow)" filter="url(#lh-glow-soft)" />

      {/* ══════════════════════════════════
          HOLOGRAPHIC SCREEN (main display)
          ══════════════════════════════════ */}
      {/* Frame — carved stone arch */}
      <path d="M 42,52 Q 42,32 68,25 L 265,25 Q 278,25 280,42 L 280,215 Q 280,225 268,228 L 52,228 Q 42,225 42,215 Z"
        fill="rgba(30,20,8,0.9)" stroke="rgba(140,200,255,0.2)" strokeWidth="1.5" />

      {/* Holo glow behind */}
      <rect x="44" y="27" width="233" height="198" rx="6" fill="rgba(100,220,255,0.06)" filter="url(#lh-bloom)" />

      {/* Screen surface */}
      <rect x="46" y="28" width="231" height="196" rx="6" fill="url(#lh-holo)" />

      {/* Screen content */}
      <g clipPath="url(#lh-holo-clip)">
        {screenContent ? (
          <foreignObject x="46" y="28" width="231" height="196">
            <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>}
              style={{ width: '100%', height: '100%', padding: '14px 16px', overflow: 'hidden',
                fontFamily: 'Georgia, serif', fontSize: 12, color: '#d0f0ff',
                lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: 'transparent',
              }}>
              {screenContent}
            </div>
          </foreignObject>
        ) : (
          <>
            {/* Idle holographic display */}
            {/* Grid fine */}
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <line key={`hg${i}`} x1={46 + i * 29} y1="28" x2={46 + i * 29} y2="224"
                stroke="rgba(100,200,255,0.04)" strokeWidth="0.4" />
            ))}
            {[0,1,2,3,4,5,6].map(i => (
              <line key={`hh${i}`} x1="46" y1={28 + i * 28} x2="277" y2={28 + i * 28}
                stroke="rgba(100,200,255,0.04)" strokeWidth="0.4" />
            ))}

            {/* Center glow */}
            <ellipse cx="162" cy="126" rx="90" ry="60" fill="rgba(100,200,255,0.05)" />

            {/* Lola monogram */}
            <text x="162" y="110" textAnchor="middle"
              fontFamily="Georgia, serif" fontSize="38" fontWeight="700"
              fill="rgba(140,210,255,0.07)" letterSpacing="4">LOLA</text>
            <text x="162" y="130" textAnchor="middle"
              fontFamily="monospace" fontSize="7" letterSpacing="3"
              fill="rgba(140,210,255,0.18)">SYSTÈME EN LIGNE</text>

            {/* Data visualization idle */}
            {audioActive ? (
              // Waveform
              [0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                const bh = 6 + Math.sin(i * 0.9) * 20
                return (
                  <rect key={`aw${i}`} x={80 + i * 13} y={126 - bh/2} width="8" height={bh} rx="3"
                    fill="rgba(140,210,255,0.5)">
                    <animate attributeName="height" values={`${bh};${4+Math.random()*30};${bh}`}
                      dur={`${0.22+i*0.04}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${126-bh/2};${126-(4+Math.random()*30)/2};${126-bh/2}`}
                      dur={`${0.22+i*0.04}s`} repeatCount="indefinite" />
                  </rect>
                )
              })
            ) : (
              // Idle data lines
              [0,1,2,3,4,5].map(i => (
                <rect key={`il${i}`} x={65+Math.sin(i*1.4)*12} y={150+i*8} width={40+Math.cos(i)*25} height="1.5" rx="0.8"
                  fill="rgba(100,200,255,0.08)">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2.5+i*0.4}s`} repeatCount="indefinite" />
                </rect>
              ))
            )}

            {/* Corner decorations — elvish/tech */}
            {[[50,32],[270,32],[50,220],[270,220]].map(([x,y],i) => (
              <g key={`cd${i}`}>
                <line x1={x} y1={y} x2={x+(i%2===0?10:-10)} y2={y} stroke="rgba(140,210,255,0.3)" strokeWidth="1" />
                <line x1={x} y1={y} x2={x} y2={y+(i<2?10:-10)} stroke="rgba(140,210,255,0.3)" strokeWidth="1" />
                <circle cx={x} cy={y} r="1.5" fill="rgba(140,210,255,0.5)" />
              </g>
            ))}
          </>
        )}
      </g>

      {/* Screen frame decoration — runes/elvish tech */}
      <path d="M 46,32 Q 50,25 68,25" fill="none" stroke="rgba(140,210,255,0.2)" strokeWidth="0.8" />
      <path d="M 277,32 Q 273,25 265,25" fill="none" stroke="rgba(140,210,255,0.2)" strokeWidth="0.8" />

      {/* ══════════════════════════════════
          CRYSTALS — réagissent aux émotions
          ══════════════════════════════════ */}

      {/* Crystal cluster right — grand */}
      <g transform="translate(300, 240)">
        <path d="M 12,60 L 0,20 L 8,0 L 18,22 Z" fill="url(#lh-crystal-blue)" opacity="0.85" />
        <path d="M 8,0 L 18,22 L 12,60" fill="rgba(60,120,180,0.4)" />
        <path d="M 22,55 L 14,18 L 20,0 L 28,20 Z" fill="url(#lh-crystal-blue)" opacity="0.75" />
        <path d="M 5,65 L 10,35 L 3,20 L 0,40 Z" fill="url(#lh-crystal-purple)" opacity="0.7" />
        {/* Glow */}
        <ellipse cx="14" cy="45" rx="20" ry="20" fill={crystalColor} filter="url(#lh-glow-soft)" opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur={crystalDur} repeatCount="indefinite" />
        </ellipse>
        {/* Inner light */}
        <path d="M 10,15 L 14,5 L 18,15" fill="rgba(200,240,255,0.6)" />
      </g>

      {/* Crystal cluster left — small */}
      <g transform="translate(18, 380)">
        <path d="M 8,45 L 2,15 L 6,0 L 12,16 Z" fill="url(#lh-crystal-purple)" opacity="0.8" />
        <path d="M 12,48 L 8,20 L 13,5 L 18,22 Z" fill="url(#lh-crystal-blue)" opacity="0.7" />
        <ellipse cx="10" cy="35" rx="15" ry="15" fill={crystalColor} filter="url(#lh-glow-soft)" opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur={crystalDur} begin="0.5s" repeatCount="indefinite" />
        </ellipse>
        <path d="M 5,12 L 8,2 L 11,12" fill="rgba(200,180,255,0.5)" />
      </g>

      {/* Crystal accent near screen */}
      <g transform="translate(285, 180)">
        <path d="M 5,30 L 1,8 L 5,0 L 9,8 Z" fill="url(#lh-crystal-gold)" opacity="0.9" />
        <ellipse cx="5" cy="20" rx="10" ry="10" fill="rgba(255,200,80,0.5)" filter="url(#lh-glow-soft)" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* ══════════════════════════════════
          BOOKSHELF — gauche
          ══════════════════════════════════ */}
      <rect x="0" y="260" width="44" height="140" rx="0" fill="#1a0e04" stroke="rgba(100,70,30,0.3)" strokeWidth="0.5" />
      {/* Shelves */}
      {[0,1,2,3].map(i => (
        <rect key={`sh${i}`} x="0" y={260 + i * 35} width="44" height="3" fill="url(#lh-shelf)" />
      ))}
      {/* Books on shelves */}
      {[
        [3,275,8,22,'#c0402a'],[12,273,6,24,'#2a6040'],[19,272,7,25,'#4040a0'],[27,275,5,22,'#806020'],
        [33,274,8,23,'#502060'],[2,308,6,22,'#205080'],[9,307,8,23,'#60402a'],[18,309,5,21,'#2a5020'],
        [24,308,7,22,'#804040'],[32,307,9,23,'#205050'],
        [2,342,8,24,'#a06020'],[11,341,6,23,'#402060'],[18,343,5,22,'#206040'],[24,342,9,24,'#603020'],
        [34,341,7,23,'#204060'],
      ].map(([x,y,w,h,fill],i) => (
        <g key={`bk${i}`}>
          <rect x={x} y={y} width={w} height={h} rx="0.5" fill={fill as string} opacity="0.85" />
          <rect x={x} y={y} width={w} height="2" rx="0.3" fill="rgba(255,255,255,0.08)" />
          {/* Glowing books */}
          {i % 3 === 0 && <rect x={x} y={y} width={w} height={h} rx="0.5"
            fill="rgba(140,200,255,0.06)" >
            <animate attributeName="opacity" values="0;0.3;0" dur={`${3+i*0.4}s`} repeatCount="indefinite" />
          </rect>}
        </g>
      ))}

      {/* ══════════════════════════════════
          FIREPLACE — droite
          ══════════════════════════════════ */}
      {/* Fireplace structure stone */}
      <path d="M 296,380 Q 294,340 310,330 L 400,330 L 400,700 L 296,700 Z"
        fill="#1a1006" stroke="rgba(80,55,20,0.4)" strokeWidth="0.5" />
      {/* Fireplace arch */}
      <path d="M 306,530 Q 304,490 316,480 L 380,480 L 380,640 L 306,640 Z"
        fill="#120a02" />
      {/* Fire glow */}
      <ellipse cx="343" cy="620" rx="40" ry="20" fill="rgba(255,140,20,0.3)" filter="url(#lh-glow-soft)">
        <animate attributeName="opacity" values="0.5;1;0.6;0.8;0.5" dur="1.2s" repeatCount="indefinite" />
      </ellipse>
      {/* Fire flames */}
      <path d="M 325,630 Q 320,600 330,580 Q 335,565 340,560 Q 342,570 338,585 Q 348,565 355,545 Q 358,560 352,580 Q 362,562 368,540 Q 372,558 365,580 Q 373,565 375,550 Q 377,568 370,590 Q 360,610 343,625 Z"
        fill="rgba(255,160,20,0.8)">
        <animate attributeName="d"
          values="M325,630 Q320,600 330,580 Q335,565 340,560 Q342,570 338,585 Q348,565 355,545 Q358,560 352,580 Q362,562 368,540 Q372,558 365,580 Q373,565 375,550 Q377,568 370,590 Q360,610 343,625 Z;M323,632 Q318,598 332,576 Q337,561 343,556 Q344,568 339,583 Q350,561 358,541 Q360,558 354,578 Q363,560 370,538 Q374,556 366,578 Q375,562 378,546 Q379,566 372,588 Q362,608 344,627 Z;M325,630 Q320,600 330,580 Q335,565 340,560 Q342,570 338,585 Q348,565 355,545 Q358,560 352,580 Q362,562 368,540 Q372,558 365,580 Q373,565 375,550 Q377,568 370,590 Q360,610 343,625 Z"
          dur="0.4s" repeatCount="indefinite" />
      </path>
      {/* Inner flame */}
      <path d="M 335,625 Q 333,605 340,590 Q 344,582 347,578 Q 348,588 345,598 Q 352,585 357,568 Q 360,582 355,598 Q 362,585 365,570 Q 367,584 361,600 Q 353,615 342,624 Z"
        fill="rgba(255,220,80,0.7)">
        <animate attributeName="d"
          values="M335,625 Q333,605 340,590 Q344,582 347,578 Q348,588 345,598 Q352,585 357,568 Q360,582 355,598 Q362,585 365,570 Q367,584 361,600 Q353,615 342,624 Z;M333,627 Q332,603 342,588 Q346,580 350,574 Q350,586 347,596 Q354,581 360,564 Q362,580 357,596 Q364,583 368,566 Q369,582 363,598 Q355,613 344,626 Z;M335,625 Q333,605 340,590 Q344,582 347,578 Q348,588 345,598 Q352,585 357,568 Q360,582 355,598 Q362,585 365,570 Q367,584 361,600 Q353,615 342,624 Z"
          dur="0.35s" repeatCount="indefinite" />
      </path>
      {/* Holographic terminal overlay on fireplace — Iron Man style */}
      <rect x="308" y="482" width="70" height="55" rx="3"
        fill="rgba(100,200,255,0.04)" stroke="rgba(100,200,255,0.15)" strokeWidth="0.5" />
      <text x="343" y="498" textAnchor="middle" fontFamily="monospace" fontSize="5"
        fill="rgba(100,200,255,0.5)" letterSpacing="1">TEMP: 18.4°</text>
      <text x="343" y="510" textAnchor="middle" fontFamily="monospace" fontSize="5"
        fill="rgba(100,200,255,0.4)" letterSpacing="1">SYST: OK</text>
      {[0,1,2].map(i => (
        <rect key={`fp${i}`} x="316" y={518+i*7} width={20+i*8} height="2.5" rx="1"
          fill="rgba(100,200,255,0.15)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur={`${1.5+i*0.3}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* ══════════════════════════════════
          VINES & PLANTS
          ══════════════════════════════════ */}
      {/* Top left vine */}
      <path d="M 0,220 Q 20,230 15,250 Q 10,265 25,270 Q 40,275 35,295 Q 30,310 45,315"
        fill="none" stroke="url(#lh-vine)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Leaves on vine */}
      {[[15,250],[25,270],[35,295]].map(([x,y],i) => (
        <ellipse key={`lf${i}`} cx={x+6} cy={y-3} rx="6" ry="3.5"
          fill="#2a6020" opacity="0.8" transform={`rotate(${-20+i*15},${x+6},${y-3})`} />
      ))}

      {/* Top right vine */}
      <path d="M 400,220 Q 380,235 385,255 Q 390,270 375,278 Q 360,285 365,305"
        fill="none" stroke="url(#lh-vine)" strokeWidth="2" strokeLinecap="round" />
      {[[380,255],[372,278],[365,305]].map(([x,y],i) => (
        <ellipse key={`rv${i}`} cx={x-6} cy={y-3} rx="5.5" ry="3"
          fill="#2a6020" opacity="0.7" transform={`rotate(${20-i*12},${x-6},${y-3})`} />
      ))}

      {/* Hanging glow plants */}
      <g transform="translate(185,225)">
        <path d="M 0,0 Q -8,15 -5,30 Q -12,35 -8,50 Q -5,60 0,65"
          fill="none" stroke="#1a5010" strokeWidth="1.5" />
        <ellipse cx="-6" cy="32" rx="5" ry="3" fill="#2a7020" opacity="0.9" />
        <ellipse cx="-8" cy="50" rx="4" ry="2.5" fill="#228020" opacity="0.8" />
        <circle cx="0" cy="65" r="3" fill="rgba(100,255,100,0.4)">
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ══════════════════════════════════
          FLOOR — parquet bois chaud
          ══════════════════════════════════ */}
      <rect x="0" y="620" width="400" height="80" fill="url(#lh-floor)" />
      <line x1="0" y1="620" x2="400" y2="620" stroke="rgba(120,80,30,0.3)" strokeWidth="1" />

      {/* Floor planks */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`fp${i}`} x1={i*57} y1="620" x2={i*57} y2="700"
          stroke="rgba(80,50,15,0.2)" strokeWidth="0.5" />
      ))}
      {[0,1,2].map(i => (
        <line key={`fph${i}`} x1="0" y1={640+i*20} x2="400" y2={640+i*20}
          stroke="rgba(80,50,15,0.1)" strokeWidth="0.3" />
      ))}

      {/* Floor fireplace reflection */}
      <ellipse cx="343" cy="635" rx="55" ry="12" fill="rgba(255,140,20,0.08)" filter="url(#lh-bloom)" />
      {/* Floor crystal reflections */}
      <ellipse cx="315" cy="640" rx="30" ry="8" fill={crystalColor.replace('0.6','0.05')} filter="url(#lh-bloom)" />

      {/* ══════════════════════════════════
          AMBIENT PARTICLES — dust/magic
          ══════════════════════════════════ */}
      {[
        [80,350],[150,420],[220,380],[290,450],[60,490],[340,400],[180,460],[120,520]
      ].map(([x,y],i) => (
        <circle key={`dp${i}`} cx={x} cy={y} r={0.8+Math.random()*1.2}
          fill={i%3===0 ? 'rgba(255,220,100,0.6)' : i%3===1 ? 'rgba(140,200,255,0.5)' : 'rgba(180,140,255,0.5)'}
          opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur={`${4+i*0.6}s`}
            begin={`${i*0.7}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${y};${y-25};${y}`}
            dur={`${5+i*0.5}s`} begin={`${i*0.7}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* ══════════════════════════════════
          CASIER DOCS — intégré dans l'étagère
          ══════════════════════════════════ */}
      {/* Small tech slot in bookshelf */}
      <rect x="2" y="390" width="40" height="28" rx="2"
        fill="#0a0806" stroke="rgba(140,210,255,0.25)" strokeWidth="0.8" />
      <text x="22" y="400" textAnchor="middle" fontFamily="monospace" fontSize="4"
        fill="rgba(140,210,255,0.5)">INBOX</text>
      <rect x="5" y="403" width="34" height="3.5" rx="1"
        fill="rgba(140,210,255,0.08)" stroke="rgba(140,210,255,0.2)" strokeWidth="0.3" />
      <rect x="5" y="410" width="34" height="3.5" rx="1"
        fill="rgba(100,200,80,0.08)" stroke="rgba(100,200,80,0.2)" strokeWidth="0.3" />
      <text x="22" y="413" textAnchor="middle" fontFamily="monospace" fontSize="3.5"
        fill="rgba(100,200,80,0.5)">OUT</text>
      {/* LED */}
      <circle cx="38" cy="396" r="1.5" fill="rgba(140,210,255,0.6)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
