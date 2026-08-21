'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function LolaPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [speaking, setSpeaking]   = useState(false)
  const [listening, setListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesRef = useRef<Message[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveTranscript])

  /* ── ENVOI MESSAGE ── */
  const sendMessage = useCallback(async (text: string, currentMessages?: Message[]) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    const history = [...(currentMessages || messagesRef.current), userMsg]
    setMessages(history)
    setInput('')
    setLiveTranscript('')
    setLoading(true)

    try {
      const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json()
      const lolaMsg: Message = { role: 'assistant', content: data.text }
      const updated = [...history, lolaMsg]
      setMessages(updated)
      setLoading(false)
      playTTS(data.text)
    } catch {
      setLoading(false)
    }
  }, [])

  /* ── TTS ── */
  async function playTTS(text: string) {
    setSpeaking(true)
    try {
      const res  = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setSpeaking(false); audioRef.current = null }
      audio.onerror = () => { setSpeaking(false); audioRef.current = null }
      audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  /* ── SPEECH RECOGNITION avec détection de silence ── */
  function toggleListening() {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function startListening() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false) }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Ton navigateur ne supporte pas la reconnaissance vocale. Utilise Chrome ou Safari.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscript = ''
    let hasSpoken = false

    function resetSilenceTimer() {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        // 1.5s de silence après avoir parlé → on envoie
        if (hasSpoken && finalTranscript.trim()) {
          recognition.stop()
        }
      }, 1500)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
          hasSpoken = true
        } else {
          interim = t
          hasSpoken = true
        }
      }
      setLiveTranscript(finalTranscript + interim)
      resetSilenceTimer()
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setListening(false)
      const text = finalTranscript.trim()
      if (text) {
        sendMessage(text)
      }
      setLiveTranscript('')
    }

    recognition.onerror = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      setListening(false)
      setLiveTranscript('')
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

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d1530', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    }}>

      {/* ── HEADER ── */}
      <header style={{
        background: '#122050', borderBottom: '1px solid rgba(201,168,76,.2)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#0d1530',
          }}>L</div>
          {(speaking || listening) && (
            <div style={{
              position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
              borderRadius: '50%', background: listening ? '#e74c3c' : '#2ecc71',
              border: '2px solid #122050', animation: 'pulse 1s infinite',
            }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#C9A84C' }}>Lola</div>
          <div style={{ fontSize: 11, color: '#8A9BB5' }}>
            {listening ? '🎙 Je t\u2019écoute…' : speaking ? '🔊 Je parle…' : loading ? '⌛ Réflexion…' : '● Disponible'}
          </div>
        </div>
      </header>

      {/* ── MESSAGES ── */}
      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        {messages.length === 0 && !listening && (
          <div style={{ textAlign: 'center', marginTop: 40, padding: '0 16px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800, color: '#C9A84C', marginBottom: 10 }}>
              Bonjour Christophe.
            </div>
            <div style={{ fontSize: 14, color: '#8A9BB5', lineHeight: 1.7 }}>
              Je suis Lola, ton assistante.<br />Appuie sur le micro et parle-moi.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {['Mon planning ?', 'Urgences Jérôme', 'Rédiger un mail'].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{
                    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)',
                    borderRadius: 16, padding: '8px 14px', color: '#E8C96A', fontSize: 12, cursor: 'pointer',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8, alignItems: 'flex-end',
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#0d1530',
              }}>L</div>
            )}
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: m.role === 'user' ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.06)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,.08)' : 'none',
              color: m.role === 'user' ? '#0d1530' : '#fff',
              fontSize: 14, lineHeight: 1.55,
              wordBreak: 'break-word' as const, textAlign: 'left' as const,
            }}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: '#1a2f6b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#C9A84C',
              }}>C</div>
            )}
          </div>
        ))}

        {/* Live transcript */}
        {listening && liveTranscript && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-end' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: '16px 16px 4px 16px',
              background: 'rgba(201,168,76,.2)', border: '1px dashed rgba(201,168,76,.5)',
              color: '#E8C96A', fontSize: 14, lineHeight: 1.55, fontStyle: 'italic',
              wordBreak: 'break-word' as const, textAlign: 'left' as const,
            }}>
              {liveTranscript}…
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: '#1a2f6b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#C9A84C',
            }}>C</div>
          </div>
        )}

        {/* Listening indicator without text yet */}
        {listening && !liveTranscript && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              display: 'inline-flex', gap: 4, alignItems: 'center',
              background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.3)',
              borderRadius: 20, padding: '8px 16px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 0.8s infinite' }} />
              <span style={{ fontSize: 13, color: '#e74c3c', marginLeft: 6 }}>Je t&apos;écoute… parle librement</span>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#0d1530',
            }}>L</div>
            <div style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#C9A84C',
                    opacity: 0.4, animation: `bounce 1s ${i*0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* ── INPUT ── */}
      <footer style={{
        background: '#122050', borderTop: '1px solid rgba(201,168,76,.15)',
        padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>

          {/* Micro */}
          <button onClick={toggleListening}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              transition: 'all .2s',
              background: listening ? '#e74c3c' : 'rgba(201,168,76,.15)',
              color: listening ? '#fff' : '#C9A84C', fontSize: 18,
              boxShadow: listening ? '0 0 16px rgba(231,76,60,.4)' : 'none',
            }}>
            {listening ? '⏹' : '🎙'}
          </button>

          {/* Texte */}
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={listening ? 'Je t\u2019écoute…' : 'Écris à Lola…'}
            rows={1}
            disabled={listening}
            style={{
              flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 22, padding: '10px 16px',
              color: '#fff', fontSize: 14, resize: 'none', outline: 'none',
              lineHeight: 1.5, fontFamily: 'inherit',
              opacity: listening ? 0.3 : 1,
            }} />

          {/* Envoyer */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading || listening}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              transition: 'all .2s',
              background: input.trim() && !listening ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.08)',
              color: input.trim() && !listening ? '#0d1530' : '#8A9BB5', fontSize: 18,
            }}>
            ➤
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        textarea::placeholder { color: #8A9BB5; }
        button:hover { opacity: .85; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
