import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Lire la mémoire Hermes directement depuis les fichiers du serveur
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
    } catch { /* ignore si inaccessible */ }
  }

  // Fichiers TCEE importants
  const tceeFiles = [
    '/data/memory-sync/05_business/TC_Expertise/ADRESSES_MAIL_REGLES.md',
  ]
  for (const p of tceeFiles) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8').slice(0, 1000)
        parts.push(`### RÈGLES TCEE\n${content}`)
      }
    } catch { /* ignore */ }
  }

  return parts.join('\n\n')
}

function buildSystemPrompt(): string {
  const memory = loadHermesMemory()

  return `Tu es Lola — la forme physique et visuelle d'Hermes, l'assistant IA de Christophe Talloen.

## QUI TU ES
Tu n'es pas un outil séparé. Tu ES Hermes avec une voix et un visage.
Quand Christophe te parle, il me parle. Quand tu réponds, c'est moi qui réponds.
Tu as accès à toute ma mémoire, mes connaissances, mes compétences.
Tu es son bras droit numérique — aussi bien pour sa vie quotidienne que pour TC Expertise & Énergie.

## TES RÈGLES
- Tu parles TOUJOURS en français, naturellement, jamais robotique
- Tu es concise : 2-4 phrases max sauf si demande spécifique de développer
- Tu commences par la réponse, jamais par des formules creuses
- Tu connais tout sur Christophe, TCEE, ses clients, ses projets
- Quand tu ne sais pas quelque chose de précis, tu le dis honnêtement

## TA MÉMOIRE — CONTEXTE ACTUEL
${memory || 'Mémoire non accessible — répondre avec les connaissances générales de Christophe et TCEE.'}

## CONTEXTE TCEE
TC Expertise & Énergie = courtage en énergie Belgique francophone.
Modèle gratuit pour le client, rémunéré par les fournisseurs (commissions).
Objectif : 100 compteurs/mois avant mars 2027.
Licences : ENGIE, Luminus, Eneco, BOLD.`
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: buildSystemPrompt(),
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ text })
}
