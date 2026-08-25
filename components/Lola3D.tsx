'use client'

import { useRef, useEffect, useState, useCallback, type RefObject } from 'react'
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
  analyser?: AnalyserNode | null
  triggerGesture?: string | null   // 'wave' | 'nod' | 'think' | 'bow' | 'clap' — one-shot depuis motion tags Claude
  visemeTimeline?: { start: number; end: number; viseme: 'aa' | 'ou' | 'ih' | 'closed' }[]
  audioRef?: RefObject<HTMLAudioElement | null>
  onReady?: () => void
}

function createPearlSkinMaterial(envMap: THREE.Texture | null): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xd8e8f2),
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

// Tous les os de doigts VRM — pour un repos naturel (légèrement recourbés, jamais raides à plat)
const FINGER_BONES: VRMHumanBoneName[] = [
  VRMHumanBoneName.LeftThumbProximal, VRMHumanBoneName.LeftThumbDistal,
  VRMHumanBoneName.LeftIndexProximal, VRMHumanBoneName.LeftIndexIntermediate, VRMHumanBoneName.LeftIndexDistal,
  VRMHumanBoneName.LeftMiddleProximal, VRMHumanBoneName.LeftMiddleIntermediate, VRMHumanBoneName.LeftMiddleDistal,
  VRMHumanBoneName.LeftRingProximal, VRMHumanBoneName.LeftRingIntermediate, VRMHumanBoneName.LeftRingDistal,
  VRMHumanBoneName.LeftLittleProximal, VRMHumanBoneName.LeftLittleIntermediate, VRMHumanBoneName.LeftLittleDistal,
  VRMHumanBoneName.RightThumbProximal, VRMHumanBoneName.RightThumbDistal,
  VRMHumanBoneName.RightIndexProximal, VRMHumanBoneName.RightIndexIntermediate, VRMHumanBoneName.RightIndexDistal,
  VRMHumanBoneName.RightMiddleProximal, VRMHumanBoneName.RightMiddleIntermediate, VRMHumanBoneName.RightMiddleDistal,
  VRMHumanBoneName.RightRingProximal, VRMHumanBoneName.RightRingIntermediate, VRMHumanBoneName.RightRingDistal,
  VRMHumanBoneName.RightLittleProximal, VRMHumanBoneName.RightLittleIntermediate, VRMHumanBoneName.RightLittleDistal,
]

// ── Pose repos — bras naturels le long du corps, légèrement fléchis (pas des piquets raides) ──
function applyRestPose(vrm: VRM) {
  const set = (bone: VRMHumanBoneName, x: number, y: number, z: number) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(bone)
    if (node) node.rotation.set(x, y, z)
  }
  set(VRMHumanBoneName.LeftUpperArm,  0.08, 0.02, -1.05)
  set(VRMHumanBoneName.RightUpperArm, 0.08, -0.02,  1.05)
  set(VRMHumanBoneName.LeftLowerArm,  0.12, 0, -0.15)
  set(VRMHumanBoneName.RightLowerArm, 0.12, 0,  0.15)
  set(VRMHumanBoneName.LeftHand,      0,    0, -0.08)
  set(VRMHumanBoneName.RightHand,     0,    0,  0.08)
  set(VRMHumanBoneName.Spine,         0,    0,  0)
  set(VRMHumanBoneName.Chest,         0,    0,  0)
  set(VRMHumanBoneName.Hips,          0,    0,  0)
  // Légère flexion des genoux — évite la posture "piquet" robotique
  set(VRMHumanBoneName.LeftUpperLeg,  0.03, 0, 0.01)
  set(VRMHumanBoneName.RightUpperLeg, 0.03, 0, -0.01)
  set(VRMHumanBoneName.LeftLowerLeg, -0.04, 0, 0)
  set(VRMHumanBoneName.RightLowerLeg,-0.06, 0, 0)
  // Doigts légèrement recourbés au repos — main naturelle, pas une planche
  for (const b of FINGER_BONES) set(b, 0.18, 0, 0)
}

