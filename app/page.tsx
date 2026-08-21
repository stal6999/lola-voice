'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import LolaFullBody from '@/components/LolaFullBody'
import BatcaveBackground from '@/components/BatcaveBackground'
import CSSParticles from '@/components/CSSParticles'
import MSDosTerminal from '@/components/MSDosTerminal'
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
  const [mouthState, setMouthState]         = useState<MouthState>('closed')
  const [blinking, setBlinking]             = useState(false)
  const [expression, setExpression]         = useState<Expression>('neutral')
  const [breathPhase, setBreathPhase]       = useState(0)
  const [headTiltX, setHeadTiltX]           = useState(0)
  const [eyeShiftX, setEyeShiftX]          = useState(0)
  const [eyeShiftY, setEyeShiftY]          = useState(0)
  const [microExp, setMicroExp] = useState<'none' | 'brow-raise' | 'slight-smile' | 'glance-screen'>('none')
  const [conversationMode, setConversationMode] = useState(false)
  const [muted, setMuted]                   = useState(false)
  const [input, setInput]                   = useState('')
  const [showChat, setShowChat]             = useState(false)
  const [screenContent, setScreenContent]   = useState<string | null>(null)
  const [docNotification, setDocNotification] = useState<string | null>(null)
  const [showDocDrop, setShowDocDrop]       = useState(false)
  const [winW, setWinW] = useState(390)
  const [winH, setWinH] = useState(844)

  const recognitionRef = useRef<unknown>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setWinW(window.innerWidth)
    setWinH(window.innerHeight)
    const onResize = () => { setWinW(window.innerWidth); setWinH(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Blink
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
      if (Math.random() < 0.2) setTimeout(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 120)
      }, 260)
    }
    const id = setInterval(() => { if (Math.random() > 0.25) blink() }, 3200 + Math.random() * 1800)
    return () => clearInterval(id)
  }, [])

  // Breathing
  useEffect(() => {
    let frame: number
    const start = Date.now()
    const tick = () => { setBreathPhase(((Date.now() - start) / 4000) % 1); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Micro-behaviours
  useEffect(() => {
    const id = setInterval(() => {
      if (speaking || listening || loading) return
      const r = Math.random()
      if (r < 0.22) {
        setEyeShiftX(-2.5 + Math.random() * 5); setEyeShiftY(-1 + Math.random() * 2); setHeadTiltX(-1.5 + Math.random() * 3)
        setTimeout(() => { setEyeShiftX(0); setEyeShiftY(0); setHeadTiltX(0) }, 1400 + Math.random() * 800)
      } else if (r < 0.32) { setMicroExp('brow-raise'); setTimeout(() => setMicroExp('none'), 700) }
      else if (r < 0.42) { setMicroExp('slight-smile'); setTimeout(() => setMicroExp('none'), 1100) }
      else if (r < 0.52) {
        setMicroExp('glance-screen'); setEyeShiftX(-3.5); setHeadTiltX(-2.5)
        setTimeout(() => { setEyeShiftX(0); setHeadTiltX(0); setMicroExp('none') }, 1800)
      }
    }, 3800 + Math.random() * 2500)
    return () => clearInterval(id)
  }, [speaking, listening, loading])

  // Unlock audio
  function unlockAudio() {
    if (audioUnlockedRef.current) return
    const a = document.createElement('audio')
    a.setAttribute('playsinline', '')
    a.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaC5CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    a.volume = 0.01
    a.play().then(() => { audioUnlockedRef.current = true; a.pause(); a.volume = 1 }).catch(() => {})
    audioRef.current = a
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    unlockAudio()
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messagesRef.current, userMsg]
    setMessages(history)
    setInput('')
    setLiveTranscript('')
    setLoading(true)
    setExpression('thinking')
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json()
      const lolaMsg: Message = { role: 'assistant', content: data.text }
      setMessages([...history, lolaMsg])
      setLastResponse(data.text)
      setLoading(false)
      setExpression('smiling')
      setScreenContent(data.text)
      playTTS(data.text)
    } catch { setLoading(false); setExpression('neutral') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (!audioRef.current) {
        const a = document.createElement('audio')
        a.setAttribute('playsinline', '')
        document.body.appendChild(a)
        audioRef.current = a
      }
      const audio = audioRef.current
      audio.pause(); audio.src = url; audio.volume = 1
      let lip: ReturnType<typeof setInterval> | null = null
      audio.onplay = () => { let f = 0; lip = setInterval(() => { f++; setMouthState((['closed','half','open','half'] as MouthState[])[f % 4]) }, 120) }
      audio.onended = () => {
        if (lip) clearInterval(lip)
        setSpeaking(false); setExpression('neutral'); setMouthState('closed')
        if (conversationMode && !muted) setTimeout(() => startListening(), 300)
      }
      audio.onerror = () => { if (lip) clearInterval(lip); setSpeaking(false); setExpression('neutral'); setMouthState('closed') }
      audio.play()
    } catch { setSpeaking(false); setExpression('neutral') }
  }

  function toggleConversation() {
    if (conversationMode) {
      setConversationMode(false); stopListening()
      if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }
    } else { setConversationMode(true); startListening() }
  }

  function startListening() {
    unlockAudio()
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Utilise Chrome ou Safari.'); return }
    const rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true
    let final = ''; let spoken = false; setExpression('listening')
    const resetSilence = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => { if (spoken && final.trim()) rec.stop() }, 1500)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) { final += t + ' '; spoken = true } else { interim = t; spoken = true }
      }
      setLiveTranscript(final + interim); resetSilence()
    }
    rec.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setListening(false); const t = final.trim()
      if (t) sendMessage(t); else setExpression('neutral')
      setLiveTranscript('')
    }
    rec.onerror = () => { setListening(false); setLiveTranscript(''); setExpression('neutral') }
    recognitionRef.current = rec; rec.start(); setListening(true)
  }

  function stopListening() {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recognitionRef.current as any)?.stop(); setListening(false)
  }

  function toggleMute() {
    if (muted) {
      setMuted(false)
      if (conversationMode && !speaking && !loading) setTimeout(() => startListening(), 200)
    } else {
      setMuted(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (listening) { (recognitionRef.current as any)?.stop(); setListening(false); setLiveTranscript('') }
    }
  }

  function handleFile(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        setDocNotification(`📄 "${f.name}" assimilé — Lola lit...`)
        setScreenContent(`📄 ${f.name}\n\n${content.slice(0, 600)}...`)
        sendMessage(`[Document reçu: ${f.name}]\n\n${content.slice(0, 3000)}\n\nRésume ce document.`)
      }
      reader.readAsText(f)
    })
    setShowDocDrop(false)
  }

  // Layout dimensions
  const avatarW = Math.min(winW * 0.52, 200)
  const avatarLeft = (winW - avatarW) / 2

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#070c20', userSelect: 'none' }}>

      {/* ── FOND PLEIN ÉCRAN ── */}
      <BatcaveBackground width={winW} height={winH} screenContent={screenContent} audioActive={speaking} />

      {/* ── PARTICULES ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <CSSParticles count={12} />
      </div>

      {/* ── LOLA PLEIN CORPS ── */}
      <div style={{
        position: 'absolute',
        left: avatarLeft,
        bottom: 70,
        width: avatarW,
        animation: 'lolaFloat 4s ease-in-out infinite',
        zIndex: 10,
      }}>
        <LolaFullBody
          mouthState={mouthState}
          blinking={blinking}
          expression={expression}
          breathPhase={breathPhase}
          headTiltX={headTiltX}
          eyeShiftX={eyeShiftX}
          eyeShiftY={eyeShiftY}
          microExpression={microExp}
          width={avatarW}
          speaking={speaking}
          listening={listening}
        />
      </div>

      {/* ── BOUTONS GAUCHE ── */}
      <div style={{
        position: 'absolute', left: 10, top: '30%',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 20,
      }}>
        {/* Conversation */}
        <button onClick={toggleConversation} style={btnStyle(conversationMode ? '#e74c3c' : '#C9A84C', conversationMode)}>
          {conversationMode ? '⏹' : '🎙'}
        </button>
        {/* Mute */}
        {conversationMode && (
          <button onClick={toggleMute} style={btnStyle(muted ? '#e74c3c' : '#2ecc71', muted)}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
        {/* Chat */}
        <button onClick={() => setShowChat(!showChat)} style={btnStyle('#8A9BB5', showChat)}>
          💬
        </button>
      </div>

      {/* ── BOUTONS DROITE ── */}
      <div style={{
        position: 'absolute', right: 10, top: '30%',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 20,
      }}>
        {/* Documents */}
        <button onClick={() => setShowDocDrop(!showDocDrop)} style={btnStyle('#C9A84C', showDocDrop)}>
          📁
        </button>
        {/* Grand écran toggle */}
        <button onClick={() => setScreenContent(screenContent ? null : lastResponse || null)}
          style={btnStyle('#3498db', !!screenContent)}>
          🖥
        </button>
        {/* Terminal */}
        <button onClick={() => {}} style={btnStyle('#2ecc71', loading)} disabled>
          {loading ? '⚡' : '💻'}
        </button>
      </div>

      {/* ── STATUS HEADER ── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(8,12,28,0.85)',
        border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: 20, padding: '5px 14px', zIndex: 20,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: conversationMode ? (listening ? '#e74c3c' : speaking ? '#2ecc71' : '#C9A84C') : '#8A9BB5',
          animation: (listening || speaking) ? 'pulse 1s infinite' : 'none',
        }} />
        <span style={{ fontSize: 11, color: '#8A9BB5', fontFamily: 'monospace' }}>
          {conversationMode
            ? muted ? 'MUTE' : listening ? 'ÉCOUTE' : speaking ? 'PARLE' : loading ? 'RÉFLÉCHIT' : 'EN LIGNE'
            : 'LOLA — TC EXPERTISE'}
        </span>
      </div>

      {/* ── CHAT OVERLAY ── */}
      {showChat && (
        <div style={{
          position: 'absolute', bottom: 70, left: 8, right: 8, top: 50,
          background: 'rgba(7,12,32,0.96)',
          border: '1px solid rgba(201,168,76,0.12)',
          borderRadius: 16, zIndex: 30,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(201,168,76,0.08)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#C9A84C' }}>Conversation</span>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%', padding: '8px 12px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                background: m.role === 'user' ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.05)',
                color: m.role === 'user' ? '#0d1530' : '#fff',
                fontSize: 13, lineHeight: 1.5, textAlign: 'left', wordBreak: 'break-word',
              }}>{m.content}</div>
            ))}
            {liveTranscript && (
              <div style={{ alignSelf: 'flex-end', maxWidth: '82%', padding: '8px 12px',
                borderRadius: '14px 14px 4px 14px', background: 'rgba(201,168,76,0.2)',
                border: '1px dashed rgba(201,168,76,0.4)', color: '#E8C96A', fontSize: 13, fontStyle: 'italic' }}>
                {liveTranscript}…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ZONE DOC DROP ── */}
      {showDocDrop && (
        <div style={{
          position: 'absolute', right: 60, top: '25%',
          width: 200,
          background: 'rgba(7,12,32,0.97)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 12, padding: 14, zIndex: 30,
        }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600 }}>📁 Casier Lola</span>
            <button onClick={() => setShowDocDrop(false)} style={{ background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer' }}>✕</button>
          </div>
          <div onClick={() => fileRef.current?.click()}
            style={{ border: '1.5px dashed rgba(201,168,76,0.3)', borderRadius: 8, padding: '16px 10px',
              textAlign: 'center', cursor: 'pointer', background: 'rgba(201,168,76,0.03)' }}>
            <div style={{ fontSize: 24 }}>📎</div>
            <div style={{ fontSize: 11, color: '#C9A84C', marginTop: 4 }}>Dépose ou clique</div>
            <div style={{ fontSize: 9, color: '#8A9BB5', marginTop: 2 }}>TXT, CSV, MD...</div>
          </div>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files)} />
        </div>
      )}

      {/* ── BULLE RÉPONSE ── */}
      {(lastResponse || liveTranscript) && !showChat && (
        <div style={{
          position: 'absolute', bottom: 74,
          left: 8, right: 8,
          background: 'rgba(7,12,32,0.88)',
          border: '1px solid rgba(201,168,76,0.12)',
          borderRadius: 12, padding: '8px 14px',
          maxHeight: 70, overflow: 'hidden',
          zIndex: 5,
        }}>
          <div style={{ fontSize: 12, color: liveTranscript ? '#E8C96A' : '#e8f0ff',
            lineHeight: 1.4, fontStyle: liveTranscript ? 'italic' : 'normal',
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {loading ? '⌛ …' : liveTranscript ? `"${liveTranscript}…"` : lastResponse}
          </div>
        </div>
      )}

      {/* ── BARRE INPUT ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(7,12,32,0.95)',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        padding: '8px 10px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 20,
      }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
          placeholder="Écris à Lola…" disabled={listening}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
            padding: '9px 14px', color: '#fff', fontSize: 14, outline: 'none',
            fontFamily: 'inherit', opacity: listening ? 0.3 : 1 }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading || listening}
          style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: input.trim() ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
            color: input.trim() ? '#C9A84C' : '#8A9BB5', fontSize: 16 }}>
          ➤
        </button>
      </div>

      {/* ── TERMINAL MS-DOS ── */}
      <MSDosTerminal visible={loading} processing={loading} taskName="Traitement" />

      {/* ── NOTIFICATION ── */}
      <DocNotification message={docNotification} onDismiss={() => setDocNotification(null)} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes lolaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 8px rgba(231,76,60,.3)} 50%{box-shadow:0 0 22px rgba(231,76,60,.7)} }
        @keyframes particleFloat { 0%{transform:translateY(0) translateX(0) scale(.3);opacity:0} 15%{opacity:1} 50%{transform:translateY(-80px) translateX(var(--drift,10px)) scale(1)} 85%{opacity:.4} 100%{transform:translateY(-160px) translateX(calc(var(--drift,10px)*1.5)) scale(.1);opacity:0} }
        @keyframes dataFlow { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(120px);opacity:0} }
        input::placeholder { color: #8A9BB5; }
        button:active { transform: scale(0.92); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>
    </div>
  )
}

function btnStyle(color: string, active: boolean): React.CSSProperties {
  return {
    width: 46, height: 46, borderRadius: '50%',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
    background: active ? `${color}28` : 'rgba(7,12,32,0.85)',
    color: active ? color : '#8A9BB5',
    fontSize: 20, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: active ? `0 0 14px ${color}44` : '0 2px 8px rgba(0,0,0,0.4)',
    transition: 'all .2s',
    backdropFilter: 'blur(8px)',
  }
}
