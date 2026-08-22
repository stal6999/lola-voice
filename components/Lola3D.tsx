'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import { createNoise3D } from 'simplex-noise'

type LolaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'alert'

interface Lola3DProps {
  width: number
  height: number
  lolaState?: LolaState
  speaking?: boolean
  listening?: boolean
  loading?: boolean
  audioElement?: HTMLAudioElement | null
  onReady?: () => void
}

// Shader nacré/iridescent — basé sur la recherche agents
function createPearlSkinMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8ab4d4),      // bleu-gris nacré Lola
    iridescence: 1.0,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 400],
    transmission: 0.05,
    thickness: 0.8,
    attenuationColor: new THREE.Color(0x4488ff),
    attenuationDistance: 2.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    sheen: 0.5,
    sheenColor: new THREE.Color(0x99ccff),
    roughness: 0.2,
    metalness: 0.05,
    envMapIntensity: 1.5,
  })
}

// Shader holographique pour les parties non-animées (corps, tenue)
const holoVert = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
uniform float uTime;
void main() {
  vUv = uv;
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vViewDir = normalize(cameraPosition - worldPos);
  vNormal = worldNormal;
  // Micro-déplacement organique
  float noise = sin(position.y * 8.0 + uTime * 0.8) * 0.002;
  vec3 displaced = position + normal * noise;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const holoFrag = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uAlpha;

vec3 hsvToRgb(float h, float s, float v) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
  return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void main() {
  float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.5);
  // Iridescence angle-dépendante
  float angle = dot(vNormal, vViewDir);
  float hue = angle * 0.4 + uTime * 0.05 + vUv.y * 0.3;
  vec3 iriColor = hsvToRgb(hue, 0.6, 1.0);
  // Scanlines subtiles
  float scan = sin(vUv.y * 180.0 + uTime * 2.0) * 0.04 + 0.96;
  vec3 finalColor = mix(uColor, iriColor, fresnel * 0.7) * scan;
  float alpha = uAlpha * (0.6 + fresnel * 0.4);
  gl_FragColor = vec4(finalColor, alpha);
}
`

// Mapping phonèmes → morphTargets VRM (standard ARKit)
const PHONEME_TO_VISEME: Record<string, string> = {
  'A':  'aa', 'E': 'ee', 'I': 'ih', 'O': 'ou', 'U': 'ou',
  'B':  'pp', 'M': 'pp', 'P': 'pp',
  'C':  'ss', 'S': 'ss', 'Z': 'ss',
  'D':  'dd', 'T': 'dd', 'N': 'nn', 'L': 'nn',
  'F':  'ff', 'V': 'ff',
  'G':  'kk', 'K': 'kk',
  'TH': 'th', 'X': 'pp',
  // ElevenLabs viseme IDs directs
  'viseme_PP': 'pp', 'viseme_FF': 'ff', 'viseme_TH': 'th',
  'viseme_DD': 'dd', 'viseme_kk': 'kk', 'viseme_CH': 'ch',
  'viseme_SS': 'ss', 'viseme_nn': 'nn', 'viseme_RR': 'rr',
  'viseme_aa': 'aa', 'viseme_E':  'ee', 'viseme_I':  'ih',
  'viseme_O':  'ou', 'viseme_U':  'ou',
}

export default function Lola3D({
  width, height, lolaState = 'idle',
  speaking = false, listening = false, loading = false,
  audioElement = null, onReady,
}: Lola3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const vrmRef = useRef<VRM | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const noiseRef = useRef(createNoise3D())
  const frameRef = useRef<number>(0)
  const [vrmLoaded, setVrmLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const holoUniformsRef = useRef<{ uTime: { value: number }; uColor: { value: THREE.Color }; uAlpha: { value: number } } | null>(null)

  // Lerp morphTarget VRM
  const lerpMorphTarget = useCallback((vrm: VRM, name: string, target: number, speed: number) => {
    try {
      const current = vrm.expressionManager?.getValue(name as any) ?? 0
      const next = THREE.MathUtils.lerp(current, target, speed)
      vrm.expressionManager?.setValue(name as any, next)
    } catch { /* ignore expressions inconnues */ }
  }, [])

  // Setup Three.js
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera — portrait, cadrage mi-corps légèrement décalé
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100)
    camera.position.set(0, 1.15, 2.8)
    camera.lookAt(0, 1.0, 0)
    cameraRef.current = camera

    // Lumières
    const ambient = new THREE.AmbientLight(0xc8d8f8, 0.8)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.4)
    keyLight.position.set(1.5, 3, 2)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6)
    fillLight.position.set(-2, 2, 1)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0x80c8ff, 0.8)
    rimLight.position.set(0, 2, -3)
    scene.add(rimLight)

    // Env map pour les reflets nacrés — sky simple
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const neutralEnv = pmrem.fromScene(new THREE.Scene(), 0.04)
    scene.environment = neutralEnv.texture
    pmrem.dispose()

    // Charger le modèle VRM
    const loader = new GLTFLoader()
    loader.register(parser => new VRMLoaderPlugin(parser))

    // Essayer de charger un modèle VRM depuis le public folder
    loader.load(
      '/lola.vrm',
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM
        VRMUtils.combineMorphs(vrm)
        VRMUtils.removeUnnecessaryVertices(vrm.scene)

        // Appliquer le shader nacré/iridescent sur la peau
        const pearlMat = createPearlSkinMaterial()
        pearlMat.envMap = scene.environment

        vrm.scene.traverse(obj => {
          if (obj instanceof THREE.SkinnedMesh) {
            const mat = obj.material
            if (Array.isArray(mat)) {
              obj.material = mat.map(m => {
                if (m.name?.toLowerCase().includes('skin') ||
                    m.name?.toLowerCase().includes('face') ||
                    m.name?.toLowerCase().includes('body')) {
                  const p = pearlMat.clone()
                  ;(p as any).morphTargets = true
                  ;(p as any).morphNormals = true
                  return p
                }
                return m
              })
            } else if (mat.name?.toLowerCase().includes('skin') ||
                       mat.name?.toLowerCase().includes('face')) {
              const p = pearlMat.clone()
              ;(p as any).morphTargets = true
              ;(p as any).morphNormals = true
              obj.material = p
            }
          }
        })

        // Shader holographique sur la tenue
        const holoUniforms = {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x9ab4cc) },
          uAlpha: { value: 0.9 },
        }
        holoUniformsRef.current = holoUniforms
        const holoMat = new THREE.ShaderMaterial({
          vertexShader: holoVert,
          fragmentShader: holoFrag,
          uniforms: holoUniforms,
          transparent: true,
          side: THREE.DoubleSide,
        })

        vrm.scene.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            const mat = obj.material as THREE.Material
            if (mat.name?.toLowerCase().includes('cloth') ||
                mat.name?.toLowerCase().includes('outfit') ||
                mat.name?.toLowerCase().includes('dress')) {
              obj.material = holoMat
            }
          }
        })

        // Positionner — debout, centré
        vrm.scene.rotation.y = Math.PI
        scene.add(vrm.scene)
        vrmRef.current = vrm

        // Mixer animations
        const mixer = new THREE.AnimationMixer(vrm.scene)
        mixerRef.current = mixer

        setVrmLoaded(true)
        onReady?.()
      },
      undefined,
      (err) => {
        console.warn('VRM non trouvé, utilisation avatar procédural:', err)
        setError('no-vrm')
        // Créer un avatar procédural en fallback
        createProceduralAvatar(scene, holoUniformsRef)
        setVrmLoaded(true)
        onReady?.()
      }
    )

    // Boucle de rendu
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      const delta = clockRef.current.getDelta()
      const elapsed = clockRef.current.getElapsedTime()
      const noise3D = noiseRef.current

      // Update uniforms holo
      if (holoUniformsRef.current) {
        holoUniformsRef.current.uTime.value = elapsed
      }

      if (vrmRef.current) {
        const vrm = vrmRef.current
        mixerRef.current?.update(delta)

        // ── ANIMATIONS ORGANIQUES PERLIN NOISE ──
        const head = vrm.humanoid?.getNormalizedBoneNode('head')
        const spine = vrm.humanoid?.getNormalizedBoneNode('spine')
        const leftArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rightArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')

        if (head) {
          head.rotation.y = noise3D(elapsed * 0.15, 10, 0) * 0.03
          head.rotation.x = noise3D(elapsed * 0.22, 20, 0) * 0.02
          head.rotation.z = noise3D(elapsed * 0.18, 30, 0) * 0.01
        }
        if (spine) {
          const breath = noise3D(elapsed * 0.4, 0, 0) * 0.008
          spine.rotation.z = breath * 0.5
        }

        // Comportement selon état
        switch (lolaState) {
          case 'idle':
            if (leftArm) leftArm.rotation.z = noise3D(elapsed * 0.1, 50, 0) * 0.02 - 0.05
            if (rightArm) rightArm.rotation.z = noise3D(elapsed * 0.12, 60, 0) * 0.02 + 0.05
            lerpMorphTarget(vrm, 'neutral', 0.8, delta * 2)
            break
          case 'listening':
            if (head) {
              head.rotation.x = Math.sin(elapsed * 0.3) * 0.03 + 0.05
            }
            lerpMorphTarget(vrm, 'surprised', 0.2, delta * 3)
            break
          case 'thinking':
            if (rightArm) {
              rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.8, delta * 2)
              rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.4, delta * 2)
            }
            lerpMorphTarget(vrm, 'thinking', 0.5, delta * 2)
            break
          case 'speaking':
            if (leftArm) {
              const gestureT = Math.sin(elapsed * 2.0) * 0.15
              leftArm.rotation.z = -gestureT - 0.3
            }
            lerpMorphTarget(vrm, 'happy', 0.3, delta * 4)
            break
          case 'happy':
            lerpMorphTarget(vrm, 'happy', 1.0, delta * 3)
            break
        }

        // Lip-sync depuis audio
        if (audioElement && speaking) {
          // Fallback : animation bouche rythmique si pas de données phonèmes
          const mouthOpen = Math.max(0, Math.sin(elapsed * 8) * 0.5 + 0.2)
          lerpMorphTarget(vrm, 'aa', mouthOpen * 0.6, 0.3)
          lerpMorphTarget(vrm, 'ou', mouthOpen * 0.3, 0.3)
        } else {
          lerpMorphTarget(vrm, 'aa', 0, 0.15)
          lerpMorphTarget(vrm, 'ou', 0, 0.15)
        }

        // Clignements naturels
        const blinkCycle = Math.sin(elapsed * 0.7) > 0.95
        const blinkValue = blinkCycle ? 1.0 : 0.0
        lerpMorphTarget(vrm, 'blinkLeft', blinkValue, 0.5)
        lerpMorphTarget(vrm, 'blinkRight', blinkValue, 0.5)

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

  // Réagir aux changements d'état
  useEffect(() => {
    // Les changements sont gérés dans la boucle animate via lolaState
  }, [lolaState, speaking, listening, loading])

  // Resize
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return
    rendererRef.current.setSize(width, height)
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
  }, [width, height])

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {!vrmLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12,
          background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(140,180,255,0.2)',
            borderTop: '2px solid rgba(140,180,255,0.8)',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: 'rgba(140,180,255,0.6)', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2 }}>
            LOLA INIT...
          </span>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// Avatar procédural fallback (si pas de fichier VRM)
function createProceduralAvatar(
  scene: THREE.Scene,
  holoRef: React.MutableRefObject<any>
) {
  const group = new THREE.Group()

  const pearlMat = createPearlSkinMaterial()

  const holoUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x8ab4d8) },
    uAlpha: { value: 0.85 },
  }
  holoRef.current = holoUniforms
  const holoMat = new THREE.ShaderMaterial({
    vertexShader: holoVert,
    fragmentShader: holoFrag,
    uniforms: holoUniforms,
    transparent: true,
    side: THREE.DoubleSide,
  })

  // Tête sphère nacrée légèrement ovale
  const headGeo = new THREE.SphereGeometry(0.14, 32, 24)
  headGeo.scale(1, 1.08, 0.92) // légèrement elfique
  const head = new THREE.Mesh(headGeo, pearlMat)
  head.position.set(0, 1.65, 0)
  group.add(head)

  // Yeux lumineux ambre
  const eyeGeo = new THREE.SphereGeometry(0.028, 16, 16)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xe8c840, emissive: 0xd4a020, emissiveIntensity: 0.6,
    roughness: 0.1, metalness: 0.3,
  })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.055, 1.665, 0.125)
  eyeR.position.set( 0.055, 1.665, 0.125)
  group.add(eyeL, eyeR)

  // Lueur yeux
  const glowGeo = new THREE.SphereGeometry(0.035, 8, 8)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xe8d060, transparent: true, opacity: 0.15 })
  const glowL = new THREE.Mesh(glowGeo, glowMat)
  const glowR = new THREE.Mesh(glowGeo, glowMat)
  glowL.position.copy(eyeL.position)
  glowR.position.copy(eyeR.position)
  group.add(glowL, glowR)

  // Corps élancé
  const bodyGeo = new THREE.CapsuleGeometry(0.11, 0.42, 8, 16)
  const body = new THREE.Mesh(bodyGeo, holoMat)
  body.position.set(0, 1.22, 0)
  group.add(body)

  // Cou
  const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 12)
  const neck = new THREE.Mesh(neckGeo, pearlMat)
  neck.position.set(0, 1.51, 0)
  group.add(neck)

  // Cheveux — mèches élancées noires
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x080810, roughness: 0.6, metalness: 0.1,
    emissive: 0x1a2060, emissiveIntensity: 0.15,
  })
  const hairPositions: [number, number, number, number, number][] = [
    [-0.08, 1.78, -0.04, -0.14, 1.38],
    [ 0.08, 1.78, -0.04,  0.14, 1.38],
    [-0.05, 1.79,  0.02, -0.06, 1.36],
    [ 0.05, 1.79,  0.02,  0.06, 1.36],
    [ 0.00, 1.80, -0.06, -0.02, 1.35],
  ]
  hairPositions.forEach(([x1, y1, z1, x2, y2]) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2 * 1.2, (y1 + y2) / 2, z1 - 0.02),
      new THREE.Vector3(x2, y2, z1 - 0.05),
    ])
    const pts = curve.getPoints(8)
    const g = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts), 8, 0.012, 6, false
    )
    group.add(new THREE.Mesh(g, hairMat))
  })

  // Jambes
  const legGeo = new THREE.CapsuleGeometry(0.05, 0.36, 6, 12)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e2840, roughness: 0.7 })
  const legL = new THREE.Mesh(legGeo, legMat)
  const legR = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.06, 0.82, 0)
  legR.position.set( 0.06, 0.82, 0)
  group.add(legL, legR)

  // Pieds (chaussons nacrés)
  const footGeo = new THREE.CapsuleGeometry(0.04, 0.08, 4, 8)
  footGeo.rotateX(Math.PI / 2)
  const footMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4c080, metalness: 0.4, roughness: 0.2,
    iridescence: 0.5, iridescenceIOR: 1.4,
  })
  const footL = new THREE.Mesh(footGeo, footMat)
  const footR = new THREE.Mesh(footGeo, footMat)
  footL.position.set(-0.06, 0.62, 0.04)
  footR.position.set( 0.06, 0.62, 0.04)
  group.add(footL, footR)

  // Bras
  const armGeo = new THREE.CapsuleGeometry(0.04, 0.28, 6, 10)
  const armMat = holoMat
  const armL = new THREE.Mesh(armGeo, armMat)
  const armR = new THREE.Mesh(armGeo, armMat)
  armL.position.set(-0.18, 1.22, 0)
  armL.rotation.z = 0.3
  armR.position.set( 0.18, 1.22, 0)
  armR.rotation.z = -0.3
  group.add(armL, armR)

  // Mains
  const handGeo = new THREE.SphereGeometry(0.045, 8, 8)
  const handL = new THREE.Mesh(handGeo, pearlMat)
  const handR = new THREE.Mesh(handGeo, pearlMat)
  handL.position.set(-0.26, 1.08, 0)
  handR.position.set( 0.26, 1.08, 0)
  group.add(handL, handR)

  // Pendentif cristal cyan
  const crystalGeo = new THREE.OctahedronGeometry(0.025, 0)
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x40c8ff, emissive: 0x2080d0, emissiveIntensity: 0.8,
    transmission: 0.6, roughness: 0.0, metalness: 0.1,
    iridescence: 0.8,
  })
  const crystal = new THREE.Mesh(crystalGeo, crystalMat)
  crystal.position.set(0, 1.52, 0.1)
  group.add(crystal)

  // Aura subtile
  const auraGeo = new THREE.SphereGeometry(0.22, 16, 16)
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x6090d0, transparent: true, opacity: 0.04,
    side: THREE.BackSide,
  })
  const aura = new THREE.Mesh(auraGeo, auraMat)
  aura.position.set(0, 1.65, 0)
  group.add(aura)

  scene.add(group)
  return group
}
