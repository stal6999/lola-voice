'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import LolaHome from '@/components/LolaHome'
import MSDosTerminal from '@/components/MSDosTerminal'
import { noise1d } from '@/hooks/useOrganicMotion'

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
  const [microExp, setMicroExp] = useState<'none'|'brow-raise'|'slight-smile'|'glance-screen'>('none')
  const [conversationMode, setConversationMode] = useState(false)
  const [muted, setMuted]                   = useState(false)
  const [input, setInput]                   = useState('')
  const [showChat, setShowChat]             = useState(false)
  const [screenContent, setScreenContent]   = useState<string | null>(null)
  const [showDocDrop, setShowDocDrop]       = useState(false)
  const [winW, setWinW] = useState(390)
  const [winH, setWinH] = useState(844)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null)
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const audioUnlocked   = useRef(false)
  const messagesRef     = useRef<Message[]>([])
  const silenceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convModeRef     = useRef(false)
  const mutedRef        = useRef(false)
  const fileRef         = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const set = () => { setWinW(window.innerWidth); setWinH(window.innerHeight) }
    set(); window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { convModeRef.current = conversationMode }, [conversationMode])
  useEffect(() => { mutedRef.current = muted }, [muted])

  // Blink naturel
  useEffect(() => {
    const blink = () => {
      setBlinking(true); setTimeout(() => setBlinking(false), 130)
      if (Math.random() < 0.18) setTimeout(() => { setBlinking(true); setTimeout(() => setBlinking(false), 110) }, 240)
    }
    const id = setInterval(() => { if (Math.random() > 0.22) blink() }, 2800 + Math.random() * 2200)
    return () => clearInterval(id)
  }, [])

  // Organic Perlin noise — tout en un rAF
  useEffect(() => {
    let frame: number
    const t0 = Date.now()
    const tick = () => {
      const t = (Date.now() - t0) / 1000
      setBreathPhase(((t / 4.5) % 1))
      setHeadTiltX(noise1d(t / 7 + 20) * 2.2 + noise1d(t / 3 + 30) * 0.8)
      setEyeShiftX(noise1d(t / 6 + 60) * 1.5 + noise1d(t / 0.4 + 40) * 0.25)
      setEyeShiftY(noise1d(t / 8 + 70) * 0.8)
      const ne = noise1d(t / 15 + 100)
      if (!speaking && !listening && !loading) {
        if (ne > 0.85) setMicroExp('brow-raise')
        else if (ne > 0.6 && ne < 0.8) setMicroExp('slight-smile')
        else if (ne < -0.8) setMicroExp('glance-screen')
        else if (Math.abs(ne) < 0.3) setMicroExp('none')
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [speaking, listening, loading])

  function unlockAudio() {
    if (audioUnlocked.current) return
    const a = document.createElement('audio'); a.setAttribute('playsinline', '')
    a.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaC5CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    a.volume = 0.01; a.play().then(() => { audioUnlocked.current = true; a.pause(); a.volume = 1 }).catch(() => {})
    audioRef.current = a
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    unlockAudio()
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messagesRef.current, userMsg]
    setMessages(history); setInput(''); setLiveTranscript(''); setLoading(true); setExpression('thinking')
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json()
      const lolaMsg: Message = { role: 'assistant', content: data.text }
      setMessages([...history, lolaMsg]); setLastResponse(data.text); setLoading(false); setExpression('smiling')
      setScreenContent(data.text); playTTS(data.text)
    } catch { setLoading(false); setExpression('neutral') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function toggleConversation() {
    if (conversationMode) { setConversationMode(false); stopListening(); if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') } }
    else { setConversationMode(true); startListening() }
  }

  function startListening() {
    unlockAudio()
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); setMouthState('closed') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Utilise Chrome ou Safari.'); return }
    const rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true
    let final = ''; let spoken = false; setExpression('listening')
    const resetSil = () => { if (silenceTimer.current) clearTimeout(silenceTimer.current); silenceTimer.current = setTimeout(() => { if (spoken && final.trim()) rec.stop() }, 1500) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) { final += t+' '; spoken = true } else { interim = t; spoken = true } }; setLiveTranscript(final+interim); resetSil() }
    rec.onend = () => { if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }; setListening(false); const t = final.trim(); if (t) sendMessage(t); else setExpression('neutral'); setLiveTranscript('') }
    rec.onerror = () => { setListening(false); setLiveTranscript(''); setExpression('neutral') }
    recognitionRef.current = rec; rec.start(); setListening(true)
  }

  function stopListening() { if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }; recognitionRef.current?.stop(); setListening(false) }

  function toggleMute() {
    if (muted) { setMuted(false); if (conversationMode && !speaking && !loading) setTimeout(() => startListening(), 200) }
    else { setMuted(true); if (listening) { recognitionRef.current?.stop(); setListening(false); setLiveTranscript('') } }
  }

  function handleFile(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = e => { const content = e.target?.result as string; setScreenContent(`📄 ${f.name}\n\n${content.slice(0, 500)}...`); sendMessage(`[Document: ${f.name}]\n\n${content.slice(0, 3000)}\n\nRésume ce document.`) }
      reader.readAsText(f)
    })
    setShowDocDrop(false)
  }

  const lolaEmotion = speaking ? 'excited' : listening ? 'listening' : loading ? 'thinking' : expression === 'smiling' ? 'happy' : 'neutral'
  const footerH = 56
  const statusH = 36

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#060310', touchAction: 'none' }}>

      {/* ── DÉCOR + LOLA style JT ── */}
      <LolaHome
        width={winW} height={winH}
        screenContent={screenContent}
        audioActive={speaking}
        lolaEmotion={lolaEmotion}
        mouthState={mouthState}
        blinking={blinking}
        expression={expression}
        breathPhase={breathPhase}
        headTiltX={headTiltX}
        eyeShiftX={eyeShiftX}
        eyeShiftY={eyeShiftY}
        microExpression={microExp}
        speaking={speaking}
        listening={listening}
        statusText={
          conversationMode
            ? (muted ? 'Micro coupé — Lola attend' : listening ? 'Je vous écoute…' : speaking ? 'Lola répond' : loading ? 'Lola réfléchit…' : 'Conversation active')
            : 'Bonjour Christophe — comment puis-je vous aider ?'
        }
        tickerMessages={[
          messages.length > 0
            ? `Dernier message : ${messages[messages.length - 1]?.content?.slice(0, 80)}…`
            : 'Lola — Assistante IA personnelle • TC Expertise & Énergie • Belgique',
        ]}
      />

      {/* ── STATUS BAR haut ── */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,6,20,0.75)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(140,210,255,0.12)', borderRadius: 20,
        padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 7, zIndex: 20,
        height: statusH,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: conversationMode ? (listening ? '#ff8888' : speaking ? '#88d888' : '#c8a870') : '#a8d8ff',
          animation: (listening || speaking) ? 'pulse 1s infinite' : 'none',
        }} />
        <span style={{ fontSize: 10, color: 'rgba(180,220,255,0.7)', fontFamily: 'monospace', letterSpacing: 1 }}>
          {conversationMode ? (muted ? 'SILENCIEUX' : listening ? 'ÉCOUTE' : speaking ? 'PARLE' : loading ? 'RÉFLÉCHIT' : 'EN LIGNE') : 'LOLA'}
        </span>
      </div>

      {/* ── BOUTONS GAUCHE (verticaux, discrets) ── */}
      <div style={{ position: 'absolute', left: 8, bottom: footerH + 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20 }}>
        <button onClick={toggleConversation} style={circleBtn(conversationMode ? '#ff8888' : '#a8e0ff', conversationMode)}>
          {conversationMode ? '⏹' : '🎙'}
        </button>
        {conversationMode && (
          <button onClick={toggleMute} style={circleBtn(muted ? '#ff8888' : '#88d888', muted)}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      {/* ── BOUTONS DROITE (verticaux, discrets) ── */}
      <div style={{ position: 'absolute', right: 8, bottom: footerH + 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20 }}>
        <button onClick={() => setShowDocDrop(!showDocDrop)} style={circleBtn('#a8d8ff', showDocDrop)}>📁</button>
        <button onClick={() => setShowChat(!showChat)} style={circleBtn('#c8a870', showChat)}>💬</button>
      </div>

      {/* ── TRANSCRIPT LIVE — discret, en bas au-dessus de l'input ── */}
      {(liveTranscript || (lastResponse && !showChat)) && (
        <div style={{
          position: 'absolute', bottom: footerH + 4, left: 56, right: 56,
          background: 'rgba(8,5,18,0.82)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(140,210,255,0.1)', borderRadius: 12,
          padding: '7px 12px', maxHeight: 60, overflow: 'hidden', zIndex: 15,
        }}>
          <div style={{ fontSize: 11, color: liveTranscript ? '#a8d8ff' : '#c8d8f0', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontStyle: liveTranscript ? 'italic' : 'normal' }}>
            {loading ? '…' : liveTranscript ? `"${liveTranscript}…"` : lastResponse}
          </div>
        </div>
      )}

      {/* ── CHAT FULLSCREEN ── */}
      {showChat && (
        <div style={{ position: 'absolute', inset: `${statusH+14}px 0 ${footerH}px 0`, background: 'rgba(6,3,16,0.97)', backdropFilter: 'blur(20px)', zIndex: 30, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(140,210,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#a8d8ff' }}>Conversation</span>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(140,180,220,0.3)', fontSize: 12, marginTop: 40 }}>Commence la conversation…</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '9px 13px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                background: m.role === 'user' ? 'rgba(168,216,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${m.role === 'user' ? 'rgba(140,210,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
                color: m.role === 'user' ? '#a8d8ff' : '#ddeeff', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                {m.content}
              </div>
            ))}
            {liveTranscript && <div style={{ alignSelf: 'flex-end', maxWidth: '82%', padding: '9px 13px', borderRadius: '16px 16px 4px 16px', background: 'rgba(168,216,255,0.07)', border: '1px dashed rgba(140,210,255,0.2)', color: '#a8d8ff', fontSize: 13, fontStyle: 'italic' }}>{liveTranscript}…</div>}
          </div>
        </div>
      )}

      {/* ── DOC DROP ── */}
      {showDocDrop && (
        <div style={{ position: 'absolute', right: 56, bottom: footerH + 80, width: 200, background: 'rgba(6,3,16,0.96)', backdropFilter: 'blur(16px)', border: '1px solid rgba(140,210,255,0.18)', borderRadius: 14, padding: 14, zIndex: 30 }}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#a8d8ff' }}>📁 Envoyer à Lola</span>
            <button onClick={() => setShowDocDrop(false)} style={{ background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer' }}>✕</button>
          </div>
          <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed rgba(140,210,255,0.22)', borderRadius: 10, padding: '18px 10px', textAlign: 'center', cursor: 'pointer', background: 'rgba(140,210,255,0.02)' }}>
            <div style={{ fontSize: 26 }}>📎</div>
            <div style={{ fontSize: 11, color: '#a8d8ff', marginTop: 6 }}>Dépose ou clique</div>
            <div style={{ fontSize: 9, color: '#8A9BB5', marginTop: 3 }}>TXT, CSV, MD...</div>
          </div>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFile(e.target.files)} />
        </div>
      )}

      {/* ── BARRE INPUT ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: footerH,
        background: 'rgba(6,3,16,0.92)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(140,210,255,0.07)',
        padding: '8px 10px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 20,
      }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
          placeholder="Écris à Lola…" disabled={listening}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(140,210,255,0.08)', borderRadius: 20, padding: '9px 14px', color: '#ddeeff', fontSize: 14, outline: 'none', fontFamily: 'inherit', opacity: listening ? 0.4 : 1 }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading || listening}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: input.trim() ? 'rgba(140,210,255,0.15)' : 'rgba(255,255,255,0.04)', color: input.trim() ? '#a8d8ff' : '#8A9BB5', fontSize: 16 }}>
          ➤
        </button>
      </div>

      {/* ── TERMINAL MS-DOS ── */}
      <MSDosTerminal visible={loading} processing={loading} taskName="Traitement" />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes particleFloat { 0%{transform:translateY(0) scale(.3);opacity:0} 15%{opacity:1} 50%{transform:translateY(-80px) scale(1)} 85%{opacity:.4} 100%{transform:translateY(-160px) scale(.1);opacity:0} }
        @keyframes dataFlow { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(120px);opacity:0} }
        input::placeholder { color: rgba(140,180,220,0.35); }
        button:active { transform: scale(0.9); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(140,210,255,0.12); }
      `}</style>
    </div>
  )
}

function circleBtn(color: string, active: boolean): React.CSSProperties {
  return {
    width: 40, height: 40, borderRadius: '50%',
    border: `1px solid ${active ? color+'66' : 'rgba(140,210,255,0.08)'}`,
    background: active ? `${color}18` : 'rgba(6,3,16,0.75)',
    color: active ? color : 'rgba(140,180,220,0.45)',
    fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    boxShadow: active ? `0 0 12px ${color}33` : '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'all .2s',
  }
}
