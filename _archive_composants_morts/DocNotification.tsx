'use client'

import React, { useEffect, useState } from 'react'

interface DocNotificationProps {
  message: string | null
  onDismiss: () => void
}

export default function DocNotification({ message, onDismiss }: DocNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400) }, 6000)
      return () => clearTimeout(t)
    }
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 60,
      background: 'rgba(8,14,32,0.96)',
      border: '1px solid rgba(46,204,113,0.4)',
      borderRadius: 16,
      padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 0 30px rgba(46,204,113,0.15), 0 4px 20px rgba(0,0,0,0.4)',
      maxWidth: 300,
    }}>
      {/* Lola avatar mini */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: '#0d1530',
      }}>L</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#2ecc71', fontWeight: 600, marginBottom: 2 }}>
          📄 Document Intel
        </div>
        <div style={{ fontSize: 12, color: '#e8f0ff', lineHeight: 1.4 }}>
          {message}
        </div>
      </div>

      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 400) }} style={{
        background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer',
        fontSize: 14, flexShrink: 0, padding: 4,
      }}>✕</button>

      {/* Progress bar auto-dismiss */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'rgba(46,204,113,0.1)', borderRadius: '0 0 16px 16px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#2ecc71',
          animation: 'docProgress 6s linear forwards',
        }} />
      </div>

      <style>{`
        @keyframes docProgress { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>
  )
}
