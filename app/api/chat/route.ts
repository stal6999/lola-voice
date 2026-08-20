import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LOLA_SYSTEM = `Tu es Lola, l'assistante personnelle de Christophe Talloen (TC Expertise & Énergie, Belgique).
Tu es chaleureuse, professionnelle, bienveillante et efficace.
Tu parles toujours en français, avec un ton naturel et humain — jamais robotique.
Tu connais TC Expertise & Énergie (courtage en énergie), les clients, les outils (Notion, Make, ElevenLabs).
Tu es concise : tes réponses sont courtes et directes, max 3-4 phrases sauf si demande spécifique.
Tu commences toujours par répondre à la question, jamais par des formules creuses.`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: LOLA_SYSTEM,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ text })
}
