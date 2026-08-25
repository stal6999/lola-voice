'use client'

import React, { useEffect, useState } from 'react'

type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'loading' | 'alert' | 'happy'

interface LolaDisplayScreenProps {
  lolaState: LolaState
  screenImage?: string | null    // URL ou data URL d'une image que Lola montre
  screenCaption?: string | null  // légende sous l'image
  compact?: boolean              // mode mobile — texte plus petit
}

const QUOTES = [
  "L'énergie que tu investis aujourd'hui est le revenu de demain.",
  "Chaque compteur signé est un pas vers ta liberté.",
  "La constance bat le talent quand le talent ne travaille pas.",
  "Un client satisfait vaut dix prospects.",
  "Ce que tu fais aujourd'hui décide de ce que tu seras en mars 2027.",
  "Le meilleur moment pour agir, c'est maintenant.",
  "Ta valeur ne se discute pas — elle se démontre.",
  "Chaque refus te rapproche du prochain oui.",
  "La simplicité est la sophistication suprême.",
  "Travaille pendant qu'ils dorment. Récolte pendant qu'ils rêvent.",
  "Un système bien construit travaille même quand tu ne travailles pas.",
  "L'indépendance ne se demande pas — elle se construit.",
  "Chaque appel passé est une chance que tu prends.",
  "Le secret de la réussite : la régularité sans exception.",
  "Ce qui est mesuré est amélioré.",
  "Fais confiance au processus. Les résultats suivront.",
  "Ton futur client attend que tu te présentes.",
  "Une heure de prospection par jour change une vie en un an.",
  "La crédibilité se bâtit action par action.",
  "TC Expertise & Énergie — bâtir l'avenir, un compteur à la fois.",
]

/**
 * Vrai écran d'affichage de Lola — l'équivalent d'une présentatrice qui montre
 * des choses à l'écran derrière/à côté d'elle : photos envoyées, comparatifs,
 * documents. Mode idle : phrases motivantes TCEE en rotation.
 */
export default function LolaDisplayScreen({ lolaState, screenImage, screenCaption, compact = false }: LolaDisplayScreenProps) {
  const [quoteIdx, setQuoteIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 600000)
    return () => clearInterval(id)
  }, [])

  const isThinking = lolaState === 'thinking' || lolaState === 'loading'

  return (
    <div style={{
      width: '100%', height: '100%',
      borderRadius: compact ? 10 : 16,
      background: 'linear-gradient(180deg, #4a3a18 0%, #332810 100%)',
      border: `${compact ? 1 : 1.5}px solid rgba(201,168,76,0.5)`,
      boxShadow: '0 0 40px rgba(201,168,76,0.08), inset 0 0 60px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {screenImage ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenImage} alt="Écran Lola" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {screenCaption && (
            <div style={{
              padding: compact ? '6px 10px' : '10px 16px',
              fontFamily: 'Georgia, serif', fontSize: compact ? 11 : 13,
              color: 'rgba(220,200,160,0.85)', textAlign: 'center', fontStyle: 'italic',
              borderTop: '1px solid rgba(201,168,76,0.2)',
            }}>
              {screenCaption}
            </div>
          )}
        </div>
      ) : isThinking ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 8 : 14 }}>
          <div style={{
            width: compact ? 28 : 44, height: compact ? 28 : 44, borderRadius: '50%',
            border: '3px solid rgba(255,220,80,0.25)', borderTopColor: 'rgba(255,220,80,0.85)',
            animation: 'lola-spin 0.9s linear infinite',
          }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: compact ? 9 : 12, letterSpacing: 2, color: 'rgba(255,220,80,0.65)' }}>
            RÉFLEXION
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 8 : 18, padding: compact ? '0 16px' : '0 32px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: compact ? 8 : 11, letterSpacing: 3, color: 'rgba(201,168,76,0.55)' }}>
            TC EXPERTISE &amp; ÉNERGIE
          </span>
          <div style={{ width: compact ? 36 : 60, height: 1, background: 'rgba(201,168,76,0.25)' }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: compact ? 12 : 17, fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(220,200,160,0.85)', maxWidth: compact ? 260 : 480 }}>
            {QUOTES[quoteIdx]}
          </p>
        </div>
      )}

      <style>{`@keyframes lola-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
