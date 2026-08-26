// Client Supabase minimal côté serveur — pas de dépendance npm, juste fetch + REST API.
// Utilise la clé secrète (accès total) car ce fichier n'est appelé QUE depuis des routes API serveur.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

function headers() {
  return {
    'apikey': SUPABASE_SECRET_KEY!,
    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return // Supabase optionnel — Lola fonctionne sans historique si absent
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/lola_conversations`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ session_id: sessionId, role, content }),
    })
  } catch (err) {
    console.error('Supabase saveMessage error (non bloquant)', err)
  }
}

export async function loadHistory(sessionId: string, limit = 30): Promise<{ role: string; content: string }[]> {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return []
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/lola_conversations?session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc&limit=${limit}`,
      { headers: headers() }
    )
    if (!res.ok) return []
    const rows = await res.json()
    return Array.isArray(rows) ? rows.map((r: any) => ({ role: r.role, content: r.content })) : []
  } catch (err) {
    console.error('Supabase loadHistory error (non bloquant)', err)
    return []
  }
}
