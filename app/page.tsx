'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import LolaAvatar from '@/components/LolaAvatar'
import BatcaveScene from '@/components/BatcaveScene'
import PortalEntry from '@/components/PortalEntry'
import CSSParticles from '@/components/CSSParticles'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesRef = useRef<Message[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Blink timer
  useEffect(() => {
    function doBlink() {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
    }
    const interval = setInterval(() => {
      if (Math.random() > 0.3) doBlink()
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Breathing cycle
  useEffect(() => {
    let frame: number
    let start = Date.now()
    function animate() {
      const elapsed = (Date.now() - start) / 4000 // 4s cycle
      setBreathPhase(elapsed % 1)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

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

  /* ── TTS with lip-sync ── */
  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res  = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }

      const audio = new Audio(url)
      audioRef.current = audio

      // Start lip-sync analysis
      audio.onplay = () => startLipSync(audio)
      audio.onended = () => {
        setSpeaking(false)
        setExpression('neutral')
        setMouthState('closed')
        stopLipSync()
        audioRef.current = null
      }
      audio.onerror = () => {
        setSpeaking(false)
        setExpression('neutral')
        stopLipSync()
        audioRef.current = null
      }
      audio.play()
    } catch {
      setSpeaking(false)
      setExpression('neutral')
    }
  }

  function startLipSync(audio: HTMLAudioElement) {
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      analyserRef.current = analyser

      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function analyze() {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 4; i < 40 && i < dataArray.length; i++) sum += dataArray[i]
        const avg = sum / 36

        let state: MouthState = 'closed'
        if (avg > 50) state = 'open'
        else if (avg > 15) state = 'half'

        setMouthState(state)
        animFrameRef.current = requestAnimationFrame(analyze)
      }
      analyze()
    } catch {
      // Fallback animation
      let t = 0
      const interval = setInterval(() => {
        t++
        const states: MouthState[] = ['closed', 'half', 'open', 'half']
        setMouthState(states[t % 4])
      }, 120)
      animFrameRef.current = interval as unknown as number
    }
  }

  function stopLipSync() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    analyserRef.current = null
    setMouthState('closed')
  }

  /* ── SPEECH RECOGNITION with auto-silence ── */
  function toggleListening() {
    if (listening) stopListening()
    else startListening()
  }

  function startListening() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false); stopLipSync() }

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
          <BatcaveScene width={Math.min(typeof window !== 'undefined' ? window.innerWidth : 400, 500)} audioActive={speaking} />
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
              {listening ? 'Je t\u2019écoute…' : speaking ? 'Lola parle…' : loading ? 'Réflexion…' : 'Lola'}
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
        <button onClick={toggleListening}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: listening ? '#e74c3c' : 'linear-gradient(135deg,#C9A84C,#E8C96A)',
            color: listening ? '#fff' : '#0d1530', fontSize: 22, flexShrink: 0,
            boxShadow: listening ? '0 0 20px rgba(231,76,60,.5)' : '0 0 15px rgba(201,168,76,.3)',
            transition: 'all .2s',
          }}>
          {listening ? '⏹' : '🎙'}
        </button>

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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes lolaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        input::placeholder { color: #8A9BB5; }
        button:active { transform: scale(0.95); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
