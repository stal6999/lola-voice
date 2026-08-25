'use client'

import React, { useState, useEffect } from 'react'

interface BigScreenProps {
  visible: boolean
  content: string | null
  type: 'text' | 'chart' | 'image' | 'none'
}

export default function BigScreen({ visible, content, type }: BigScreenProps) {
  const [displayed, setDisplayed] = useState('')
  const [charIdx, setCharIdx] = useState(0)

  // Typewriter effect for text content
  useEffect(() => {
    if (!content || type !== 'text') { setDisplayed(content || ''); return }
    setDisplayed('')
    setCharIdx(0)
    let i = 0
    const interval = setInterval(() => {
      if (i >= content.length) { clearInterval(interval); return }
      setDisplayed(content.slice(0, i + 1))
      i++
    }, 18)
    return () => clearInterval(interval)
  }, [content, type])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '55%',
      background: 'linear-gradient(180deg, rgba(8,14,32,0.95) 0%, rgba(13,21,48,0.85) 100%)',
      borderBottom: '1px solid rgba(201,168,76,0.15)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 5,
    }}>
      {/* Screen header bar */}
      <div style={{
        padding: '6px 16px',
        background: 'rgba(201,168,76,0.06)',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#2ecc71', '#e74c3c', '#f39c12'].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.6 }} />
          ))}
        </div>
        <span style={{ fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 2, fontFamily: 'monospace' }}>
          LOLA DISPLAY SYSTEM
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2ecc71', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 8, color: '#8A9BB5', fontFamily: 'monospace' }}>LIVE</span>
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1, padding: '16px 20px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Scan line effect */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {type === 'none' || !content ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '2px solid rgba(201,168,76,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🖥</div>
            <span style={{ fontSize: 11, color: 'rgba(201,168,76,0.3)', letterSpacing: 1, fontFamily: 'monospace' }}>
              EN ATTENTE
            </span>
          </div>
        ) : type === 'text' ? (
          <div style={{
            color: '#e8f0ff', fontSize: 13, lineHeight: 1.7,
            fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap',
            position: 'relative', zIndex: 2,
          }}>
            {displayed}
            <span style={{ opacity: 0.7, animation: 'pulse 0.8s infinite' }}>|</span>
          </div>
        ) : null}

        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => {
          const isLeft = pos.includes('left')
          const isTop = pos.includes('top')
          return (
            <div key={pos} style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: 8,
              [isLeft ? 'left' : 'right']: 8,
              width: 10, height: 10,
              borderTop: isTop ? '1px solid rgba(201,168,76,0.3)' : 'none',
              borderBottom: isTop ? 'none' : '1px solid rgba(201,168,76,0.3)',
              borderLeft: isLeft ? '1px solid rgba(201,168,76,0.3)' : 'none',
              borderRight: isLeft ? 'none' : '1px solid rgba(201,168,76,0.3)',
              zIndex: 2,
            }} />
          )
        })}
      </div>
    </div>
  )
}
