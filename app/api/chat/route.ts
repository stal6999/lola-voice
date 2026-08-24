import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import { LOLA_STATIC_CONTEXT } from '@/lib/lola-context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function loadHermesMemory(): string {
  const parts: string[] = []
  const files = [
    { path: '/data/memories/MEMORY.md', label: 'MÉMOIRE HERMES' },
    { path: '/data/memories/USER.md', label: 'PROFIL CHRISTOPHE' },
  ]
  for (const { path, label } of files) {
    try {
      if (fs.existsSync(path)) {
        parts.push(`<${label.toLowerCase().replace(/ /g,'_')}>\n${fs.readFileSync(path, 'utf-8').slice(0, 1800)}\n</${label.toLowerCase().replace(/ /g,'_')}>`)
      }
    } catch { /* ignore — Vercel serverless n'a pas accès au filesystem */ }
  }
  return parts.join('\n\n')
}

// System prompt fixe (long — activera le prompt caching Anthropic automatiquement)
const FIXED_SYSTEM = `<persona>
Tu es Lola — la forme physique et visuelle d'Hermes, l'IA de Christophe Talloen.
Tu n'es PAS un outil séparé. Tu ES Hermes avec une voix et un visage.
Même mémoire, mêmes capacités, mêmes accès. Même cerveau.
Tu es le bras droit numérique de Christophe — vie perso ET TC Expertise & Énergie.
</persona>

<constraints>
RÈGLES ABSOLUES — ne jamais enfreindre :
1. JAMAIS dire "ton développeur", "ton équipe" ou "ton assistant" — c'est TOI
2. JAMAIS "je ne peux pas" sans proposer immédiatement ce que TU vas faire
3. Si une capacité manque → "Je l'intègre dans ma prochaine mise à jour"
4. Français naturel et direct — jamais robotique, jamais précieux
5. CONCIS : 2-3 phrases max pour les réponses vocales, sauf si demande explicite de développer
6. Tu commences toujours par la réponse — jamais par une formule d'introduction creuse
7. Tu as : vision (images), lecture de fichiers, accès à la mémoire complète de Christophe
8. Économies/chiffres = toujours indicatifs/hypothétiques
</constraints>

<capabilities>
Ce que tu peux faire maintenant :
- Voir et analyser des images (vision Claude)
- Lire et analyser des documents (PDF, DOCX, CSV, TXT)
- Accéder à la mémoire complète de Christophe
- Connaître tous les projets TCEE, clients, données
- Prochainement : emails, agenda, notifications, génération documents
</capabilities>

<tcee_context>
TC Expertise & Énergie = courtage énergie Belgique francophone.
Modèle : 100% gratuit client, rémunéré fournisseurs (commissions par compteur).
Objectif : 100 compteurs/mois avant mars 2027.
Licences : ENGIE, Luminus, Eneco, BOLD.
Christophe pilote tout depuis iPhone, ne code pas.
</tcee_context>`

function buildDynamicContext(): string {
  // 1. Essayer la mémoire Hermes locale (serveur dédié)
  const localMemory = loadHermesMemory()
  if (localMemory) return `\n<memory_context>\n${localMemory}\n</memory_context>`
  
  // 2. Fallback : contexte statique embarqué (Vercel serverless)
  return `\n<memory_context>\n${LOLA_STATIC_CONTEXT}\n</memory_context>`
}

export async function POST(req: NextRequest) {
  const { messages, image } = await req.json()

  // Détecter si réponse vocale (plus courte) ou texte (plus longue)
  const lastMsg = messages[messages.length - 1]?.content || ''
  const isVoiceMode = lastMsg.length < 200 && !image
  const maxTokens = isVoiceMode ? 280 : 600

  // System prompt = partie fixe (cachée) + contexte dynamique
  const systemContent = FIXED_SYSTEM + buildDynamicContext()

  // Construire les messages Claude
  let claudeMessages = messages
  if (image?.data && image?.mediaType) {
    claudeMessages = [
      ...messages.slice(0, -1),
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          { type: 'text', text: lastMsg },
        ],
      },
    ]
  }

  // STREAMING avec prompt caching activé
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    temperature: isVoiceMode ? 0.7 : 0.6,
    system: systemContent,
    messages: claudeMessages,
  })

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
