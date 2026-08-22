import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Chemins vers la mémoire Hermes sur le serveur
const MEMORY_PATHS = [
  '/data/memories/MEMORY.md',
  '/data/memories/USER.md',
  '/data/memory-sync/03_projects/Applications/Mon_Assistante_Lola/CAHIER_DES_CHARGES.md',
]

const MEMORY_SYNC_DIRS = [
  '/data/memory-sync/05_business/TC_Expertise',
  '/data/memory-sync/03_projects',
]

export async function GET() {
  const context: Record<string, string> = {}

  // Lire les fichiers mémoire principaux
  for (const filePath of MEMORY_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const key = path.basename(filePath, '.md')
        context[key] = content.slice(0, 3000) // limiter la taille
      }
    } catch {
      // fichier inaccessible — ignorer
    }
  }

  // Lister les fichiers disponibles dans memory-sync
  const available: string[] = []
  for (const dir of MEMORY_SYNC_DIRS) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir, { recursive: true }) as string[]
        files.filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .forEach(f => available.push(path.join(dir, f.toString())))
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    memory: context['MEMORY'] || '',
    user: context['USER'] || '',
    cahier_des_charges: context['CAHIER_DES_CHARGES'] || '',
    available_files: available.slice(0, 50),
    timestamp: new Date().toISOString(),
  })
}
