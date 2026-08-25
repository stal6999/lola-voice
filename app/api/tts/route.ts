import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'texte manquant' }, { status: 400 })
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
    const apiKey  = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY manquante' }, { status: 500 })
    }

    // /with-timestamps : renvoie l'audio ET l'alignement caractère-par-caractère
    // (vrai lip-sync possible, au lieu d'une approximation FFT sur l'amplitude)
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        language_code: 'fr',
        voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('ElevenLabs TTS error', res.status, errText.slice(0, 300))
      return NextResponse.json({ error: 'voix indisponible', status: res.status }, { status: 502 })
    }

    const data = await res.json()
    if (!data?.audio_base64) {
      return NextResponse.json({ error: 'audio vide' }, { status: 502 })
    }

    return NextResponse.json({
      audio: data.audio_base64,
      alignment: data.alignment ?? null,
    }, {
      headers: { 'X-Accel-Buffering': 'no' },
    })
  } catch (err) {
    console.error('TTS route fatal error', err)
    return NextResponse.json({ error: 'erreur serveur TTS' }, { status: 500 })
  }
}
