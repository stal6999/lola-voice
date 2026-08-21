'use client'

import React from 'react'

export default function CSSParticles({ count = 20 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 6,
    driftX: (Math.random() - 0.5) * 40,
    opacity: 0.15 + Math.random() * 0.35,
    hue: 45 + Math.random() * 15, // gold range
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
      {particles.map(p => (
        <span key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          bottom: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(201,168,76,${p.opacity}) 0%, rgba(201,168,76,0) 70%)`,
          animation: `particleFloat ${p.duration}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
          // @ts-expect-error CSS custom properties
          '--drift': `${p.driftX}px`,
        }} />
      ))}

      {/* Data flow particles (rectangles) for tech ambiance */}
      {Array.from({ length: 8 }, (_, i) => (
        <span key={`df${i}`} style={{
          position: 'absolute',
          left: `${15 + Math.random() * 70}%`,
          top: `${10 + Math.random() * 40}%`,
          width: 1,
          height: 3 + Math.random() * 6,
          borderRadius: 1,
          background: `rgba(100,160,220,${0.08 + Math.random() * 0.12})`,
          animation: `dataFlow ${3 + Math.random() * 4}s linear infinite`,
          animationDelay: `${Math.random() * 3}s`,
        }} />
      ))}

      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0) scale(0.3); opacity: 0; }
          15% { opacity: 1; }
          50% { transform: translateY(-80px) translateX(var(--drift, 10px)) scale(1); }
          85% { opacity: 0.4; }
          100% { transform: translateY(-160px) translateX(calc(var(--drift, 10px) * 1.5)) scale(0.1); opacity: 0; }
        }
        @keyframes dataFlow {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(120px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