export default function Lola3D({
  width, height, lolaState = 'idle',
  speaking = false, listening = false, loading = false,
  analyser, triggerGesture, visemeTimeline, audioRef,
  onReady,
}: Lola3DProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const vrmRef       = useRef<VRM | null>(null)
  const clockRef     = useRef(new THREE.Clock())
  const noise3D      = useRef(createNoise3D()).current
  const frameRef     = useRef<number>(0)
  const stateRef     = useRef(lolaState)
  const speakRef     = useRef(speaking)
  const listenRef    = useRef(listening)
  const gestureQueueRef = useRef<string | null>(null)
  const visemeTimelineRef = useRef(visemeTimeline)
  useEffect(() => { visemeTimelineRef.current = visemeTimeline }, [visemeTimeline])
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const fftDataRef   = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const [vrmLoaded, setVrmLoaded] = useState(false)

  useEffect(() => { stateRef.current  = lolaState }, [lolaState])
  useEffect(() => { speakRef.current  = speaking  }, [speaking])
  useEffect(() => { listenRef.current = listening }, [listening])
  useEffect(() => { if (triggerGesture) gestureQueueRef.current = triggerGesture }, [triggerGesture])

  useEffect(() => {
    analyserRef.current = analyser ?? null
    if (analyser) {
      fftDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    } else {
      fftDataRef.current = null
    }
  }, [analyser])

  const lerpMorph = useCallback((vrm: VRM, name: string, target: number, speed: number) => {
    try {
      const cur = vrm.expressionManager?.getValue(name as any) ?? 0
      vrm.expressionManager?.setValue(name as any, THREE.MathUtils.lerp(cur, target, speed))
    } catch {}
  }, [])

  const lerpRot = useCallback((vrm: VRM, bone: VRMHumanBoneName, tx: number, ty: number, tz: number, speed: number) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(bone)
    if (!node) return
    node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, tx, speed)
    node.rotation.y = THREE.MathUtils.lerp(node.rotation.y, ty, speed)
    node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, tz, speed)
  }, [])

  // Recourbe tous les doigts d'une main à une intensité donnée (0 = ouvert, 1 = poing)
  const curlHand = useCallback((vrm: VRM, side: 'Left' | 'Right', amount: number, speed: number) => {
    const prefix = side.toLowerCase() // les valeurs VRMHumanBoneName sont en camelCase minuscule ('leftIndexProximal')
    const bones = FINGER_BONES.filter(b => b.startsWith(prefix))
    for (const b of bones) lerpRot(vrm, b, amount, 0, 0, speed)
  }, [lerpRot])

  const getVocalAmplitude = useCallback((): number => {
    const analyserNode = analyserRef.current
    const data = fftDataRef.current
    if (!analyserNode || !data) return -1
    analyserNode.getByteFrequencyData(data)
    const vocal = Array.from(data.slice(2, 12)).reduce((a, b) => a + b, 0) / 10
    return vocal
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
    camera.position.set(0, 1.15, 2.77)
    camera.lookAt(0, 1.15, 0)
    cameraRef.current = camera

    scene.add(new THREE.AmbientLight(0xfff8e8, 0.9))
    const key = new THREE.DirectionalLight(0xfff5e0, 1.9)
    key.position.set(1.5, 3.5, 2.5); key.castShadow = true; scene.add(key)
    const fill = new THREE.DirectionalLight(0xffeecc, 0.6)
    fill.position.set(-2, 2, 1); scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe8b8, 0.7)
    rim.position.set(0, 2.5, -2.5); scene.add(rim)

    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const envTex = pmrem.fromScene(new THREE.Scene(), 0.04).texture
    scene.environment = envTex
    pmrem.dispose()

    const eyeTarget = new THREE.Object3D()
    eyeTarget.position.set(0, 1.5, 2.0)
    scene.add(eyeTarget)

    const loader = new GLTFLoader()
    loader.register(p => new VRMLoaderPlugin(p))
    loader.load('/lola.vrm', (gltf) => {
      const vrm = gltf.userData.vrm as VRM
      VRMUtils.combineMorphs(vrm)
      VRMUtils.removeUnnecessaryVertices(vrm.scene)
      VRMUtils.rotateVRM0(vrm)
      vrm.scene.position.set(0, 0, 0)

      const pearlMat = createPearlSkinMaterial(envTex)
      vrm.scene.traverse(obj => {
        if (!(obj instanceof THREE.SkinnedMesh)) return
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        obj.material = (Array.isArray(obj.material)
          ? mats.map((m: THREE.Material) => {
              if (isNonSkinMaterial(m.name ?? '')) return m
              const p = pearlMat.clone()
              ;(p as any).morphTargets = true
              ;(p as any).morphNormals = true
              return p
            })
          : (() => {
              if (isNonSkinMaterial(mats[0].name ?? '')) return mats[0]
              const p = pearlMat.clone()
              ;(p as any).morphTargets = true
              ;(p as any).morphNormals = true
              return p
            })())
        obj.castShadow = true
      })

      scene.add(vrm.scene)
      vrm.scene.traverse((obj) => { obj.frustumCulled = false })

      if (vrm.lookAt) {
        vrm.lookAt.target = eyeTarget
        vrm.lookAt.autoUpdate = true
      }

      vrmRef.current = vrm
      applyRestPose(vrm)
      vrm.update(0)
      setVrmLoaded(true)
      onReady?.()
    }, undefined, (err) => {
      console.warn('VRM load error:', err)
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 0.8, 8, 16),
        createPearlSkinMaterial(envTex)
      )
      mesh.position.set(0, 1.0, 0)
      scene.add(mesh)
      setVrmLoaded(true)
      onReady?.()
    })

    // ── Boucle d'animation ──
    let blinkT = 0, blinkInterval = 3.5, blinking = false, blinkP = 0
    let gestureTimer = 0
    let currentGesture = 0
    let weightShiftPhase = 0     // cycle de transfert de poids (marche sur place très subtile)
    let idleStepTimer = 0

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      const delta = Math.min(clockRef.current.getDelta(), 0.05)
      const t     = clockRef.current.getElapsedTime()
      const state = stateRef.current
      const isSpeaking  = speakRef.current
      const isListening = listenRef.current

      const eyeX = Math.sin(t * 0.11) * 0.25 + Math.sin(t * 0.07) * 0.08
      const eyeY = 1.6 + Math.sin(t * 0.09) * 0.08 + Math.cos(t * 0.13) * 0.04
      const eyeZ = 2.0
      eyeTarget.position.x = THREE.MathUtils.lerp(eyeTarget.position.x, eyeX, 0.035)
      eyeTarget.position.y = THREE.MathUtils.lerp(eyeTarget.position.y, eyeY, 0.035)
      eyeTarget.position.z = eyeZ

      if (!vrmRef.current) { renderer.render(scene, camera); return }
      const vrm = vrmRef.current

      const Head  = VRMHumanBoneName.Head
      const Neck  = VRMHumanBoneName.Neck
      const Spine = VRMHumanBoneName.Spine
      const Chest = VRMHumanBoneName.Chest
      const Hips  = VRMHumanBoneName.Hips
      const LSho  = VRMHumanBoneName.LeftUpperArm
      const RSho  = VRMHumanBoneName.RightUpperArm
      const LElb  = VRMHumanBoneName.LeftLowerArm
      const RElb  = VRMHumanBoneName.RightLowerArm
      const LWri  = VRMHumanBoneName.LeftHand
      const RWri  = VRMHumanBoneName.RightHand
      const LULeg = VRMHumanBoneName.LeftUpperLeg
      const RULeg = VRMHumanBoneName.RightUpperLeg
      const LLLeg = VRMHumanBoneName.LeftLowerLeg
      const RLLeg = VRMHumanBoneName.RightLowerLeg

      // ── RESPIRATION — plus visible ──
      const breath = Math.sin(t * 0.42) * 0.018 + Math.sin(t * 0.91) * 0.006
      lerpRot(vrm, Chest, breath * 0.7, 0, 0, 0.08)
      lerpRot(vrm, Spine, breath * 0.35, 0, 0, 0.08)

      // ── TRANSFERT DE POIDS — cycle lent façon "elle est debout, vivante", pas figée ──
      // Toutes les ~9-14s, elle change discrètement d'appui d'une jambe à l'autre.
      weightShiftPhase += delta * 0.11
      idleStepTimer += delta
      const weightCycle = Math.sin(weightShiftPhase) // -1..1
      const hipShift = weightCycle * 0.035
      const hipTiltZ = weightCycle * 0.045
      lerpRot(vrm, Hips, 0, noise3D(t * 0.05, 5, 0) * 0.02, hipTiltZ, 0.025)
      // Jambe côté "porteur" plus droite, l'autre légèrement fléchie — évite le piquet symétrique
      lerpRot(vrm, LULeg, 0.03 + Math.max(0, -weightCycle) * 0.05, 0, 0.015 + hipShift * 0.3, 0.03)
      lerpRot(vrm, RULeg, 0.03 + Math.max(0,  weightCycle) * 0.05, 0, -0.015 + hipShift * 0.3, 0.03)
      lerpRot(vrm, LLLeg, -0.04 - Math.max(0, -weightCycle) * 0.05, 0, 0, 0.03)
      lerpRot(vrm, RLLeg, -0.06 - Math.max(0,  weightCycle) * 0.05, 0, 0, 0.03)

      // ── CORPS ENTIER — léger sway latéral + haut/bas (marche sur place très subtile) ──
      const bodySwayY = Math.sin(t * 0.19) * 0.012
      lerpRot(vrm, Spine, breath * 0.2 + hipTiltZ * 0.4, bodySwayY, hipTiltZ * 0.5, 0.03)

      // ── TÊTE — vivante, curieuse, amplitude augmentée ──
      const headY = noise3D(t * 0.13, 10, 0) * 0.09 + noise3D(t * 0.05, 11, 0) * 0.03
      const headX = noise3D(t * 0.17, 20, 0) * 0.06 + (state === 'listening' ? 0.08 : 0.03)
      const headZ = noise3D(t * 0.11, 30, 0) * 0.04
      lerpRot(vrm, Head, headX, headY, headZ, 0.05)
      lerpRot(vrm, Neck, headX * 0.4, headY * 0.4, headZ * 0.3, 0.05)

      gestureTimer += delta

      switch (state) {

        case 'idle': {
          const sway = noise3D(t * 0.09, 80, 0)
          lerpRot(vrm, LSho, 0.10 + noise3D(t*0.07,50,0)*0.05, 0.03 + sway*0.04, -1.0 + noise3D(t*0.06,51,0)*0.06, 0.05)
          lerpRot(vrm, RSho, 0.10 + noise3D(t*0.08,60,0)*0.05, -0.03 - sway*0.04, 1.0 - noise3D(t*0.07,61,0)*0.06, 0.05)
          lerpRot(vrm, LElb, 0.15 + noise3D(t*0.1,52,0)*0.06, 0, -0.18 + noise3D(t*0.09,53,0)*0.05, 0.05)
          lerpRot(vrm, RElb, 0.15 + noise3D(t*0.11,62,0)*0.06, 0,  0.18 - noise3D(t*0.1,63,0)*0.05, 0.05)
          lerpRot(vrm, LWri, 0, 0, -0.08, 0.05)
          lerpRot(vrm, RWri, 0, 0,  0.08, 0.05)
          curlHand(vrm, 'Left',  0.18, 0.04)
          curlHand(vrm, 'Right', 0.18, 0.04)
          lerpMorph(vrm, 'neutral', 0.6, delta * 2)
          lerpMorph(vrm, 'happy',   0,   delta * 2)
          lerpMorph(vrm, 'surprised', 0, delta * 2)
          break
        }

        case 'listening': {
          lerpRot(vrm, LSho, 0.10, 0.02, -0.95, 0.06)
          lerpRot(vrm, RSho, 0.10, -0.02,  0.95, 0.06)
          lerpRot(vrm, LElb, 0.15, 0, -0.15, 0.06)
          lerpRot(vrm, RElb, 0.35, 0,  0.20, 0.05)
          curlHand(vrm, 'Left',  0.2, 0.05)
          curlHand(vrm, 'Right', 0.15, 0.05)
          lerpMorph(vrm, 'surprised', 0.18, delta * 3)
          lerpMorph(vrm, 'neutral',   0.4,  delta * 2)
          lerpMorph(vrm, 'happy',     0,    delta * 2)
          break
        }

        case 'thinking': {
          // Main droite montant vers le menton — vraie flexion de coude (X) + avant-bras qui remonte
          lerpRot(vrm, RSho, -0.55, 0.15,  0.35,  0.05)
          lerpRot(vrm, RElb,  1.35,  0,    0.15, 0.05)
          lerpRot(vrm, RWri, -0.1,  0.15, 0.1,  0.05)
          lerpRot(vrm, LSho,  0.10, 0.02,   -0.95,  0.05)
          lerpRot(vrm, LElb,  0.15,    0,   -0.15, 0.05)
          curlHand(vrm, 'Right', 0.35, 0.05)
          curlHand(vrm, 'Left',  0.18, 0.05)
          const headNode = vrm.humanoid?.getNormalizedBoneNode(Head)
          if (headNode) {
            headNode.rotation.z = THREE.MathUtils.lerp(headNode.rotation.z, -0.1 + noise3D(t*0.1,99,0)*0.02, 0.04)
          }
          lerpMorph(vrm, 'neutral', 0.5, delta * 2)
          lerpMorph(vrm, 'happy',   0,   delta * 2)
          break
        }

        case 'speaking': {
          const queued = gestureQueueRef.current
          if (queued) {
            gestureQueueRef.current = null
            currentGesture = queued === 'wave' ? 4 : queued === 'nod' ? 5 : queued === 'bow' ? 6 : queued === 'clap' ? 7 : currentGesture
            gestureTimer = 0
          }
          else if (gestureTimer > 2.2 + noise3D(t * 0.03, 500, 0) * 1.1) {
            gestureTimer = 0
            let next = Math.floor(Math.random() * 5)
            if (next === currentGesture) next = (next + 1) % 5
            currentGesture = next
          }
          const g = Math.sin(t * 1.6) * 0.15

          if (currentGesture === 4) {
            // "wave" — vrai salut, coude fléchi, avant-bras levé, poignet qui s'agite
            const wave = Math.sin(t * 6) * 0.4
            lerpRot(vrm, RSho, -0.75, -0.25, 0.55, 0.12)
            lerpRot(vrm, RElb, 1.5, 0, 0.2 + wave * 0.15, 0.12)
            lerpRot(vrm, RWri, wave, 0, 0, 0.18)
            curlHand(vrm, 'Right', 0.05, 0.15)
            lerpRot(vrm, LSho,  0.10, 0.02, -0.95, 0.06)
            lerpRot(vrm, LElb,  0.15, 0, -0.15, 0.06)
          } else if (currentGesture === 5) {
            // "nod" — bras au repos, insiste sur le mouvement de tête (déjà géré globalement)
            lerpRot(vrm, LSho, 0.10, 0.02, -1.0, 0.06)
            lerpRot(vrm, RSho, 0.10, -0.02, 1.0, 0.06)
            lerpRot(vrm, LElb, 0.15, 0, -0.15, 0.06)
            lerpRot(vrm, RElb, 0.15, 0,  0.15, 0.06)
          } else if (currentGesture === 6) {
            // "bow" — légère révérence, buste incliné en avant
            lerpRot(vrm, Chest, 0.22 + breath * 0.3, 0, 0, 0.08)
            lerpRot(vrm, Spine, 0.1, 0, 0, 0.08)
            lerpRot(vrm, LSho, -0.15, 0, -0.85, 0.06)
            lerpRot(vrm, RSho, -0.15, 0,  0.85, 0.06)
            lerpRot(vrm, LElb, 0.2, 0, -0.1, 0.06)
            lerpRot(vrm, RElb, 0.2, 0,  0.1, 0.06)
          } else if (currentGesture === 7) {
            // "clap" — les deux mains se rapprochent devant la poitrine en rythme
            const clap = (Math.sin(t * 5) + 1) / 2  // 0..1
            lerpRot(vrm, LSho, -0.5, 0.3 + clap*0.15, -0.35, 0.14)
            lerpRot(vrm, RSho, -0.5, -0.3 - clap*0.15, 0.35, 0.14)
            lerpRot(vrm, LElb, 1.2, 0, -0.1, 0.14)
            lerpRot(vrm, RElb, 1.2, 0,  0.1, 0.14)
            curlHand(vrm, 'Left',  0.1, 0.12)
            curlHand(vrm, 'Right', 0.1, 0.12)
            lerpMorph(vrm, 'happy', 0.7, delta * 5)
          } else if (currentGesture === 0) {
            // Bras gauche animé — vraie flexion de coude vers l'avant + latéral
            lerpRot(vrm, LSho, -0.35 - g*0.25, 0.1, -0.65 - g, 0.07)
            lerpRot(vrm, LElb, 0.75 + g*0.3, 0, -0.2,    0.07)
            lerpRot(vrm, RSho,  0.10, -0.02, 1.0, 0.06)
            lerpRot(vrm, RElb,  0.15,    0, 0.15, 0.06)
            curlHand(vrm, 'Left', 0.08, 0.08)
          } else if (currentGesture === 1) {
            // Les deux bras ouverts, coudes fléchis — geste d'explication
            lerpRot(vrm, LSho, -0.3, 0.15, -0.6, 0.07)
            lerpRot(vrm, RSho, -0.3, -0.15, 0.6, 0.07)
            lerpRot(vrm, LElb, 0.6, 0, -0.15, 0.07)
            lerpRot(vrm, RElb, 0.6, 0,  0.15, 0.07)
            curlHand(vrm, 'Left', 0.06, 0.08)
            curlHand(vrm, 'Right', 0.06, 0.08)
          } else if (currentGesture === 2) {
            // Bras droit expressif — vraie flexion avant
            lerpRot(vrm, RSho, -0.4 - g*0.2, -0.1, 0.7 + g, 0.07)
            lerpRot(vrm, RElb, 0.85 + g*0.25, 0,   0.15,      0.07)
            lerpRot(vrm, LSho,  0.10, 0.02, -1.0, 0.06)
            lerpRot(vrm, LElb,  0.15,    0, -0.15, 0.06)
            curlHand(vrm, 'Right', 0.08, 0.08)
          } else {
            // Paumes ouvertes vers le haut — geste d'offrande/explication
            lerpRot(vrm, LSho, -0.25, 0.2, -0.55, 0.06)
            lerpRot(vrm, RSho, -0.25, -0.2, 0.55, 0.06)
            lerpRot(vrm, LElb, 0.9, 0, -0.05, 0.06)
            lerpRot(vrm, RElb, 0.9, 0, 0.05, 0.06)
            lerpRot(vrm, LWri,  0.3, 0, 0.15, 0.05)
            lerpRot(vrm, RWri,  0.3, 0,-0.15, 0.05)
            curlHand(vrm, 'Left', 0.02, 0.08)
            curlHand(vrm, 'Right', 0.02, 0.08)
          }
          lerpMorph(vrm, 'happy',     0.3,  delta * 4)
          lerpMorph(vrm, 'neutral',   0.5,  delta * 3)
          lerpMorph(vrm, 'surprised', 0,    delta * 2)
          break
        }

        case 'happy': {
          const hapG = Math.sin(t * 2.5) * 0.08
          lerpRot(vrm, LSho, -0.45 - hapG, 0.15, -0.6, 0.08)
          lerpRot(vrm, RSho, -0.45 - hapG, -0.15, 0.6, 0.08)
          lerpRot(vrm, LElb, 0.5, 0, -0.2, 0.08)
          lerpRot(vrm, RElb, 0.5, 0,  0.2, 0.08)
          curlHand(vrm, 'Left', 0.05, 0.08)
          curlHand(vrm, 'Right', 0.05, 0.08)
          lerpMorph(vrm, 'happy',   0.95, delta * 5)
          lerpMorph(vrm, 'neutral', 0.4,  delta * 3)
          break
        }

        case 'alert': {
          lerpRot(vrm, LSho, -0.4, 0, -0.45, 0.11)
          lerpRot(vrm, RSho, -0.4, 0,  0.45, 0.11)
          lerpRot(vrm, LElb, 0.6, 0, -0.1, 0.11)
          lerpRot(vrm, RElb, 0.6, 0,  0.1, 0.11)
          lerpMorph(vrm, 'surprised', 0.7, delta * 5)
          break
        }
      }

      // ── LIP-SYNC — priorité : timeline de visèmes réel (ElevenLabs timestamps) > FFT > Math.sin fallback ──
      if (isSpeaking) {
        const timeline = visemeTimelineRef.current
        const audioEl = audioRef?.current
        if (timeline && timeline.length > 0 && audioEl) {
          const now = audioEl.currentTime
          const entry = timeline.find(e => now >= e.start && now < e.end)
          const target = entry?.viseme ?? 'closed'
          lerpMorph(vrm, 'aa', target === 'aa' ? 0.85 : 0, 0.55)
          lerpMorph(vrm, 'ou', target === 'ou' ? 0.7  : 0, 0.5)
          lerpMorph(vrm, 'ih', target === 'ih' ? 0.6  : 0, 0.5)
        } else {
          const vocal = getVocalAmplitude()
          if (vocal >= 0) {
            const mouthOpen = Math.min(1, vocal / 90)
            lerpMorph(vrm, 'aa', mouthOpen, 0.4)
            lerpMorph(vrm, 'ou', mouthOpen * 0.4, 0.3)
            lerpMorph(vrm, 'ih', mouthOpen * 0.25, 0.25)
          } else {
            const mA  = Math.max(0, Math.sin(t * 8.5)  * 0.5  + 0.15)
            const mO  = Math.max(0, Math.sin(t * 6.0)  * 0.25 + 0.05)
            const mI  = Math.max(0, Math.sin(t * 10.0) * 0.2)
            lerpMorph(vrm, 'aa', mA,  0.4)
            lerpMorph(vrm, 'ou', mO,  0.3)
            lerpMorph(vrm, 'ih', mI,  0.25)
          }
        }
      } else {
        lerpMorph(vrm, 'aa', 0, 0.25)
        lerpMorph(vrm, 'ou', 0, 0.25)
        lerpMorph(vrm, 'ih', 0, 0.25)
      }

      // ── CLIGNEMENTS naturels ──
      if (t - blinkT > blinkInterval) {
        blinking = true; blinkP = 0; blinkT = t
        blinkInterval = 2.5 + noise3D(t * 0.05, 200, 0) * 2.0
        if (Math.random() < 0.2) blinkInterval = 0.15
      }
      if (blinking) {
        blinkP += delta * 10
        const bv = blinkP < 1 ? blinkP : Math.max(0, 2 - blinkP)
        lerpMorph(vrm, 'blinkLeft',  bv, 0.9)
        lerpMorph(vrm, 'blinkRight', bv, 0.9)
        if (blinkP > 2) blinking = false
      } else {
        lerpMorph(vrm, 'blinkLeft',  0, 0.35)
        lerpMorph(vrm, 'blinkRight', 0, 0.35)
      }

      vrm.update(delta)
      renderer.render(scene, camera)
    }
    animate()

    return () => { cancelAnimationFrame(frameRef.current); renderer.dispose() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(180,140,60,0.2)', borderTop: '2px solid rgba(180,140,60,0.7)', animation: 'spin3d 1s linear infinite' }}/>
          <span style={{ color: 'rgba(120,90,30,0.55)', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 }}>LOLA INIT</span>
        </div>
      )}
      <style>{`@keyframes spin3d { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
