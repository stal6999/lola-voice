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
import { noise1d } from '@/hooks/useOrganicMotion'

type Message = { role: 'user' | 'assistant'; content: string }
type MouthState = 'closed' | 'half' | 'open'
type Expression = 'neutral' | 'listening' | 'thinking' | 'smiling'
type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'loading' | 'alert' | 'happy'

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
  const [lastResponse, setLastResponse]     = useState('')
  const [screenContent, setScreenContent]   = useState<string | null>(null)

  // ── UI state ──
  const [showChat, setShowChat]   = useState(false)
  const [winW, setWinW]           = useState(1280)
  const [winH, setWinH]           = useState(800)
  const [fileReady, setFileReady] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  // ── Avatar state ──
  const [mouthState, setMouthState]   = useState<MouthState>('closed')
  const [blinking, setBlinking]       = useState(false)
  const [expression, setExpression]   = useState<Expression>('neutral')
  const [breathPhase, setBreathPhase] = useState(0)
  const [headTiltX, setHeadTiltX]     = useState(0)
  const [eyeShiftX, setEyeShiftX]     = useState(0)
  const [eyeShiftY, setEyeShiftY]     = useState(0)
  const [microExp, setMicroExp] = useState<'none'|'brow-raise'|'slight-smile'|'glance-screen'>('none')
  const [lolaState, setLolaState]     = useState<LolaState>('idle')

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

  // ── Unlock audio anticipé dès premier touch ──
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

  // ── Scroll chat ──
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Lola state → lolaState ──
  useEffect(() => {
    if (listening) setLolaState('listening')
    else if (loading) setLolaState('thinking')
    else if (speaking) setLolaState('speaking')
    else setLolaState('idle')
  }, [listening, loading, speaking])

  // ── Blink ──
  useEffect(() => {
    const blink = () => {
      setBlinking(true); setTimeout(() => setBlinking(false), 130)
      if (Math.random() < 0.18) setTimeout(() => { setBlinking(true); setTimeout(() => setBlinking(false), 110) }, 240)
    }
    const id = setInterval(() => { if (Math.random() > 0.22) blink() }, 2800 + Math.random() * 2200)
    return () => clearInterval(id)
  }, [])

  // ── Organic motion ──
  useEffect(() => {
    let frame: number
    const t0 = Date.now()
    const tick = () => {
      const t = (Date.now() - t0) / 1000
      setBreathPhase(((t / 4.5) % 1))
      setHeadTiltX(noise1d(t / 7 + 20) * 2.2 + noise1d(t / 3 + 30) * 0.8)
      setEyeShiftX(noise1d(t / 6 + 60) * 1.5)
      setEyeShiftY(noise1d(t / 8 + 70) * 0.8)
      const ne = noise1d(t / 15 + 100)
      if (!speaking && !listening && !loading) {
        if (ne > 0.85) setMicroExp('brow-raise')
        else if (ne > 0.6) setMicroExp('slight-smile')
        else if (ne < -0.8) setMicroExp('glance-screen')
        else if (Math.abs(ne) < 0.3) setMicroExp('none')
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [speaking, listening, loading])

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
    setLoading(true); setExpression('thinking')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })
      // Lecture SSE streaming
      const reader = res.body!.getReader()
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
              if (data.done) {
                // Réponse complète reçue
                const lolaMsg: Message = { role: 'assistant', content: fullText }
                setMessages([...history, lolaMsg])
                setLastResponse(fullText)
                setLoading(false); setExpression('smiling')
                setScreenContent(fullText)
                playTTS(fullText)
              } else {
                fullText += data.text
                // Afficher en temps réel dans la zone conversation
                setLastResponse(fullText)
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch { setLoading(false); setExpression('neutral') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── TTS ──
  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      if (!audioRef.current) { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); document.body.appendChild(a); audioRef.current = a }
      const audio = audioRef.current; audio.pause(); audio.src = url; audio.volume = 1
      let lip: ReturnType<typeof setInterval> | null = null
      audio.onplay = () => { let f = 0; lip = setInterval(() => { f++; setMouthState((['closed','half','open','half'] as MouthState[])[f%4]) }, 115) }
      audio.onended = () => { if (lip) clearInterval(lip); setSpeaking(false); setExpression('neutral'); setMouthState('closed'); if (convModeRef.current && !mutedRef.current) setTimeout(() => startListening(), 350) }
      audio.onerror = () => { if (lip) clearInterval(lip); setSpeaking(false); setExpression('neutral'); setMouthState('closed') }
      audio.play()
    } catch { setSpeaking(false); setExpression('neutral') }
  }

  // ── Voice ──
  function startListening() {
    unlockAudio()
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true
    let final = ''; let spoken = false; setExpression('listening')
    const resetSil = () => { if (silenceTimer.current) clearTimeout(silenceTimer.current); silenceTimer.current = setTimeout(() => { if (spoken && final.trim()) rec.stop() }, 1500) }
    rec.onresult = (e: any) => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) { final += t+' '; spoken = true } else { interim = t; spoken = true } }; setLiveTranscript(final+interim); resetSil() }
    rec.onend = () => { silenceTimer.current && clearTimeout(silenceTimer.current); setListening(false); const t = final.trim(); if (t) sendMessage(t); else setExpression('neutral'); setLiveTranscript('') }
    rec.onerror = () => { setListening(false); setLiveTranscript(''); setExpression('neutral') }
    recognitionRef.current = rec; rec.start(); setListening(true)
  }

  function stopListening() { silenceTimer.current && clearTimeout(silenceTimer.current); recognitionRef.current?.stop(); setListening(false) }

  function toggleConversation() {
    if (conversationMode) { setConversationMode(false); stopListening(); audioRef.current?.pause(); setSpeaking(false); setMouthState('closed') }
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
      // Images → base64 pour Claude Vision
      const reader = new FileReader()
      reader.onload = e => {
        const b64 = (e.target?.result as string).split(',')[1]
        const mediaType = f.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        setFileReady(false)
        // Envoyer comme message vision
        const userMsg: Message = { role: 'user', content: `[Image: ${f.name}] Analyse et décris cette image.` }
        const history = [...messagesRef.current, userMsg]
        setMessages(history); setLoading(true); setExpression('thinking')
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, image: { data: b64, mediaType } })
        }).then(r => r.json()).then(data => {
          const lolaMsg: Message = { role: 'assistant', content: data.text }
          setMessages([...history, lolaMsg]); setLastResponse(data.text)
          setLoading(false); setExpression('smiling')
          setScreenContent(data.text)
          playTTS(data.text)
        }).catch(() => { setLoading(false); setExpression('neutral') })
      }
      reader.readAsDataURL(f)
    } else {
      // Fichiers texte → lecture texte
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
  const statusColor = listening ? '#e74c3c' : speaking ? '#2ecc71' : loading ? '#9b59b6' : '#27ae60'
  const statusLabel = conversationMode
    ? (muted ? 'SILENCIEUX' : listening ? 'ÉCOUTE' : speaking ? 'PARLE' : loading ? 'RÉFLÉCHIT' : 'EN LIGNE')
    : 'LOLA'

  return (
    <div {...getRootProps()} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0e0c06', touchAction: 'none' }}>
      <input {...getInputProps()} />

      {/* ── DRAG OVERLAY ── */}
      {isDragActive && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,200,80,0.08)', border: '3px dashed rgba(0,200,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 24, color: 'rgba(0,200,80,0.8)', fontFamily: 'monospace', letterSpacing: 3 }}>DÉPOSER POUR LOLA</div>
        </div>
      )}

      {isMobile ? (
        /* ════════════════════ LAYOUT MOBILE ════════════════════ */
        <MobileLayout
          winW={winW} winH={winH}
          screenContent={screenContent} speaking={speaking} listening={listening}
          loading={loading} lolaState={lolaState}
          mouthState={mouthState} blinking={blinking} expression={expression}
          breathPhase={breathPhase} headTiltX={headTiltX} eyeShiftX={eyeShiftX} eyeShiftY={eyeShiftY}
          microExpression={microExp}
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
        /* ════════════════════ LAYOUT PC ════════════════════ */
        <PCLayout
          winW={winW} winH={winH}
          screenContent={screenContent} speaking={speaking} listening={listening}
          loading={loading} lolaState={lolaState}
          mouthState={mouthState} blinking={blinking} expression={expression}
          breathPhase={breathPhase} headTiltX={headTiltX} eyeShiftX={eyeShiftX} eyeShiftY={eyeShiftY}
          microExpression={microExp}
          messages={messages} input={input} setInput={setInput}
          liveTranscript={liveTranscript} lastResponse={lastResponse}
          onSend={() => sendMessage(input)}
          onToggleConversation={toggleConversation} conversationMode={conversationMode}
          onToggleMute={toggleMute} muted={muted}
          onFileClick={() => fileInputRef.current?.click()}
          onCameraClick={() => setCameraOpen(true)}
          fileReady={fileReady}
          statusColor={statusColor} statusLabel={statusLabel}
          showChat={showChat} setShowChat={setShowChat}
          chatEndRef={chatEndRef}
        />
      )}

      {/* ── FILE INPUT CACHÉ ── */}
      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)) }} />

      {/* ── CAMÉRA (à implémenter) ── */}
      {cameraOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#a8d8ff', fontFamily: 'monospace', fontSize: 14 }}>📷 Caméra — à implémenter (Phase 2)</div>
          <button onClick={() => setCameraOpen(false)} style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Fermer</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(140,210,255,0.15); }
        input::placeholder { color: rgba(140,180,220,0.35); }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   LAYOUT PC
