'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Tạo một đường sóng ribbon 3D
function WaveRibbon({
  yOffset = 0,
  zOffset = 0,
  color = '#67e8f9',
  speed = 1,
  amplitude = 1,
  frequency = 1,
  phase = 0
}: {
  yOffset?: number
  zOffset?: number
  color?: string
  speed?: number
  amplitude?: number
  frequency?: number
  phase?: number
}) {
  const lineRef = useRef<THREE.Line>(null)
  const pointsCount = 200

  const [geometry, material] = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < pointsCount; i++) {
      points.push(new THREE.Vector3(0, 0, 0))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    })
    return [geo, mat]
  }, [color])

  useFrame(({ clock }) => {
    if (!lineRef.current) return
    const time = clock.getElapsedTime() * speed
    const positions = lineRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < pointsCount; i++) {
      const t = i / (pointsCount - 1)
      const x = (t - 0.5) * 20

      const wave1 = Math.sin(x * frequency * 0.5 + time + phase) * amplitude * 0.8
      const wave2 = Math.sin(x * frequency * 0.3 - time * 0.7 + phase * 1.5) * amplitude * 0.5
      const wave3 = Math.cos(x * frequency * 0.2 + time * 0.5 + phase * 0.8) * amplitude * 0.3

      const y = wave1 + wave2 + yOffset
      const z = wave3 + zOffset + Math.sin(x * 0.5 + time * 0.3) * 0.5

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }

    lineRef.current.geometry.attributes.position.needsUpdate = true
  })

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material])

  return <primitive ref={lineRef} object={line} />
}

