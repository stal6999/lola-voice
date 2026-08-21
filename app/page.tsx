'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import LolaAvatar from '@/components/LolaAvatar'
import BatcaveScene from '@/components/BatcaveScene'
import PortalEntry from '@/components/PortalEntry'
import CSSParticles from '@/components/CSSParticles'
import DocumentPanel from '@/components/DocumentPanel'
import MSDosTerminal from '@/components/MSDosTerminal'
import BigScreen from '@/components/BigScreen'
import DocNotification from '@/components/DocNotification'
type Message = { role: 'user' | 'assistant'; content: string }
type MouthState = 'closed' | 'half' | 'open'
type Expression = 'neutral' | 'listening' | 'thinking' | 'smiling'

export default function LolaPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(false)
  const [speaking, setSpeaking]   = useState(false)
  const [listening, setListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [lastResponse, setLastResponse]     = useState('')
  const [showPortal, setShowPortal]         = useState(false)
  const [mouthState, setMouthState]         = useState<MouthState>('closed')
  const [blinking, setBlinking]             = useState(false)
  const [expression, setExpression]         = useState<Expression>('neutral')
  const [input, setInput]                   = useState('')
  const [showChat, setShowChat]             = useState(false)
  const [breathPhase, setBreathPhase]       = useState(0)
  const [headTiltX, setHeadTiltX]           = useState(0)
  const [eyeShiftX, setEyeShiftX]          = useState(0)
  const [eyeShiftY, setEyeShiftY]          = useState(0)
  const [microExpression, setMicroExpression] = useState<'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'>('none')
  const [conversationMode, setConversationMode] = useState(false)
  const [muted, setMuted] = useState(false)
  const [showDocs, setShowDocs]               = useState(false)
  const [bigScreenContent, setBigScreenContent] = useState<string | null>(null)
  const [bigScreenVisible, setBigScreenVisible] = useState(false)
  const [docNotification, setDocNotification]   = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const ttsQueueRef = useRef<string | null>(null)

  // Débloquer l'audio au premier geste utilisateur (Chrome mobile exige ça)
  function unlockAudio() {
    if (audioUnlockedRef.current) return
    if (!audioRef.current) {
      const a = document.createElement('audio')
      a.setAttribute('playsinline', '')
      a.setAttribute('webkit-playsinline', '')
      // Jouer un son silencieux pour débloquer
      a.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaC5CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+M4wAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+M4wDkAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
      a.volume = 0.01
      a.play().then(() => {
        audioUnlockedRef.current = true
        a.pause()
        a.volume = 1
      }).catch(() => {})
      audioRef.current = a
    }
  }

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Blink timer — naturel avec double-blink occasionnel
  useEffect(() => {
    function doBlink() {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
      // 20% de chance de double-blink
      if (Math.random() < 0.2) {
        setTimeout(() => {
          setBlinking(true)
          setTimeout(() => setBlinking(false), 120)
        }, 250)
      }
    }
    const interval = setInterval(() => {
      if (Math.random() > 0.25) doBlink()
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  // Breathing cycle
  useEffect(() => {
    let frame: number
    const start = Date.now()
    function animate() {
      const elapsed = (Date.now() - start) / 4000
      setBreathPhase(elapsed % 1)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Micro-comportements humains — regarde ses écrans, lève un sourcil, petit sourire
  useEffect(() => {
    const interval = setInterval(() => {
      // Si elle ne parle pas et n'écoute pas → petits gestes idle
      if (!speaking && !listening && !loading) {
        const rand = Math.random()
        if (rand < 0.25) {
          // Regarde un de ses écrans
          setEyeShiftX(-2 + Math.random() * 4)
          setEyeShiftY(-1 + Math.random() * 2)
          setHeadTiltX(-1.5 + Math.random() * 3)
          setTimeout(() => { setEyeShiftX(0); setEyeShiftY(0); setHeadTiltX(0) }, 1500 + Math.random() * 1000)
        } else if (rand < 0.35) {
          // Lève un sourcil
          setMicroExpression('brow-raise')
          setTimeout(() => setMicroExpression('none'), 800)
        } else if (rand < 0.45) {
          // Petit sourire
          setMicroExpression('slight-smile')
          setTimeout(() => setMicroExpression('none'), 1200)
        } else if (rand < 0.55) {
          // Regarde vers ses écrans puis revient
          setMicroExpression('glance-screen')
          setEyeShiftX(-3)
          setHeadTiltX(-2)
          setTimeout(() => {
            setEyeShiftX(0); setHeadTiltX(0); setMicroExpression('none')
          }, 2000)
        }
      }
    }, 4000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [speaking, listening, loading])

  // Lip sync listener
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as MouthState
      setMouthState(detail)
    }
    window.addEventListener('lola-mouth', handler)
    return () => window.removeEventListener('lola-mouth', handler)
  }, [])

  /* ── SEND MESSAGE ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    unlockAudio() // Débloque l'audio au moment du geste utilisateur
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messagesRef.current, userMsg]
    setMessages(history)
    setInput('')
    setLiveTranscript('')
    setLoading(true)
    setExpression('thinking')

    try {
      const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json()
      const lolaMsg: Message = { role: 'assistant', content: data.text }
      setMessages([...history, lolaMsg])
      setLastResponse(data.text)
      setLoading(false)
      setExpression('smiling')
      playTTS(data.text)
    } catch {
      setLoading(false)
      setExpression('neutral')
    }
  }, [])

  /* ── TTS — utilise l'audio déjà débloqué ── */
  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      // L'audio element existe déjà grâce à unlockAudio()
      if (!audioRef.current) {
        const a = document.createElement('audio')
        a.setAttribute('playsinline', '')
        document.body.appendChild(a)
        audioRef.current = a
      }

      const audio = audioRef.current
      audio.pause()
      audio.src = url
      audio.volume = 1

      // Lip-sync par timer
      let lipInterval: NodeJS.Timeout | null = null

      audio.onplay = () => {
        let frame = 0
        lipInterval = setInterval(() => {
          frame++
          const states: MouthState[] = ['closed', 'half', 'open', 'half']
          setMouthState(states[frame % 4])
        }, 120)
      }

      audio.onended = () => {
        if (lipInterval) clearInterval(lipInterval)
        setSpeaking(false)
        setExpression('neutral')
        setMouthState('closed')
        // Mode conversation continue → réécoute automatiquement (sauf si muté)
        if (conversationMode && !muted) {
          setTimeout(() => startListening(), 300)
        }
      }
      audio.onerror = () => {
        if (lipInterval) clearInterval(lipInterval)
        setSpeaking(false)
        setExpression('neutral')
        setMouthState('closed')
      }

      audio.play()
    } catch {
      setSpeaking(false)
      setExpression('neutral')
    }
  }

  /* ── SPEECH RECOGNITION with auto-silence ── */
  function toggleConversation() {
    if (conversationMode) {
      // Arrêter la conversation
      setConversationMode(false)
      stopListening()
      if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }
    } else {
      // Lancer la conversation continue
      setConversationMode(true)
      startListening()
    }
  }

  function startListening() {
    unlockAudio() // Débloque l'audio aussi quand on appuie sur le micro
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Navigateur non supporté. Utilise Chrome ou Safari.'); return }

    const recognition = new SR()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscript = ''
    let hasSpoken = false
    setExpression('listening')

    function resetSilenceTimer() {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        if (hasSpoken && finalTranscript.trim()) recognition.stop()
      }, 1500)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) { finalTranscript += t + ' '; hasSpoken = true }
        else { interim = t; hasSpoken = true }
      }
      setLiveTranscript(finalTranscript + interim)
      resetSilenceTimer()
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setListening(false)
      const text = finalTranscript.trim()
      if (text) sendMessage(text)
      else setExpression('neutral')
      setLiveTranscript('')
    }

    recognition.onerror = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setListening(false); setLiveTranscript(''); setExpression('neutral')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    recognitionRef.current?.stop()
    setListening(false)
  }

  function toggleMute() {
    if (muted) {
      // Unmute → reprendre l'écoute si conversation active
      setMuted(false)
      if (conversationMode && !speaking && !loading) {
        setTimeout(() => startListening(), 200)
      }
    } else {
      // Mute → couper le micro mais garder la conversation active
      setMuted(true)
      if (listening) {
        recognitionRef.current?.stop()
        setListening(false)
        setLiveTranscript('')
      }
    }
  }

  // Portal
  if (showPortal) {
    return <PortalEntry onComplete={() => setShowPortal(false)} />
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0d1530', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── SCENE: Batcave + Lola ── */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        overflow: 'hidden',
      }}>
        {/* Background scene */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '5%',
        }}>
          <BatcaveScene
            width={Math.min(typeof window !== 'undefined' ? window.innerWidth : 400, 500)}
            audioActive={speaking}
            screenContent={bigScreenContent}
            onFileContent={(content, filename) => {
              sendMessage(`[Document reçu: ${filename}]\n\n${content.slice(0, 3000)}\n\nRésume ce document et dis-moi ce que tu en retiens.`)
              setBigScreenContent(`📄 ${filename}\n\n${content.slice(0, 600)}...`)
            }}
            onDocumentReady={(name) => setDocNotification(`"${name}" assimilé — je suis prête.`)}
            outputDoc={null}
          />
          <CSSParticles count={18} />
        </div>

        {/* Lola avatar — positioned over the desk */}
        <div style={{
          position: 'relative', zIndex: 10,
          marginBottom: 0,
          animation: 'lolaFloat 4s ease-in-out infinite',
        }}>
          <LolaAvatar
            mouthState={mouthState}
            blinking={blinking}
            expression={expression}
            breathPhase={breathPhase}
            headTiltX={headTiltX}
            eyeShiftX={eyeShiftX}
            eyeShiftY={eyeShiftY}
            microExpression={microExpression}
            width={Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.55 : 220, 250)}
          />
        </div>

        {/* Status indicator */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: listening ? '#e74c3c' : speaking ? '#2ecc71' : '#C9A84C',
              animation: (listening || speaking) ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, color: '#8A9BB5' }}>
              {conversationMode ? (muted ? '🔇 Micro coupé' : listening ? '🎙 Je t\u2019écoute…' : speaking ? '🔊 Lola parle…' : loading ? '⌛ Réflexion…' : '🔄 En conversation') : 'Lola'}
            </span>
          </div>
          <button onClick={() => setShowChat(!showChat)} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 16, padding: '4px 12px', color: '#C9A84C', fontSize: 11, cursor: 'pointer',
          }}>
            {showChat ? '✕' : '💬'}
          </button>
        </div>
      </div>

      {/* ── CHAT OVERLAY (toggle) ── */}
      {showChat && (
        <div style={{
          position: 'absolute', top: 50, left: 8, right: 8, bottom: 90,
          background: 'rgba(13,21,48,0.95)', borderRadius: 16,
          border: '1px solid rgba(201,168,76,0.15)', zIndex: 30,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.1)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#C9A84C' }}>Conversation</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%', padding: '8px 12px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                background: m.role === 'user' ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.06)',
                color: m.role === 'user' ? '#0d1530' : '#fff',
                fontSize: 13, lineHeight: 1.5, textAlign: 'left' as const, wordBreak: 'break-word' as const,
              }}>
                {m.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESPONSE BUBBLE ── */}
      <div style={{
        flexShrink: 0, padding: '8px 16px', minHeight: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {(lastResponse || liveTranscript || loading) && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 16, padding: '10px 16px', maxWidth: '90%',
            fontSize: 13, lineHeight: 1.5, textAlign: 'center' as const,
            color: liveTranscript ? '#E8C96A' : '#fff',
            fontStyle: liveTranscript ? 'italic' : 'normal',
          }}>
            {loading ? '⌛ Lola réfléchit…' : liveTranscript ? `"${liveTranscript}…"` : lastResponse}
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <footer style={{
        background: 'rgba(18,32,80,0.9)', borderTop: '1px solid rgba(201,168,76,0.1)',
        padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Text input */}
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
          placeholder="Écris à Lola…"
          disabled={listening}
          style={{
            flex: 1, maxWidth: 280, background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 20,
            padding: '10px 16px', color: '#fff', fontSize: 14, outline: 'none',
            fontFamily: 'inherit', opacity: listening ? 0.3 : 1,
          }} />

        {/* Micro — central, bigger */}
        <button onClick={toggleConversation}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: conversationMode ? '#e74c3c' : 'linear-gradient(135deg,#C9A84C,#E8C96A)',
            color: conversationMode ? '#fff' : '#0d1530', fontSize: 22, flexShrink: 0,
            boxShadow: conversationMode ? '0 0 20px rgba(231,76,60,.5)' : '0 0 15px rgba(201,168,76,.3)',
            transition: 'all .2s',
            animation: conversationMode ? 'recPulse 1.5s infinite' : 'none',
          }}>
          {conversationMode ? '⏹' : '🎙'}
        </button>

        {/* Mute — visible uniquement en mode conversation */}
        {conversationMode && (
          <button onClick={toggleMute}
            style={{
              width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
              background: muted ? 'rgba(231,76,60,.2)' : 'rgba(46,204,113,.15)',
              color: muted ? '#e74c3c' : '#2ecc71', fontSize: 16,
              border: `1px solid ${muted ? 'rgba(231,76,60,.3)' : 'rgba(46,204,113,.3)'}`,
              transition: 'all .2s',
            }}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}

        {/* Send */}
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading || listening}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: input.trim() ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.05)',
            color: input.trim() ? '#C9A84C' : '#8A9BB5', fontSize: 16,
          }}>
          ➤
        </button>
      </footer>

      {/* ── DOCUMENTS PANEL ── */}
      <DocumentPanel
        visible={showDocs}
        onClose={() => setShowDocs(false)}
        onDocumentReady={(doc) => {
          setDocNotification(`"${doc.name}" est prêt — je l'ai assimilé.`)
        }}
        onFileContent={(content, filename) => {
          // Envoyer le contenu du doc dans le contexte de Lola
          sendMessage(`[Document reçu: ${filename}]\n\n${content.slice(0, 3000)}\n\nRésume ce document et dis-moi ce que tu en retiens.`)
          setBigScreenContent(`📄 ${filename}\n\n${content.slice(0, 800)}...`)
          setBigScreenVisible(true)
        }}
      />

      {/* ── GRAND ÉCRAN ── */}
      <BigScreen
        visible={bigScreenVisible}
        content={bigScreenContent}
        type={bigScreenContent ? 'text' : 'none'}
      />

      {/* ── TERMINAL MS-DOS ── */}
      <MSDosTerminal visible={loading} processing={loading} taskName="Traitement requête" />

      {/* ── NOTIFICATION DOC ── */}
      <DocNotification message={docNotification} onDismiss={() => setDocNotification(null)} />

      {/* ── BOUTON DOCS (toolbar) ── */}
      <button onClick={() => setShowDocs(!showDocs)} style={{
        position: 'fixed', right: showDocs ? 292 : 12, top: '50%',
        transform: 'translateY(-50%)',
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: showDocs ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)',
        color: '#C9A84C', fontSize: 16, zIndex: 55,
        transition: 'all 0.3s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>📁</button>

      {/* ── BOUTON GRAND ÉCRAN (toggle) ── */}
      {bigScreenVisible && (
        <button onClick={() => setBigScreenVisible(false)} style={{
          position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(8,14,32,0.9)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 16, padding: '4px 14px', color: '#8A9BB5', fontSize: 11, cursor: 'pointer',
          zIndex: 20,
        }}>Fermer l&apos;écran ✕</button>
      )}

      {/* ── BOUTON OUVRIR GRAND ÉCRAN ── */}
      {lastResponse && !bigScreenVisible && (
        <button onClick={() => {
          setBigScreenContent(lastResponse)
          setBigScreenVisible(true)
        }} style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 16, padding: '4px 14px', color: '#C9A84C', fontSize: 11, cursor: 'pointer',
          zIndex: 20,
        }}>🖥 Afficher sur grand écran</button>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 10px rgba(231,76,60,.3)} 50%{box-shadow:0 0 25px rgba(231,76,60,.6)} }
        @keyframes lolaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        input::placeholder { color: #8A9BB5; }
        button:active { transform: scale(0.95); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
