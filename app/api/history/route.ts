import { NextRequest, NextResponse } from 'next/server'
import { loadHistory } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ messages: [] })
    const messages = await loadHistory(sessionId)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('history route error', err)
    return NextResponse.json({ messages: [] })
  }
}
