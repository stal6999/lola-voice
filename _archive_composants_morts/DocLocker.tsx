'use client'

import React, { useState, useRef } from 'react'

interface DocLockerProps {
  onFileContent: (content: string, filename: string) => void
  onDocumentReady: (name: string) => void
  outputDoc: { name: string; content: string } | null
}

export default function DocLocker({ onFileContent, onDocumentReady, outputDoc }: DocLockerProps) {
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [docs, setDocs] = useState<{ name: string; size: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        const docInfo = { name: file.name, size: formatSize(file.size) }
        setDocs(prev => [docInfo, ...prev.slice(0, 2)])
        onFileContent(content, file.name)
        onDocumentReady(file.name)
      }
      reader.readAsText(file)
    })
  }

  function formatSize(b: number) {
    if (b < 1024) return `${b}B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`
    return `${(b / (1024 * 1024)).toFixed(1)}MB`
  }

  function downloadOutput() {
    if (!outputDoc) return
    const blob = new Blob([outputDoc.content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = outputDoc.name
    a.click()
  }

  return (
    <g>
      {/* ── CASIER SVG intégré dans le décor ── */}
      {/* Casier physique — fixé au mur gauche de la Batcave */}
      <g transform="translate(8, 155)" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {/* Corps du casier */}
        <rect x="0" y="0" width="36" height="52" rx="3"
          fill="#0e1428" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />

        {/* Slot d'insertion */}
        <rect x="4" y="8" width="28" height="4" rx="1"
          fill="rgba(0,0,0,0.6)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <text x="18" y="11" textAnchor="middle" fill="rgba(201,168,76,0.4)" fontSize="3" fontFamily="monospace">INSERT</text>

        {/* LED status */}
        <circle cx="18" cy="22" r="3"
          fill={docs.length > 0 ? '#2ecc71' : outputDoc ? '#C9A84C' : 'rgba(138,155,181,0.3)'}>
          {(docs.length > 0 || outputDoc) && (
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Slot de sortie */}
        <rect x="4" y="30" width="28" height="4" rx="1"
          fill={outputDoc ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.4)'}
          stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <text x="18" y="33" textAnchor="middle"
          fill={outputDoc ? '#C9A84C' : 'rgba(138,155,181,0.3)'}
          fontSize="3" fontFamily="monospace">
          {outputDoc ? 'PRÊT' : 'OUTPUT'}
        </text>

        {/* Label DOCS */}
        <text x="18" y="46" textAnchor="middle" fill="rgba(201,168,76,0.5)" fontSize="4" fontFamily="monospace" fontWeight="bold">
          DOCS
        </text>

        {/* Boutons */}
        <rect x="6" y="48" width="10" height="3" rx="1" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.3" />
        <rect x="20" y="48" width="10" height="3" rx="1"
          fill={outputDoc ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.03)'}
          stroke={outputDoc ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.05)'} strokeWidth="0.3" />

        {/* Tooltip hover */}
        <title>Casier de documents — cliquez pour ouvrir</title>
      </g>

      {/* ── PANNEAU FLOTTANT au clic ── */}
      {open && (
        <foreignObject x="44" y="140" width="180" height="200">
          <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>} style={{
            background: 'rgba(8,14,32,0.97)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 10,
            padding: 10,
            fontFamily: '-apple-system, sans-serif',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600 }}>📁 Casier Lola</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#8A9BB5', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>

            {/* Zone upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${dragging ? '#C9A84C' : 'rgba(201,168,76,0.25)'}`,
                borderRadius: 8, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(201,168,76,0.05)' : 'transparent', marginBottom: 8,
              }}>
              <div style={{ fontSize: 16 }}>📎</div>
              <div style={{ fontSize: 10, color: '#C9A84C' }}>Dépose ou clique</div>
              <div style={{ fontSize: 9, color: '#8A9BB5' }}>TXT, PDF, CSV, MD...</div>
              <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)} />
            </div>

            {/* Docs envoyés */}
            {docs.map((d, i) => (
              <div key={i} style={{
                fontSize: 9, color: '#8A9BB5', padding: '3px 6px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 4, marginBottom: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                📄 {d.name} <span style={{ color: '#C9A84C' }}>{d.size}</span>
              </div>
            ))}

            {/* Output download */}
            {outputDoc && (
              <button onClick={downloadOutput} style={{
                width: '100%', background: 'rgba(46,204,113,0.1)',
                border: '1px solid rgba(46,204,113,0.3)', borderRadius: 6,
                padding: '6px', color: '#2ecc71', fontSize: 10, cursor: 'pointer', marginTop: 4,
              }}>
                ⬇ Télécharger {outputDoc.name}
              </button>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  )
}
