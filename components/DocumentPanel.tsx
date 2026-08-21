'use client'

import React, { useState, useRef } from 'react'

interface DocItem {
  id: string
  name: string
  type: 'input' | 'output'
  size: string
  status: 'ready' | 'processing' | 'done'
  content?: string
}

interface DocumentPanelProps {
  visible: boolean
  onClose: () => void
  onDocumentReady: (doc: DocItem) => void
  onFileContent: (content: string, filename: string) => void
}

export default function DocumentPanel({ visible, onClose, onDocumentReady, onFileContent }: DocumentPanelProps) {
  const [docs, setDocs] = useState<DocItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(file => {
      const doc: DocItem = {
        id: Date.now().toString(),
        name: file.name,
        type: 'input',
        size: formatSize(file.size),
        status: 'processing',
      }
      setDocs(prev => [doc, ...prev])

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const updated = { ...doc, status: 'ready' as const, content }
        setDocs(prev => prev.map(d => d.id === doc.id ? updated : d))
        onFileContent(content, file.name)
        onDocumentReady(updated)
      }
      reader.readAsText(file)
    })
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  function downloadDoc(doc: DocItem) {
    if (!doc.content) return
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0,
      width: visible ? 280 : 0,
      background: 'rgba(8,14,32,0.97)',
      borderLeft: '1px solid rgba(201,168,76,0.15)',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      zIndex: 50,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', borderBottom: '1px solid rgba(201,168,76,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#C9A84C' }}>📁 Documents</div>
          <div style={{ fontSize: 10, color: '#8A9BB5', marginTop: 2 }}>Partage avec Lola</div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#8A9BB5', fontSize: 16, cursor: 'pointer',
        }}>✕</button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        style={{
          margin: 12, padding: '20px 12px', borderRadius: 10,
          border: `2px dashed ${dragging ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
          background: dragging ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
          textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
        <div style={{ fontSize: 11, color: '#C9A84C' }}>Dépose un fichier ici</div>
        <div style={{ fontSize: 10, color: '#8A9BB5', marginTop: 2 }}>ou clique pour choisir</div>
        <div style={{ fontSize: 9, color: '#8A9BB5', marginTop: 4 }}>TXT, PDF, DOCX, CSV...</div>
        <input ref={fileRef} type="file" multiple accept=".txt,.pdf,.docx,.csv,.md,.json"
          style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8A9BB5', fontSize: 11, marginTop: 20 }}>
            Aucun document pour l&apos;instant
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(doc => (
              <div key={doc.id} style={{
                background: doc.type === 'output' ? 'rgba(46,204,113,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${doc.type === 'output' ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>
                    {doc.type === 'output' ? '📤' : '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: 9, color: '#8A9BB5', marginTop: 1 }}>
                      {doc.size} • {doc.type === 'input' ? 'Envoyé à Lola' : 'Prêt à télécharger'}
                    </div>
                  </div>
                  {doc.status === 'processing' && (
                    <div style={{ fontSize: 12, animation: 'spin 1s linear infinite' }}>⌛</div>
                  )}
                  {doc.status === 'done' && doc.type === 'output' && (
                    <button onClick={() => downloadDoc(doc)} style={{
                      background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)',
                      borderRadius: 6, padding: '3px 8px', color: '#2ecc71', fontSize: 10, cursor: 'pointer',
                    }}>⬇ DL</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
