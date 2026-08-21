'use client'

import React, { useEffect, useState } from 'react'

interface TerminalLine {
  text: string
  type: 'cmd' | 'output' | 'success' | 'error'
}

interface MSDosTerminalProps {
  visible: boolean
  processing: boolean
  taskName?: string
}

export default function MSDosTerminal({ visible, processing, taskName = 'Analyse en cours' }: MSDosTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [cursor, setCursor] = useState(true)

  const processingMessages = [
    'Initialisation du module LOLA.EXE...',
    'Chargement des paramètres utilisateur...',
    'Connexion au serveur Claude AI...',
    'Analyse du contexte conversationnel...',
    'Traitement de la requête en cours...',
    'Génération de la réponse optimale...',
    'Vérification de la cohérence...',
    'Encodage audio ElevenLabs...',
    'Transmission vers interface utilisateur...',
    'Opération terminée avec succès.',
  ]

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 500)
    return () => clearInterval(t)
  }, [])

  // Simulate terminal output when processing
  useEffect(() => {
    if (!processing) return

    setLines([
      { text: `C:\\LOLA> ${taskName.toUpperCase()}`, type: 'cmd' },
      { text: '──────────────────────────────────', type: 'output' },
    ])

    let i = 0
    const interval = setInterval(() => {
      if (i >= processingMessages.length) {
        clearInterval(interval)
        return
      }
      setLines(prev => [...prev, {
        text: processingMessages[i],
        type: i === processingMessages.length - 1 ? 'success' : 'output'
      }])
      i++
    }, 280)

    return () => clearInterval(interval)
  }, [processing])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: 90, right: 16,
      width: 300, maxHeight: 200,
      background: 'rgba(0,0,0,0.92)',
      border: '1px solid rgba(0,200,0,0.3)',
      borderRadius: 6,
      overflow: 'hidden',
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      zIndex: 40,
      boxShadow: '0 0 20px rgba(0,200,0,0.1)',
    }}>
      {/* Title bar */}
      <div style={{
        background: 'rgba(0,150,0,0.2)',
        borderBottom: '1px solid rgba(0,200,0,0.2)',
        padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', opacity: 0.7 }} />
        <span style={{ color: 'rgba(0,255,0,0.7)', fontSize: 9, letterSpacing: 1 }}>LOLA SYSTEM v1.0</span>
      </div>

      {/* Terminal content */}
      <div style={{
        padding: '8px', overflowY: 'auto', maxHeight: 160,
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            color: line.type === 'cmd' ? '#E8C96A'
              : line.type === 'success' ? '#2ecc71'
              : line.type === 'error' ? '#e74c3c'
              : 'rgba(0,255,0,0.65)',
            lineHeight: 1.4,
          }}>
            {line.text}
          </div>
        ))}
        {processing && (
          <div style={{ color: 'rgba(0,255,0,0.65)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>C:\LOLA{'>'}</span>
            <span style={{ opacity: cursor ? 1 : 0, background: 'rgba(0,255,0,0.65)', width: 6, height: 11, display: 'inline-block' }} />
          </div>
        )}
      </div>
    </div>
  )
}