════════════════════════════════════════════════════ */
function PCLayout({ winW, winH, screenContent, speaking, listening, loading, lolaState,
  mouthState, blinking, expression, breathPhase, headTiltX, eyeShiftX, eyeShiftY, microExpression,
  messages, input, setInput, liveTranscript, lastResponse, onSend, onToggleConversation,
  conversationMode, onToggleMute, muted, onFileClick, onCameraClick, fileReady,
  statusColor, statusLabel, showChat, setShowChat, chatEndRef }: any) {

  const sidebarW = 64
  const chatH = 220
  const sceneW = winW - sidebarW
  const sceneH = winH - chatH

  return (
    <div style={{ display: 'flex', width: winW, height: winH }}>

      {/* ── SIDEBAR GAUCHE ── */}
      <div style={{
        width: sidebarW, height: winH, flexShrink: 0,
        background: 'rgba(6,4,2,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 20, paddingBottom: 20, gap: 12, zIndex: 20,
      }}>
        {/* Status dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none', marginBottom: 8 }} />

        {/* Bouton Voix */}
        <SideBtn
          icon={conversationMode ? (muted ? '🔇' : listening ? '⏺' : '⏹') : '🎙'}
          label={conversationMode ? (muted ? 'Mute' : 'Conv.') : 'Voix'}
          active={conversationMode}
          color={conversationMode ? (muted ? '#e74c3c' : '#2ecc71') : '#a8d8ff'}
          onClick={onToggleConversation}
        />
        {conversationMode && (
          <SideBtn icon={muted ? '🔇' : '🔊'} label={muted ? 'Mute' : 'Son'} active={muted} color={muted ? '#e74c3c' : '#88d888'} onClick={onToggleMute} />
        )}

        {/* Séparateur */}
        <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

        {/* Bouton Fichier */}
        <SideBtn
          icon="📁" label="Fichier"
          active={fileReady} color={fileReady ? '#2ecc71' : '#a8d8ff'}
          onClick={onFileClick}
          badge={fileReady}
        />

        {/* Bouton Caméra */}
        <SideBtn icon="📷" label="Caméra" active={false} color="#c8a870" onClick={onCameraClick} />

        {/* Séparateur */}
        <div style={{ flex: 1 }} />

        {/* Bouton Chat */}
        <SideBtn icon="💬" label="Chat" active={showChat} color="#c8a870" onClick={() => setShowChat(!showChat)} />
      </div>

      {/* ── ZONE PRINCIPALE DROITE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* SCÈNE — décor + Lola 3D */}
        <div style={{ width: sceneW, height: sceneH, position: 'relative', overflow: 'hidden' }}>
          {/* Décor SVG en fond */}
          <LolaScene
            width={sceneW} height={sceneH}
            screenContent={screenContent}
            speaking={speaking} listening={listening} loading={loading}
            lolaState={lolaState}
            mouthState={mouthState} blinking={blinking} expression={expression}
            breathPhase={breathPhase} headTiltX={headTiltX}
            eyeShiftX={eyeShiftX} eyeShiftY={eyeShiftY}
            microExpression={microExpression}
          />
          {/* Lola 3D par-dessus, côté droit */}
          <div style={{
            position: 'absolute',
            right: 0, bottom: 0,
            width: Math.round(sceneW * 0.42),
            height: sceneH,
            pointerEvents: 'none',
          }}>
            <Lola3D
              width={Math.round(sceneW * 0.42)}
              height={sceneH}
              lolaState={lolaState}
              speaking={speaking}
              listening={listening}
              loading={loading}
              audioElement={null}
            />
          </div>

          {/* Status bar flottante en haut */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(6,4,2,0.82)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
            padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontSize: 10, color: 'rgba(200,220,240,0.6)', fontFamily: 'monospace', letterSpacing: 2 }}>{statusLabel}</span>
          </div>

          {/* Transcript live */}
          {liveTranscript && (
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(6,4,2,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(140,210,255,0.1)', borderRadius: 12, padding: '6px 14px', maxWidth: sceneW * 0.7, zIndex: 10 }}>
              <span style={{ fontSize: 12, color: '#a8d8ff', fontStyle: 'italic' }}>"{liveTranscript}…"</span>
            </div>
          )}
        </div>

        {/* ZONE CONVERSATION BAS */}
        <div style={{ height: chatH, background: 'rgba(4,3,1,0.97)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && !lastResponse && (
              <div style={{ color: 'rgba(140,180,220,0.25)', fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: 'monospace' }}>
                Dis bonjour à Lola…
              </div>
            )}
            {messages.slice(-6).map((m: Message, i: number) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%', padding: '7px 12px',
                borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
                background: m.role === 'user' ? 'rgba(168,216,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${m.role === 'user' ? 'rgba(140,210,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                color: m.role === 'user' ? '#a8d8ff' : '#ddeeff',
                fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
              }}>{m.content}</div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: 'rgba(140,180,220,0.4)', fontSize: 12, fontStyle: 'italic' }}>Lola réfléchit…</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
              placeholder="Écris à Lola… (ou utilise le micro)"
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '10px 16px', color: '#ddeeff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={onSend} disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: input.trim() ? 'rgba(140,210,255,0.15)' : 'rgba(255,255,255,0.04)', color: input.trim() ? '#a8d8ff' : '#8A9BB5', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   LAYOUT MOBILE
════════════════════════════════════════════════════ */
function MobileLayout({ winW, winH, screenContent, speaking, listening, loading, lolaState,
  mouthState, blinking, expression, breathPhase, headTiltX, eyeShiftX, eyeShiftY, microExpression,
  messages, input, setInput, liveTranscript, onSend, onToggleConversation, conversationMode,
  onToggleMute, muted, onFileClick, onCameraClick, fileReady,
  statusColor, statusLabel, chatEndRef }: any) {

  const screenH = Math.round(winH * 0.22)
  const chatH   = Math.round(winH * 0.30)
  const btnBarH = 56
  const lolaH   = winH - screenH - chatH - btnBarH

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: winW, height: winH }}>

      {/* ÉCRAN HAUT */}
      <div style={{ height: screenH, background: '#020802', borderBottom: '2px solid rgba(0,200,80,0.2)', position: 'relative', overflow: 'hidden', borderRadius: '0 0 16px 16px' }}>
        {/* Contenu écran */}
        <div style={{ position: 'absolute', inset: 0, padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#00e050', overflowY: 'auto', lineHeight: 1.6 }}>
          {screenContent || (speaking ? '▶ Lola parle…' : loading ? '◆ Lola réfléchit…' : listening ? '⏺ Écoute…' : '■ Système actif')}
        </div>
        {/* Coins déco */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 12, borderTop: '1.5px solid rgba(0,200,80,0.4)', borderLeft: '1.5px solid rgba(0,200,80,0.4)' }} />
        <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderTop: '1.5px solid rgba(0,200,80,0.4)', borderRight: '1.5px solid rgba(0,200,80,0.4)' }} />
        {/* Status */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: (listening||speaking) ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 8, color: 'rgba(0,200,80,0.5)', fontFamily: 'monospace', letterSpacing: 2 }}>{statusLabel}</span>
        </div>
      </div>

      {/* LOLA + DÉCOR CENTRE */}
      <div style={{ height: lolaH, position: 'relative', overflow: 'hidden' }}>
        <LolaScene
          width={winW} height={lolaH}
          screenContent={null} mobileMode
          speaking={speaking} listening={listening} loading={loading}
          lolaState={lolaState}
          mouthState={mouthState} blinking={blinking} expression={expression}
          breathPhase={breathPhase} headTiltX={headTiltX}
          eyeShiftX={eyeShiftX} eyeShiftY={eyeShiftY}
          microExpression={microExpression}
        />

        {/* Icônes milieu */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16, zIndex: 10 }}>
          <MobileIconBtn icon="📁" active={fileReady} onClick={onFileClick} badge={fileReady} />
          <MobileIconBtn icon="📷" active={false} onClick={onCameraClick} />
        </div>

        {/* Transcript */}
        {liveTranscript && (
          <div style={{ position: 'absolute', top: 8, left: 12, right: 12, background: 'rgba(0,0,0,0.75)', borderRadius: 10, padding: '5px 10px' }}>
            <span style={{ fontSize: 11, color: '#a8d8ff', fontStyle: 'italic' }}>"{liveTranscript}…"</span>
          </div>
        )}
      </div>

      {/* ZONE CONVERSATION */}
      <div style={{ height: chatH, background: 'rgba(4,3,1,0.98)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {messages.length === 0 && <div style={{ color: 'rgba(140,180,220,0.25)', fontSize: 11, textAlign: 'center', marginTop: 16 }}>Parle à Lola…</div>}
          {messages.slice(-4).map((m: Message, i: number) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '6px 10px', borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px', background: m.role === 'user' ? 'rgba(168,216,255,0.1)' : 'rgba(255,255,255,0.04)', color: m.role === 'user' ? '#a8d8ff' : '#ddeeff', fontSize: 12, lineHeight: 1.45, wordBreak: 'break-word' }}>{m.content}</div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', color: 'rgba(140,180,220,0.4)', fontSize: 11, fontStyle: 'italic' }}>…</div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSend() } }}
            placeholder="Écris à Lola…"
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '8px 14px', color: '#ddeeff', fontSize: 13, outline: 'none' }} />
          <button onClick={onSend} disabled={!input.trim() || loading}
            style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(140,210,255,0.12)', color: '#a8d8ff', fontSize: 14 }}>➤</button>
        </div>
      </div>

      {/* BOUTONS BAS */}
      <div style={{ height: btnBarH, background: 'rgba(3,2,1,0.98)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <MobilePrimaryBtn
          icon={conversationMode ? (muted ? '🔇' : listening ? '⏺' : '⏹') : '🎙'}
          label={conversationMode ? (muted ? 'Mute' : 'Actif') : 'Démarrer'}
          active={conversationMode} color={conversationMode ? '#2ecc71' : '#a8d8ff'}
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
      border: `1px solid ${active ? color+'44' : 'rgba(255,255,255,0.06)'}`,
      background: active ? `${color}14` : 'transparent',
      color: active ? color : 'rgba(180,200,220,0.35)',
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
      border: `1px solid rgba(255,255,255,${active ? '0.2' : '0.08'})`,
      background: active ? 'rgba(46,204,113,0.15)' : 'rgba(6,4,2,0.8)',
      color: 'rgba(180,200,220,0.5)', fontSize: 18, cursor: 'pointer',
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
      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${active ? color+'33' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12, padding: '6px 18px', cursor: 'pointer',
      color: active ? color : 'rgba(180,200,220,0.4)',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>{label}</span>
    </button>
  )
}
