'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function LolaPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [speaking, setSpeaking]   = useState(false)
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── ENVOI TEXTE ── */
  async function sendMessage(text: string) {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
    const data = await res.json()
    const lolaMsg: Message = { role: 'assistant', content: data.text }
    setMessages([...history, lolaMsg])
    setLoading(false)

    // TTS auto
    playTTS(data.text)
  }

  /* ── TTS ── */
  async function playTTS(text: string) {
    setSpeaking(true)
    const res  = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => setSpeaking(false)
    audio.play()
  }

  /* ── MICRO ── */
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunksRef.current = []
    const mr = new MediaRecorder(stream)
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const fd = new FormData()
      fd.append('file', blob, 'voice.webm')
      fd.append('model', 'whisper-1')
      // Pour l'instant on simule — à connecter Whisper API
      // TODO: /api/stt avec OpenAI Whisper
      setInput('(transcription vocale à connecter)')
      stream.getTracks().forEach(t => t.stop())
    }
    mediaRef.current = mr
    mr.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1530', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#122050', borderBottom: '1px solid rgba(201,168,76,.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#0d1530' }}>L</div>
          {speaking && <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#2ecc71', border: '2px solid #0d1530', animation: 'pulse 1s infinite' }} />}
        </div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>Lola</div>
          <div style={{ fontSize: 11, color: '#8A9BB5' }}>{speaking ? '🔊 En train de parler…' : loading ? '⌛ En réflexion…' : '● Disponible'}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#8A9BB5' }}>TC Expertise & Énergie</div>
      </header>

      {/* ── MESSAGES ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, width: '100%', margin: '0 auto' }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 800, color: '#C9A84C', marginBottom: 12 }}>Bonjour Christophe.</div>
            <div style={{ fontSize: 15, color: '#8A9BB5', lineHeight: 1.7 }}>Je suis Lola, ton assistante.<br />Écris-moi ou parle-moi.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              {['Quel est mon planning du jour ?', 'Résume les urgences Jérôme', 'Aide-moi à rédiger un mail'].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 20, padding: '8px 16px', color: '#E8C96A', fontSize: 13, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0d1530', flexShrink: 0 }}>L</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: m.role === 'user' ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.06)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,.08)' : 'none',
              color: m.role === 'user' ? '#0d1530' : '#fff',
              fontSize: 14, lineHeight: 1.6,
            }}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a2f6b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#C9A84C', flexShrink: 0 }}>C</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0d1530' }}>L</div>
            <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', opacity: 0.4, animation: `bounce 1s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* ── INPUT ── */}
      <footer style={{ background: '#122050', borderTop: '1px solid rgba(201,168,76,.15)', padding: '16px 16px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>

          {/* Micro */}
          <button onClick={recording ? stopRecording : startRecording}
            style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all .2s',
              background: recording ? '#e74c3c' : 'rgba(201,168,76,.15)',
              color: recording ? '#fff' : '#C9A84C', fontSize: 20 }}>
            {recording ? '⏹' : '🎙'}
          </button>

          {/* Texte */}
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Écris à Lola… (Entrée pour envoyer)"
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 24, padding: '12px 18px',
              color: '#fff', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} />

          {/* Envoyer */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all .2s',
              background: input.trim() ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(255,255,255,.08)',
              color: input.trim() ? '#0d1530' : '#8A9BB5', fontSize: 20 }}>
            ➤
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        textarea::placeholder { color: #8A9BB5; }
        button:hover { opacity: .85; }
      `}</style>
    </div>
  )
}
