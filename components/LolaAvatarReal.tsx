'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface LolaAvatarRealProps {
  expression: 'neutral' | 'listening' | 'thinking' | 'smiling'
  speaking: boolean
  listening: boolean
  blinking: boolean
  breathPhase: number
  headTiltX?: number
  width: number
}

export default function LolaAvatarReal({
  expression, speaking, listening, blinking,
  breathPhase, headTiltX = 0, width,
}: LolaAvatarRealProps) {
  const height = width * 1.76 // ratio portrait 512x900

  // Image selon expression
  const imgSrc = speaking
    ? '/lola-talking.jpg'
    : listening
    ? '/lola-listen.jpg'
    : expression === 'thinking'
    ? '/lola-thinking.jpg'
    : expression === 'smiling'
    ? '/lola-smile.jpg'
    : '/lola-fullbody.jpg'

  // Respiration — mouvement subtil
  const breathScale = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.008
  const breathY     = Math.sin(breathPhase * Math.PI * 2) * 1.5
  const headTilt    = headTiltX * 0.4 // léger, naturel

  // Transition douce entre images
  const [currentSrc, setCurrentSrc] = useState(imgSrc)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (imgSrc !== currentSrc) {
      setOpacity(0)
      const t = setTimeout(() => {
        setCurrentSrc(imgSrc)
        setOpacity(1)
      }, 180)
      return () => clearTimeout(t)
    }
  }, [imgSrc, currentSrc])

  // Aura selon état
  const auraColor = listening
    ? 'rgba(255,100,100,0.15)'
    : speaking
    ? 'rgba(100,220,180,0.15)'
    : expression === 'thinking'
    ? 'rgba(180,140,255,0.1)'
    : 'transparent'

  const auraAnim = (listening || speaking) ? 'lolaAura 1.5s ease-in-out infinite' : 'none'

  return (
    <div style={{
      width, height,
      position: 'relative',
      transform: `translateY(${breathY}px) scale(${breathScale}) rotate(${headTilt}deg)`,
      transition: 'transform 0.1s ease-out',
      transformOrigin: 'bottom center',
    }}>
      {/* Ombre au sol */}
      <div style={{
        position: 'absolute', bottom: -8, left: '10%', right: '10%',
        height: 20, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        filter: 'blur(4px)',
      }} />

      {/* Aura émotionnelle */}
      <div style={{
        position: 'absolute', inset: -12,
        borderRadius: 16,
        background: auraColor,
        animation: auraAnim,
        transition: 'background 0.5s ease',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Image principale */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        <Image
          src={currentSrc}
          alt="Lola"
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity,
            transition: 'opacity 0.18s ease',
          }}
          priority
        />

        {/* Clignement CSS overlay */}
        {blinking && (
          <div style={{
            position: 'absolute',
            top: '22%', left: '18%', right: '18%',
            height: '8%',
            background: 'linear-gradient(to bottom, rgba(245,213,180,0.95) 0%, rgba(245,213,180,0.7) 100%)',
            borderRadius: '0 0 50% 50%',
            animation: 'blinkAnim 150ms ease-in-out',
            zIndex: 3,
          }} />
        )}

        {/* Lèvres animées pendant la parole */}
        {speaking && (
          <div style={{
            position: 'absolute',
            bottom: '32%', left: '35%', right: '35%',
            height: '3%',
            background: 'rgba(180,80,80,0.3)',
            borderRadius: '0 0 50% 50%',
            animation: 'mouthAnim 0.25s ease-in-out infinite alternate',
            zIndex: 3,
          }} />
        )}

        {/* Vignette bords */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>

      <style>{`
        @keyframes lolaAura {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes blinkAnim {
          0% { height: 0%; opacity: 0; }
          50% { height: 8%; opacity: 1; }
          100% { height: 0%; opacity: 0; }
        }
        @keyframes mouthAnim {
          0% { height: 2.5%; border-radius: 0 0 30% 30%; }
          100% { height: 4%; border-radius: 0 0 60% 60%; }
        }
      `}</style>
    </div>
  )
}
