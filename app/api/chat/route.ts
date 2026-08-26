import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LOLA_STATIC_CONTEXT } from '@/lib/lola-context'
import { saveMessage } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

FIX 5 — MOTION TAGS : Quand tu veux exprimer une émotion ou un geste, ajoute des tags dans ta réponse :
[emotion:happy] [emotion:sad] [emotion:surprised] [emotion:neutral]
[gesture:wave] [gesture:nod] [gesture:think] [gesture:bow] [gesture:clap]
Mets-les AVANT la phrase concernée. Ex: "[emotion:happy] Je suis ravie de vous voir !"
Max 1 tag par réponse sauf si vraiment nécessaire.
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
  // Edge Runtime : uniquement le contexte statique embarqué (pas de filesystem)
  return `\n<memory_context>\n${LOLA_STATIC_CONTEXT}\n</memory_context>`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, image, sessionId } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        `data: ${JSON.stringify({ error: 'messages manquants' })}\n\n`,
        { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
      )
    }

    // Sauvegarde non-bloquante du message utilisateur (Supabase optionnel — jamais de blocage si absent/en panne)
    const lastUserMsg = messages[messages.length - 1]?.content || ''
    if (sessionId && lastUserMsg) saveMessage(sessionId, 'user', lastUserMsg)

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

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // STREAMING avec prompt caching activé
          const stream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens,
            temperature: isVoiceMode ? 0.7 : 0.6,
            system: systemContent,
            messages: claudeMessages,
          })

          let fullText = ''
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullText += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, done: false })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fullText, done: true })}\n\n`))
          if (sessionId && fullText) saveMessage(sessionId, 'assistant', fullText)
        } catch (err) {
          console.error('Claude stream error', err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Lola a rencontré un problème pour répondre.', done: true })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (err) {
    console.error('Chat route fatal error', err)
    return new Response(
      `data: ${JSON.stringify({ error: 'erreur serveur', done: true })}\n\n`,
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }
}
