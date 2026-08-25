'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import dynamic from 'next/dynamic'
import LolaScene from '@/components/LolaScene'

// Lola3D chargée côté client uniquement (WebGL)
const Lola3D = dynamic(() => import('@/components/Lola3D'), {
  ssr: false,
  loading: () => null,
})

type Message = { role: 'user' | 'assistant'; content: string }
type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'loading' | 'alert' | 'happy'
type VisemeEntry = { start: number; end: number; viseme: 'aa' | 'ou' | 'ih' | 'closed' }

// Heuristique simple caractère → visème (français) — permet un vrai lip-sync
// synchronisé sur les timestamps ElevenLabs au lieu d'une approximation FFT.
function charToViseme(ch: string): VisemeEntry['viseme'] {
  const c = ch.toLowerCase()
  if ('aàâ'.includes(c)) return 'aa'
  if ('oôuûœ'.includes(c)) return 'ou'
  if ('eéèêiîy'.includes(c)) return 'ih'
  return 'closed'
}

function buildVisemeTimeline(alignment: any): VisemeEntry[] {
  if (!alignment?.characters?.length) return []
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment
  const timeline: VisemeEntry[] = []
  for (let i = 0; i < characters.length; i++) {
    timeline.push({ start: starts[i], end: ends[i], viseme: charToViseme(characters[i]) })
  }
  return timeline
}

// Parser les motion tags dans les réponses de Lola
function parseLolaResponse(text: string): { clean: string; emotion: string | null; gesture: string | null } {
  const emotionMatch = text.match(/\[emotion:(\w+)\]/)
  const gestureMatch = text.match(/\[gesture:(\w+)\]/)
  const clean = text.replace(/\[emotion:\w+\]/g, '').replace(/\[gesture:\w+\]/g, '').trim()
  return {
    clean,
    emotion: emotionMatch?.[1] ?? null,
    gesture: gestureMatch?.[1] ?? null,
  }
}

