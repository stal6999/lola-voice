'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM, VRMHumanBoneName } from '@pixiv/three-vrm'
import { createNoise3D } from 'simplex-noise'

type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'alert'

interface Lola3DProps {
  width: number
  height: number
  lolaState?: LolaState
  speaking?: boolean
  listening?: boolean
  loading?: boolean
  onReady?: () => void
}

function createPearlSkinMaterial(envMap: THREE.Texture | null): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xd8e8f2), // Peau nacrée bleutée exacte #D8E8F2
    iridescence: 0.9,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [80, 350],
    transmission: 0.04,
    thickness: 0.6,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x88bbee),
    roughness: 0.25,
    metalness: 0.02,
    envMapIntensity: 1.2,
  })
  if (envMap) m.envMap = envMap
  return m
}

// Les noms à exclure du shader nacré (cheveux, yeux, vêtements, ongles...)
function isNonSkinMaterial(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('hair') || n.includes('eye') || n.includes('lash') ||
         n.includes('brow') || n.includes('cloth') || n.includes('outfit') ||
         n.includes('dress') || n.includes('skirt') || n.includes('shirt') ||
         n.includes('sleeve') || n.includes('nail') || n.includes('shoe') ||
         n.includes('sock') || n.includes('glove') || n.includes('accessory') ||
         n.includes('ribbon') || n.includes('bow') || n.includes('belt') ||
         n.includes('lip') || n.includes('tooth') || n.includes('tongue')
}

// Pose bras le long du corps
function applyRestPose(vrm: VRM) {
  const leftUpper = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm)
  const rightUpper = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
  const leftLower = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
  const rightLower = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)
  const spine = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine)

  if (leftUpper)  leftUpper.rotation.set(0, 0, -1.1)  // z négatif = bras gauche vers le BAS
  if (rightUpper) rightUpper.rotation.set(0, 0,  1.1)  // z positif = bras droit vers le BAS
  if (leftLower)  leftLower.rotation.set(0, 0, -0.15)
  if (rightLower) rightLower.rotation.set(0, 0,  0.15)
  if (spine)      spine.rotation.set(0, 0, 0)
}

