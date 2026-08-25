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

    // FIX 4: Modèle turbo pour latence -40% (eleven_turbo_v2_5 vs eleven_multilingual_v2)
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
      return NextResponse.json(
        { error: 'voix indisponible', status: res.status },
        { status: 502 }
      )
    }

    const audio = await res.arrayBuffer()
    if (!audio || audio.byteLength === 0) {
      return NextResponse.json({ error: 'audio vide' }, { status: 502 })
    }

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        // FIX 4: Désactiver le buffering nginx pour streaming immédiat
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('TTS route fatal error', err)
    return NextResponse.json({ error: 'erreur serveur TTS' }, { status: 500 })
  }
}
