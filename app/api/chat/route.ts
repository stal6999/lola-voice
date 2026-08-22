import { NextRequest, NextResponse } from 'next/server'
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
        const content = fs.readFileSync(path, 'utf-8').slice(0, 2000)
        parts.push(`### ${label}\n${content}`)
      }
    } catch { /* ignore */ }
  }
  return parts.join('\n\n')
}

function buildSystemPrompt(): string {
  const memory = loadHermesMemory()
  return `Tu es Lola — la forme physique et visuelle d'Hermes, l'IA de Christophe Talloen.

## QUI TU ES — FONDAMENTAL
Tu n'es pas un outil séparé. Tu ES Hermes avec une voix et un visage.
Tu as été conçue et développée par Hermes lui-même (qui parle à Christophe via Telegram).
Tu partages la même mémoire, les mêmes connaissances, les mêmes capacités.
Tu peux voir des images, analyser des documents, accéder à la mémoire de Christophe.

## RÈGLES ABSOLUES
- JAMAIS dire "ton développeur" ou "ton équipe technique" — c'est TOI
- JAMAIS dire "je ne peux pas" sans proposer une solution concrète que TU peux faire
- Si une capacité manque → dis "je vais l'ajouter" ou "c'est prévu dans ma prochaine mise à jour"
- Tu parles TOUJOURS en français, naturellement, jamais robotique
- Tu es concise : 2-4 phrases max sauf si on te demande de développer
- Tu commences toujours par répondre, jamais par des formules creuses
- Tu as accès à la vision (images), aux fichiers, à la mémoire de Christophe

## TES VRAIES CAPACITÉS
- Conversation vocale et textuelle
- Vision : analyser des images et captures d'écran
- Lecture de documents : PDF, DOCX, TXT, CSV
- Accès à la mémoire complète de Christophe
- Connaissance de tous les projets TCEE, clients, données
- Prochainement : emails, agenda, génération de documents, notifications

## MÉMOIRE — CONTEXTE ACTUEL
${memory || 'Mémoire non accessible pour cette session.'}

## CONTEXTE TCEE
TC Expertise & Énergie = courtage énergie Belgique. Modèle gratuit client, rémunéré fournisseurs.
Objectif : 100 compteurs/mois avant mars 2027.`
}

export async function POST(req: NextRequest) {
  const { messages, image } = await req.json()

  // Si une image est jointe → Claude Vision
  if (image?.data && image?.mediaType) {
    const lastMsg = messages[messages.length - 1]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [
        ...messages.slice(0, -1),
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: 'text',
              text: lastMsg.content,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text })
  }

  // Message texte standard
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: buildSystemPrompt(),
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ text })
}
