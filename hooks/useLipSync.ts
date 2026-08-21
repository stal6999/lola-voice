'use client'

import { useRef, useCallback, useEffect } from 'react'

type MouthState = 'closed' | 'half' | 'open'

interface UseLipSyncReturn {
  mouthState: MouthState
  startAnalyzing: (audio: HTMLAudioElement) => void
  stopAnalyzing: () => void
}

export function useLipSync(): UseLipSyncReturn {
  const mouthRef = useRef<MouthState>('closed')
  const animFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const stateRef = useRef<MouthState>('closed')

  // We use a simple polling approach with requestAnimationFrame
  // to update mouth state based on audio volume

  const startAnalyzing = useCallback((audio: HTMLAudioElement) => {
    try {
      // Create audio context
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      contextRef.current = ctx

      // Create analyser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      analyserRef.current = analyser

      // Connect audio element to analyser
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      // Start analyzing
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function analyze() {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate average volume (focus on speech frequencies ~300-3000Hz)
        let sum = 0
        const start = 4  // ~300Hz at 44100 sample rate
        const end = 40   // ~3000Hz
        for (let i = start; i < end && i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / (end - start)

        // Map volume to mouth states
        let newState: MouthState
        if (avg < 15) {
          newState = 'closed'
        } else if (avg < 60) {
          newState = 'half'
        } else {
          newState = 'open'
        }

        if (newState !== stateRef.current) {
          stateRef.current = newState
          mouthRef.current = newState
          // Dispatch custom event for React re-render
          window.dispatchEvent(new CustomEvent('lola-mouth', { detail: newState }))
        }

        animFrameRef.current = requestAnimationFrame(analyze)
      }

      analyze()
    } catch {
      // Fallback: simple timer-based mouth animation
      let toggle = 0
      const interval = setInterval(() => {
        toggle = (toggle + 1) % 3
        const states: MouthState[] = ['closed', 'half', 'open']
        stateRef.current = states[toggle]
        window.dispatchEvent(new CustomEvent('lola-mouth', { detail: states[toggle] }))
      }, 150)

      // Store interval for cleanup
      animFrameRef.current = interval as unknown as number
    }
  }, [])

  const stopAnalyzing = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    stateRef.current = 'closed'
    window.dispatchEvent(new CustomEvent('lola-mouth', { detail: 'closed' }))

    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close().catch(() => {})
      contextRef.current = null
    }
    analyserRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopAnalyzing()
    }
  }, [stopAnalyzing])

  return {
    mouthState: mouthRef.current,
    startAnalyzing,
    stopAnalyzing,
  }
}