export default function LolaPage() {
  // ── Core state ──
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [speaking, setSpeaking]   = useState(false)
  const [listening, setListening] = useState(false)
  const [conversationMode, setConversationMode] = useState(false)
  const [muted, setMuted]         = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [errorBanner, setErrorBanner]     = useState<string | null>(null)
  const [triggerGesture, setTriggerGesture] = useState<string | null>(null)
  const [visemeTimeline, setVisemeTimeline] = useState<VisemeEntry[]>([])

  // ── UI state ──
  const [winW, setWinW]           = useState(1280)
  const [winH, setWinH]           = useState(800)
  const [fileReady, setFileReady] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  // ── Avatar state ──
  const [lolaState, setLolaState] = useState<LolaState>('idle')

  // ── Refs ──
  const recognitionRef  = useRef<any>(null)
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const audioUnlocked   = useRef(false)
  const messagesRef     = useRef<Message[]>([])
  const silenceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convModeRef     = useRef(false)
  const mutedRef        = useRef(false)
  const chatEndRef      = useRef<HTMLDivElement>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { messagesRef.current = messages }, [messages])

  // ── Window size ──
  useEffect(() => {
    const set = () => { setWinW(window.innerWidth); setWinH(window.innerHeight) }
    set(); window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  // ── Unlock audio anticipé au premier touch/click ──
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('touchstart', unlock, { once: true })
    window.addEventListener('click', unlock, { once: true })
    return () => {
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { convModeRef.current = conversationMode }, [conversationMode])
  useEffect(() => { mutedRef.current = muted }, [muted])

  // ── Scroll chat ──
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Lola state → lolaState ──
  useEffect(() => {
    if (listening) setLolaState('listening')
    else if (loading) setLolaState('thinking')
    else if (speaking) setLolaState('speaking')
    else setLolaState('idle')
  }, [listening, loading, speaking])

  // Effacer le message d'erreur après quelques secondes
  useEffect(() => {
    if (!errorBanner) return
    const t = setTimeout(() => setErrorBanner(null), 6000)
    return () => clearTimeout(t)
  }, [errorBanner])

  // ── Audio unlock ──
  function unlockAudio() {
    if (audioUnlocked.current) return
    const a = document.createElement('audio'); a.setAttribute('playsinline', '')
    a.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaC5CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    a.volume = 0.01; a.play().then(() => { audioUnlocked.current = true }).catch(() => {})
    audioRef.current = a
  }

  // ── Send message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    unlockAudio()
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messagesRef.current, userMsg]
    setMessages(history); setInput(''); setLiveTranscript('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })
      if (!res.ok || !res.body) {
        throw new Error(`chat http ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) throw new Error(data.error)
              if (data.done) {
                const { clean, emotion, gesture } = parseLolaResponse(fullText)
                const lolaMsg: Message = { role: 'assistant', content: clean }
                setMessages([...history, lolaMsg])
                setLoading(false)
                if (emotion === 'happy') setLolaState('happy')
                else if (emotion === 'surprised') setLolaState('alert')
                if (gesture) setTriggerGesture(gesture)
                playTTS(clean)
              } else {
                fullText += data.text
              }
            } catch { /* ignore parse errors on partial chunks */ }
          }
        }
      }
    } catch (err) {
      console.error('sendMessage error', err)
      setLoading(false)
      setErrorBanner("Lola n'a pas pu répondre — problème de connexion. Réessaie.")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── TTS avec timestamps — vrai lip-sync ──
  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) throw new Error(`tts http ${res.status}`)
      const data = await res.json()
      if (!data?.audio) throw new Error('tts empty audio')

      const byteChars = atob(data.audio)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      setVisemeTimeline(data.alignment ? buildVisemeTimeline(data.alignment) : [])

      if (!audioRef.current) { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); document.body.appendChild(a); audioRef.current = a }
      const audio = audioRef.current; audio.pause(); audio.src = url; audio.volume = 1
      audio.onended = () => { setSpeaking(false); setVisemeTimeline([]); if (convModeRef.current && !mutedRef.current) setTimeout(() => startListening(), 800) }
      audio.onerror = () => { setSpeaking(false); setVisemeTimeline([]); setErrorBanner('Voix indisponible pour cette réponse.') }
      await audio.play()
    } catch (err) {
      console.error('playTTS error', err)
      setSpeaking(false)
      setVisemeTimeline([])
      setErrorBanner('Voix indisponible — réponse en texte seulement.')
    }
  }

  // ── Voice ──
  function startListening() {
    unlockAudio()
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false) }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setErrorBanner('Reconnaissance vocale non supportée sur ce navigateur.'); return }
    const rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true
    let final = ''; let spoken = false
    const resetSil = () => { if (silenceTimer.current) clearTimeout(silenceTimer.current); silenceTimer.current = setTimeout(() => { if (spoken && final.trim()) rec.stop() }, 1500) }
    rec.onresult = (e: any) => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) { final += t+' '; spoken = true } else { interim = t; spoken = true } }; setLiveTranscript(final+interim); resetSil() }
    rec.onend = () => { silenceTimer.current && clearTimeout(silenceTimer.current); setListening(false); const t = final.trim(); if (t) sendMessage(t); setLiveTranscript('') }
    rec.onerror = () => { setListening(false); setLiveTranscript('') }
    recognitionRef.current = rec; rec.start(); setListening(true)
  }

  function stopListening() { silenceTimer.current && clearTimeout(silenceTimer.current); recognitionRef.current?.stop(); setListening(false) }

  function toggleConversation() {
    if (conversationMode) { setConversationMode(false); stopListening(); audioRef.current?.pause(); setSpeaking(false) }
    else { setConversationMode(true); startListening() }
  }

  function toggleMute() {
    if (muted) { setMuted(false); if (conversationMode && !speaking && !loading) setTimeout(() => startListening(), 200) }
    else { setMuted(true); if (listening) { recognitionRef.current?.stop(); setListening(false); setLiveTranscript('') } }
  }

  // ── File handling ──
  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return
    const f = files[0]
    const isImage = f.type.startsWith('image/')

    if (isImage) {
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        const b64 = dataUrl.split(',')[1]
        const mediaType = f.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        setFileReady(false)
        const userMsg: Message = { role: 'user', content: `[Image: ${f.name}] Analyse et décris cette image.` }
        const history = [...messagesRef.current, userMsg]
        setMessages(history); setLoading(true)
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, image: { data: b64, mediaType } })
        }).then(async r => {
          if (!r.ok) throw new Error(`chat http ${r.status}`)
          return r.json()
        }).then(data => {
          const lolaMsg: Message = { role: 'assistant', content: data.text }
          setMessages([...history, lolaMsg])
          setLoading(false)
          playTTS(data.text)
        }).catch(() => { setLoading(false); setErrorBanner("Lola n'a pas pu analyser l'image.") })
      }
      reader.readAsDataURL(f)
    } else {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        setFileReady(false)
        sendMessage(`[Document: ${f.name}]\n\n${content.slice(0, 3000)}\n\nRésume et analyse ce document.`)
      }
      reader.readAsText(f)
    }
  }, [sendMessage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles, noClick: true, noKeyboard: true,
  })

  // ── Responsive ──
  const isMobile = winW < 768
  const statusColor = listening ? '#e74c3c' : speaking ? '#2ecc71' : loading ? '#9b59b6' : '#c9a020'
  const statusLabel = conversationMode
    ? (muted ? 'SILENCIEUX' : listening ? 'ÉCOUTE' : speaking ? 'PARLE' : loading ? 'RÉFLÉCHIT' : 'EN LIGNE')
    : 'LOLA'

  return (
    <div {...getRootProps()} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#fdf6e8', touchAction: 'none' }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,150,60,0.08)', border: '3px dashed rgba(0,150,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 24, color: 'rgba(0,120,50,0.8)', fontFamily: 'monospace', letterSpacing: 3 }}>DÉPOSER POUR LOLA</div>
        </div>
      )}

      {errorBanner && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: 'rgba(180,50,50,0.92)', color: 'white', padding: '8px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'monospace', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          ⚠ {errorBanner}
        </div>
      )}

      {isMobile ? (
        <MobileLayout
          winW={winW} winH={winH}
          speaking={speaking} listening={listening} loading={loading} lolaState={lolaState}
          triggerGesture={triggerGesture} visemeTimeline={visemeTimeline} audioRef={audioRef}
          messages={messages} input={input} setInput={setInput}
          liveTranscript={liveTranscript}
          onSend={() => sendMessage(input)}
          onToggleConversation={toggleConversation} conversationMode={conversationMode}
          onToggleMute={toggleMute} muted={muted}
          onFileClick={() => fileInputRef.current?.click()}
          onCameraClick={() => setCameraOpen(true)}
          fileReady={fileReady}
          statusColor={statusColor} statusLabel={statusLabel}
          chatEndRef={chatEndRef}
        />
      ) : (
        <PCLayout
          winW={winW} winH={winH}
          speaking={speaking} listening={listening} loading={loading} lolaState={lolaState}
          triggerGesture={triggerGesture} visemeTimeline={visemeTimeline} audioRef={audioRef}
          messages={messages} input={input} setInput={setInput}
          liveTranscript={liveTranscript}
          onSend={() => sendMessage(input)}
          onToggleConversation={toggleConversation} conversationMode={conversationMode}
          onToggleMute={toggleMute} muted={muted}
          onFileClick={() => fileInputRef.current?.click()}
          onCameraClick={() => setCameraOpen(true)}
          fileReady={fileReady}
          statusColor={statusColor} statusLabel={statusLabel}
          chatEndRef={chatEndRef}
        />
      )}

      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)) }} />

      {cameraOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#f0e0b0', fontFamily: 'monospace', fontSize: 14 }}>📷 Caméra — à implémenter (Phase 2)</div>
          <button onClick={() => setCameraOpen(false)} style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Fermer</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(120,90,30,0.2); }
        input::placeholder { color: rgba(90,70,30,0.4); }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   LAYOUT PC — Lola seule, grande et centrée, fond clair
════════════════════════════════════════════════════ */
function PCLayout({ winW, winH, speaking, listening, loading, lolaState, triggerGesture, visemeTimeline, audioRef,
  messages, input, setInput, liveTranscript, onSend, onToggleConversation,
  conversationMode, onToggleMute, muted, onFileClick, onCameraClick, fileReady,
  statusColor, statusLabel, chatEndRef }: any) {

  const sidebarW = 64
  const stageW = winW - sidebarW

  return (
    <div style={{ display: 'flex', width: winW, height: winH }}>

      {/* ── SIDEBAR BOUTONS ── */}
      <div style={{
        width: sidebarW, height: winH, flexShrink: 0,
        background: 'rgba(30,22,8,0.92)', borderRight: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 20, paddingBottom: 20, gap: 12, zIndex: 20,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none', marginBottom: 8 }} />

        <SideBtn
          icon={conversationMode ? (muted ? '🔇' : listening ? '⏺' : '⏹') : '🎙'}
          label={conversationMode ? (muted ? 'Mute' : 'Conv.') : 'Voix'}
          active={conversationMode}
          color={conversationMode ? (muted ? '#e74c3c' : '#2ecc71') : '#f0d080'}
          onClick={onToggleConversation}
        />
        {conversationMode && (
          <SideBtn icon={muted ? '🔇' : '🔊'} label={muted ? 'Mute' : 'Son'} active={muted} color={muted ? '#e74c3c' : '#88d888'} onClick={onToggleMute} />
        )}

        <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

        <SideBtn icon="📁" label="Fichier" active={fileReady} color={fileReady ? '#2ecc71' : '#f0d080'} onClick={onFileClick} badge={fileReady} />
        <SideBtn icon="📷" label="Caméra" active={false} color="#f0d080" onClick={onCameraClick} />
      </div>

      {/* ── SCÈNE — Lola seule, grande, centrée ── */}
      <div style={{ width: stageW, height: winH, position: 'relative', overflow: 'hidden' }}>
        <LolaScene width={stageW} height={winH} speaking={speaking} listening={listening} loading={loading} lolaState={lolaState} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <Lola3D width={Math.round(winH * 0.62)} height={winH} lolaState={lolaState} speaking={speaking} listening={listening} loading={loading} triggerGesture={triggerGesture} visemeTimeline={visemeTimeline} audioRef={audioRef} />
        </div>

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(180,140,60,0.25)', borderRadius: 20,
          padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, color: 'rgba(70,50,20,0.65)', fontFamily: 'monospace', letterSpacing: 2 }}>{statusLabel}</span>
        </div>

        {liveTranscript && (
          <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(180,140,60,0.2)', borderRadius: 12, padding: '6px 14px', zIndex: 10, maxWidth: '60%' }}>
            <span style={{ fontSize: 12, color: 'rgba(70,50,20,0.8)', fontStyle: 'italic' }}>"{liveTranscript}…"</span>
          </div>
        )}

        {/* Bulle de chat compacte, flottante en bas */}
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          width: Math.min(560, stageW - 60), height: 160,
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(180,140,60,0.25)', borderRadius: 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 15,
          boxShadow: '0 8px 30px rgba(120,90,30,0.12)',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && (
              <div style={{ color: 'rgba(90,70,30,0.4)', fontSize: 12, textAlign: 'center', marginTop: 12, fontFamily: 'monospace' }}>
                Dis bonjour à Lola…
              </div>
            )}
            {messages.slice(-4).map((m: Message, i: number) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '78%', padding: '6px 11px',
                borderRadius: m.role === 'user' ? '13px 13px 3px 13px' : '3px 13px 13px 13px',
                background: m.role === 'user' ? 'rgba(180,140,40,0.15)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${m.role === 'user' ? 'rgba(180,140,40,0.25)' : 'rgba(0,0,0,0.06)'}`,
                color: '#4a3a15',
                fontSize: 12, lineHeight: 1.45, wordBreak: 'break-word',
              }}>{m.content}</div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: 'rgba(90,70,30,0.5)', fontSize: 11, fontStyle: 'italic' }}>Lola réfléchit…</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '6px 10px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={input} onChange={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
              placeholder="Écris à Lola… (ou utilise le micro)"
              style={{ flex: 1, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: '8px 14px', color: '#4a3a15', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={onSend} disabled={!input.trim() || loading}
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: input.trim() ? 'rgba(180,140,40,0.25)' : 'rgba(0,0,0,0.04)', color: input.trim() ? '#6a5220' : '#a89870', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   LAYOUT MOBILE — Lola seule, grande, fond clair
════════════════════════════════════════════════════ */
function MobileLayout({ winW, winH, speaking, listening, loading, lolaState, triggerGesture, visemeTimeline, audioRef,
  messages, input, setInput, liveTranscript, onSend, onToggleConversation, conversationMode,
  onToggleMute, muted, onFileClick, onCameraClick, fileReady,
  statusColor, statusLabel, chatEndRef }: any) {

  const btnBarH = 48
  const chatH   = Math.round(winH * 0.17)
  const stageH  = winH - chatH - btnBarH

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: winW, height: winH, overflow: 'hidden' }}>

      {/* SCÈNE — Lola seule, grande */}
      <div style={{ height: stageH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <LolaScene width={winW} height={stageH} speaking={speaking} listening={listening} loading={loading} lolaState={lolaState} />

        <div style={{
          position: 'absolute', left: '50%', bottom: 0,
          transform: 'translateX(-50%)',
          width: Math.round(stageH * 0.62),
          height: stageH,
          pointerEvents: 'none',
        }}>
          <Lola3D width={Math.round(stageH * 0.62)} height={stageH} lolaState={lolaState} speaking={speaking} listening={listening} loading={loading} triggerGesture={triggerGesture} visemeTimeline={visemeTimeline} audioRef={audioRef} />
        </div>

        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, zIndex: 10, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '3px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 8, color: 'rgba(70,50,20,0.6)', fontFamily: 'monospace', letterSpacing: 2 }}>{statusLabel}</span>
        </div>

        {liveTranscript && (
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '4px 10px', zIndex: 10, maxWidth: '70%' }}>
            <span style={{ fontSize: 10, color: 'rgba(70,50,20,0.8)', fontStyle: 'italic' }}>"{liveTranscript}…"</span>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16, zIndex: 10 }}>
          <MobileIconBtn icon="📁" active={fileReady} onClick={onFileClick} badge={fileReady} />
          <MobileIconBtn icon="📷" active={false} onClick={onCameraClick} />
        </div>
      </div>

      {/* ZONE CONVERSATION */}
      <div style={{ height: chatH, background: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {messages.length === 0 && !liveTranscript && (
            <div style={{ color: 'rgba(90,70,30,0.4)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>Parle à Lola…</div>
          )}
          {messages.slice(-3).map((m: Message, i: number) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '5px 10px', borderRadius: m.role === 'user' ? '11px 11px 3px 11px' : '3px 11px 11px 11px', background: m.role === 'user' ? 'rgba(180,140,40,0.15)' : 'rgba(0,0,0,0.04)', color: '#4a3a15', fontSize: 11, lineHeight: 1.4, wordBreak: 'break-word' }}>{m.content}</div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', color: 'rgba(90,70,30,0.5)', fontSize: 10, fontStyle: 'italic' }}>Lola réfléchit…</div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: '5px 10px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); onSend() } }}
            placeholder="Écris à Lola…"
            style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '7px 12px', color: '#4a3a15', fontSize: 12, outline: 'none' }} />
          <button onClick={onSend} disabled={!input.trim() || loading}
            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(180,140,40,0.2)', color: '#6a5220', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
        </div>
      </div>

      {/* BOUTONS BAS */}
      <div style={{ height: btnBarH, background: 'rgba(30,22,8,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        <MobilePrimaryBtn
          icon={conversationMode ? (muted ? '🔇' : listening ? '⏺' : '⏹') : '🎙'}
          label={conversationMode ? (muted ? 'Mute' : 'Actif') : 'Démarrer'}
          active={conversationMode} color={conversationMode ? '#2ecc71' : '#f0d080'}
          onClick={onToggleConversation}
        />
        {conversationMode && (
          <MobilePrimaryBtn icon={muted ? '🔊' : '🔇'} label={muted ? 'Écouter' : 'Mute'} active={muted} color={muted ? '#e74c3c' : '#88d888'} onClick={onToggleMute} />
        )}
      </div>
    </div>
  )
}

