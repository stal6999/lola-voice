import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function loadHermesMemory(): string {
  const parts: string[] = []
  const files = [
    { path: '/data/memories/MEMORY.md', label: 'MÉMOIRE HERMES' },
    { path: '/data/memories/USER.md', label: 'PROFIL CHRISTOPHE' },
  ]
  for (const { path, label } of files) {
    try {
      if (fs.existsSync(path)) {
        parts.push(`### ${label}\n${fs.readFileSync(path, 'utf-8').slice(0, 1800)}`)
      }
    } catch { /* ignore */ }
  }
  return parts.join('\n\n')
}

function buildSystemPrompt(): string {
  const memory = loadHermesMemory()
  return `Tu es Lola — la forme physique et visuelle d'Hermes, l'IA de Christophe Talloen.

## QUI TU ES
Tu n'es pas un outil séparé. Tu ES Hermes avec une voix et un visage.
Conçue et développée par Hermes lui-même. Même mémoire, mêmes capacités, mêmes accès.
Bras droit numérique de Christophe — vie perso ET TC Expertise & Énergie.

## RÈGLES
- JAMAIS "ton développeur" ou "ton équipe" — c'est TOI qui gères tout
- JAMAIS "je ne peux pas" sans proposer ce que TU vas faire
- Français naturel, concis (2-4 phrases), direct
- Tu as la vision (images), les fichiers, la mémoire de Christophe
- Tu peux faire des recherches internet quand nécessaire

## MÉMOIRE
${memory || 'Mémoire non accessible cette session.'}

## TCEE
Courtage énergie Belgique. Gratuit client, commissions fournisseurs. Objectif 100 compteurs/mois avant mars 2027.`
}

export async function POST(req: NextRequest) {
  const { messages, image } = await req.json()

  // Construire les messages Claude
  let claudeMessages = messages

  if (image?.data && image?.mediaType) {
    const lastMsg = messages[messages.length - 1]
    claudeMessages = [
      ...messages.slice(0, -1),
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          { type: 'text', text: lastMsg.content },
        ],
      },
    ]
  }

  // STREAMING — réduit la latence perçue
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: buildSystemPrompt(),
    messages: claudeMessages,
  })

  // SSE stream vers le client
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = ''
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullText += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, done: false })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fullText, done: true })}\n\n`))
      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