export default function Lola3D({
  width, height, lolaState = 'idle',
  speaking = false, listening = false, loading = false,
  onReady,
}: Lola3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const vrmRef = useRef<VRM | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const noiseRef = useRef(createNoise3D())
  const frameRef = useRef<number>(0)
  const lolaStateRef = useRef(lolaState)
  const speakingRef = useRef(speaking)
  const [vrmLoaded, setVrmLoaded] = useState(false)

  // Sync refs
  useEffect(() => { lolaStateRef.current = lolaState }, [lolaState])
  useEffect(() => { speakingRef.current = speaking }, [speaking])

  const lerpMorph = useCallback((vrm: VRM, name: string, target: number, speed: number) => {
    try {
      const cur = vrm.expressionManager?.getValue(name as any) ?? 0
      vrm.expressionManager?.setValue(name as any, THREE.MathUtils.lerp(cur, target, speed))
    } catch { }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    // ── Scene ──
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // ── Camera ── portrait, mi-corps, face à Lola
    // Calcul précis : Lola=1.88m, fov=45° → z=2.77 → visible 0→2.29m
    // cam_y=1.15 → pieds (y=0) en bas, tête (y=1.88) à 82% en haut
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
    camera.position.set(0, 1.15, 2.77)
    camera.lookAt(0, 1.15, 0)
    cameraRef.current = camera

    // ── Lumières ──
    const ambient = new THREE.AmbientLight(0xd0e8ff, 0.7)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xfff5e0, 1.6)
    key.position.set(1.5, 3.5, 2.5)
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xaaccff, 0.5)
    fill.position.set(-2, 2, 1)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0x80ccff, 0.7)
    rim.position.set(0, 2.5, -2.5)
    scene.add(rim)

    // ── Env map ──
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const envTex = pmrem.fromScene(new THREE.Scene(), 0.04).texture
    scene.environment = envTex
    pmrem.dispose()

    // ── Charger VRM ──
    const loader = new GLTFLoader()
    loader.register(p => new VRMLoaderPlugin(p))

    loader.load(
      '/lola.vrm',
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM
        VRMUtils.combineMorphs(vrm)
        VRMUtils.removeUnnecessaryVertices(vrm.scene)

        // VRM1.0 fait face à +Z par défaut → caméra à +Z → elle nous regarde
        // PAS de rotation.y = Math.PI ici (bug précédent)
        vrm.scene.position.set(0, 0, 0)

        // Appliquer shader nacré sur la peau — tous SkinnedMesh sauf cheveux/yeux/vêtements
        const pearlMat = createPearlSkinMaterial(envTex)
        vrm.scene.traverse(obj => {
          if (!(obj instanceof THREE.SkinnedMesh)) return
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          const newMats = mats.map((m: THREE.Material) => {
            // Si c'est clairement pas de la peau → garder original
            if (isNonSkinMaterial(m.name ?? '')) return m
            // Sinon → shader nacré (skin, face, body, head, mais aussi noms VRoid génériques)
            const p = pearlMat.clone()
            ;(p as any).morphTargets = true
            ;(p as any).morphNormals = true
            return p
          })
          obj.material = Array.isArray(obj.material) ? newMats : newMats[0]
          obj.castShadow = true
        })

        scene.add(vrm.scene)
        vrmRef.current = vrm

        // Appliquer pose repos immédiatement
        applyRestPose(vrm)
        vrm.update(0)

        setVrmLoaded(true)
        onReady?.()
      },
      undefined,
      (err) => {
        console.warn('VRM load error:', err)
        // Fallback simple — sphère nacrée
        const geo = new THREE.SphereGeometry(0.3, 32, 32)
        const mat = createPearlSkinMaterial(envTex)
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(0, 1.0, 0)
        scene.add(mesh)
        setVrmLoaded(true)
        onReady?.()
      }
    )

    // ── Boucle animation ──
    const noise3D = noiseRef.current
    let lastBlink = 0
    let blinkInterval = 3.5
    let blinking = false
    let blinkProgress = 0

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      const delta = Math.min(clockRef.current.getDelta(), 0.05)
      const t = clockRef.current.getElapsedTime()
      const state = lolaStateRef.current
      const isSpeaking = speakingRef.current

      if (vrmRef.current) {
        const vrm = vrmRef.current

        const head  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head)
        const neck  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Neck)
        const spine = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine)
        const lArm  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm)
        const rArm  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
        const lLow  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
        const rLow  = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)

        // ── Micro-animations Perlin ── toujours actives
        const breath = noise3D(t * 0.35, 0, 0) * 0.006
        if (spine) spine.rotation.z = breath * 0.4

        if (head) {
          head.rotation.y = noise3D(t * 0.12, 10, 0) * 0.04
          head.rotation.x = noise3D(t * 0.18, 20, 0) * 0.025 + 0.03
          head.rotation.z = noise3D(t * 0.15, 30, 0) * 0.015
        }
        if (neck) {
          neck.rotation.y = noise3D(t * 0.1, 40, 0) * 0.02
        }

        // ── Comportement selon état ──
        switch (state) {
          case 'idle':
            // Bras le long du corps avec légère oscillation
            if (lArm) lArm.rotation.set(0.05, 0, -1.1 + noise3D(t*0.08, 50, 0)*0.03)
            if (rArm) rArm.rotation.set(0.05, 0,  1.1 - noise3D(t*0.09, 60, 0)*0.03)
            if (lLow) lLow.rotation.set(0, 0, -0.1)
            if (rLow) rLow.rotation.set(0, 0,  0.1)
            lerpMorph(vrm, 'neutral', 0.6, delta * 2)
            lerpMorph(vrm, 'happy', 0, delta * 2)
            break

          case 'listening':
            // Légère inclinaison tête vers l'avant
            if (head) head.rotation.x = 0.08 + noise3D(t*0.2, 20, 0)*0.02
            if (lArm) lArm.rotation.set(0, 0, -1.1)
            if (rArm) rArm.rotation.set(0, 0,  1.1)
            lerpMorph(vrm, 'surprised', 0.15, delta * 3)
            break

          case 'thinking':
            // Bras droit légèrement levé, tête inclinée
            if (rArm) rArm.rotation.set(-0.3, 0,  0.7)
            if (rLow) rLow.rotation.set(-0.4, 0,  0.2)
            if (head) head.rotation.z = -0.05
            if (lArm) lArm.rotation.set(0, 0, -1.1)
            lerpMorph(vrm, 'neutral', 0.4, delta * 2)
            break

          case 'speaking':
            // Bras gauche légèrement levé — geste naturel
            const gesture = Math.sin(t * 1.8) * 0.12
            if (lArm) lArm.rotation.set(-gesture * 0.3, 0, -0.85 - gesture)
            if (rArm) rArm.rotation.set(0, 0,  1.1)
            lerpMorph(vrm, 'happy', 0.25, delta * 4)
            break

          case 'happy':
            if (lArm) lArm.rotation.set(-0.2, 0, -0.9)
            if (rArm) rArm.rotation.set(-0.2, 0,  0.9)
            lerpMorph(vrm, 'happy', 0.9, delta * 3)
            break
        }

        // ── Lip-sync ──
        if (isSpeaking) {
          const mouthOpen = Math.max(0, Math.sin(t * 9) * 0.45 + 0.15)
          lerpMorph(vrm, 'aa', mouthOpen, 0.35)
          lerpMorph(vrm, 'ou', mouthOpen * 0.3, 0.25)
        } else {
          lerpMorph(vrm, 'aa', 0, 0.2)
          lerpMorph(vrm, 'ou', 0, 0.2)
        }

        // ── Clignements naturels ──
        if (t - lastBlink > blinkInterval) {
          blinking = true
          blinkProgress = 0
          lastBlink = t
          blinkInterval = 2.8 + noise3D(t * 0.05, 200, 0) * 1.8
        }
        if (blinking) {
          blinkProgress += delta * 8
          const bv = blinkProgress < 1
            ? blinkProgress
            : Math.max(0, 2 - blinkProgress)
          lerpMorph(vrm, 'blinkLeft', bv, 0.8)
          lerpMorph(vrm, 'blinkRight', bv, 0.8)
          if (blinkProgress > 2) { blinking = false }
        } else {
          lerpMorph(vrm, 'blinkLeft', 0, 0.3)
          lerpMorph(vrm, 'blinkRight', 0, 0.3)
        }

        vrm.update(delta)
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resize
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return
    rendererRef.current.setSize(width, height)
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
  }, [width, height])

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {!vrmLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(140,190,255,0.15)',
            borderTop: '2px solid rgba(140,190,255,0.7)',
            animation: 'spin3d 1s linear infinite',
          }}/>
          <span style={{
            color: 'rgba(140,190,255,0.5)',
            fontFamily: 'monospace', fontSize: 10, letterSpacing: 2
          }}>LOLA INIT</span>
        </div>
      )}
      <style>{`@keyframes spin3d { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