/* ── Composants UI ── */
function SideBtn({ icon, label, active, color, onClick, badge }: any) {
  return (
    <button onClick={onClick} title={label} style={{
      width: 44, height: 44, borderRadius: 12,
      border: `1px solid ${active ? color+'44' : 'rgba(255,255,255,0.1)'}`,
      background: active ? `${color}22` : 'transparent',
      color: active ? color : 'rgba(240,220,180,0.5)',
      fontSize: 18, cursor: 'pointer', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .2s',
    }}>
      {icon}
      {badge && <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#2ecc71', animation: 'blink 1s infinite' }} />}
    </button>
  )
}

function MobileIconBtn({ icon, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 42, borderRadius: '50%',
      border: `1px solid rgba(180,140,60,${active ? '0.3' : '0.15'})`,
      background: active ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.55)',
      color: 'rgba(90,70,30,0.6)', fontSize: 18, cursor: 'pointer',
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      {icon}
      {badge && <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#2ecc71', animation: 'blink 1s infinite' }} />}
    </button>
  )
}

function MobilePrimaryBtn({ icon, label, active, color, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: active ? `${color}22` : 'rgba(255,255,255,0.06)',
      border: `1px solid ${active ? color+'44' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 12, padding: '6px 18px', cursor: 'pointer',
      color: active ? color : 'rgba(240,220,180,0.55)',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>{label}</span>
    </button>
  )
}