// Tạo nhiều ribbons tạo thành lưới sóng DÀY HƠN
function WaveMesh() {
  const groupRef = useRef<THREE.Group>(null)

  const ribbons = useMemo(() => {
    const items = []
    const colors = [
      '#ffffff',
      '#e0f7ff',
      '#b8ecff',
      '#8ae3ff',
      '#5dd9ff',
      '#38bdf8',
    ]

    // Layer 1: 60 sóng chính
    for (let i = 0; i < 60; i++) {
      items.push({
        key: `front-${i}`,
        yOffset: (i - 30) * 0.1,
        zOffset: Math.sin(i * 0.2) * 0.8,
        color: colors[i % colors.length],
        speed: 0.7 + Math.random() * 0.4,
        amplitude: 1.5 + Math.sin(i * 0.3) * 0.5,
        frequency: 0.5 + Math.random() * 0.25,
        phase: i * 0.15,
      })
    }

    // Layer 2: 30 sóng phía sau
    for (let i = 0; i < 30; i++) {
      items.push({
        key: `back-${i}`,
        yOffset: (i - 15) * 0.15,
        zOffset: -3 + Math.sin(i * 0.3) * 0.5,
        color: colors[(i + 3) % colors.length],
        speed: 0.5 + Math.random() * 0.3,
        amplitude: 1.0 + Math.sin(i * 0.4) * 0.4,
        frequency: 0.4 + Math.random() * 0.2,
        phase: i * 0.2 + 2,
      })
    }

    return items
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.03
      groupRef.current.rotation.x = Math.cos(clock.getElapsedTime() * 0.06) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {ribbons.map((props) => (
        <WaveRibbon {...props} />
      ))}
    </group>
  )
}

// Chữ WELCOME bằng particles
function WelcomeText() {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 800
  const originalPositions = useRef<Float32Array | null>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const targetPos = new Float32Array(particleCount * 3)

    // Tạo điểm cho chữ WELCOME
    const letters = [
      // W
      [[0,0],[0.3,2],[0.6,0.8],[0.9,2],[1.2,0]],
      // E
      [[1.6,0],[1.6,2],[1.6,0],[2.2,0],[1.6,1],[2.1,1],[1.6,2],[2.2,2]],
      // L
      [[2.6,2],[2.6,0],[3.2,0]],
      // C
      [[4.0,0.3],[3.6,0],[3.4,0.5],[3.4,1.5],[3.6,2],[4.0,1.7]],
      // O
      [[4.4,0.5],[4.4,1.5],[4.6,2],[5.0,2],[5.2,1.5],[5.2,0.5],[5.0,0],[4.6,0],[4.4,0.5]],
      // M
      [[5.6,0],[5.6,2],[5.9,1],[6.2,2],[6.2,0]],
      // E
      [[6.6,0],[6.6,2],[6.6,0],[7.2,0],[6.6,1],[7.1,1],[6.6,2],[7.2,2]],
    ]

    const allPoints: [number, number][] = []

    // Interpolate points along letter paths
    letters.forEach((letter) => {
      for (let i = 0; i < letter.length - 1; i++) {
        const [x1, y1] = letter[i]
        const [x2, y2] = letter[i + 1]
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        const steps = Math.max(8, Math.floor(dist * 15))

        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          allPoints.push([
            x1 + (x2 - x1) * t,
            y1 + (y2 - y1) * t
          ])
        }
      }
    })

    // Center and scale
    const centerX = 3.6
    const centerY = 1
    const scale = 0.9

    for (let i = 0; i < particleCount; i++) {
      // Random initial position (scattered)
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10

      // Target position (letter)
      if (i < allPoints.length) {
        const [px, py] = allPoints[i % allPoints.length]
        targetPos[i * 3] = (px - centerX) * scale
        targetPos[i * 3 + 1] = (py - centerY) * scale + 2.5
        targetPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3
      } else {
        // Extra particles - random positions near text
        const [px, py] = allPoints[Math.floor(Math.random() * allPoints.length)]
        targetPos[i * 3] = (px - centerX) * scale + (Math.random() - 0.5) * 0.3
        targetPos[i * 3 + 1] = (py - centerY) * scale + 2.5 + (Math.random() - 0.5) * 0.3
        targetPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      }
    }

    originalPositions.current = targetPos
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current || !originalPositions.current) return

    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    const target = originalPositions.current
    const time = clock.getElapsedTime()

    // Animate formation trong 3 giây đầu
    const progress = Math.min(time / 3, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    for (let i = 0; i < particleCount; i++) {
      // Lerp to target
      pos[i * 3] += (target[i * 3] - pos[i * 3]) * 0.02 * eased
      pos[i * 3 + 1] += (target[i * 3 + 1] - pos[i * 3 + 1]) * 0.02 * eased
      pos[i * 3 + 2] += (target[i * 3 + 2] - pos[i * 3 + 2]) * 0.02 * eased

      // Subtle floating after formed
      if (progress > 0.8) {
        pos[i * 3] += Math.sin(time * 2 + i * 0.1) * 0.002
        pos[i * 3 + 1] += Math.cos(time * 1.5 + i * 0.15) * 0.002
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.95}
        sizeAttenuation
      />
    </points>
  )
}

// Particles bay xung quanh
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 200

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8

      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.015
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }

    return [pos, vel]
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      if (Math.abs(pos[i * 3]) > 12) velocities[i * 3] *= -1
      if (Math.abs(pos[i * 3 + 1]) > 6) velocities[i * 3 + 1] *= -1
      if (Math.abs(pos[i * 3 + 2]) > 4) velocities[i * 3 + 2] *= -1
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#67e8f9"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function Scene() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 8)
  }, [camera])

  return (
    <>
      <color attach="background" args={['#0a1628']} />
      <fog attach="fog" args={['#0a1628', 6, 22]} />

      <WaveMesh />
      <WelcomeText />
      <FloatingParticles />

      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          radius={0.9}
        />
      </EffectComposer>
    </>
  )
}

interface WelcomePopup3DProps {
  onClose: () => void
}

export default function WelcomePopup3D({ onClose }: WelcomePopup3DProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] cursor-pointer"
      onClick={handleClose}
      style={{ animation: 'fadeIn 0.5s ease-out' }}
    >
      {/* Full screen 3D */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 55 }}
          style={{ background: '#0a1628' }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Gradient edges */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a1628]/30 via-transparent to-[#0a1628]/30" />

      {/* Bottom text */}
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-cyan-300/80 text-sm font-medium tracking-wide animate-pulse">
          Nhấn để tiếp tục
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
        aria-label="Đóng"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
