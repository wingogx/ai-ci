'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  isActive: boolean
  duration?: number
}

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
  delay: number
  isCircle: boolean
}

const colors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
]

/**
 * 生成粒子数据
 */
function generateParticles(count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 0.5,
      isCircle: Math.random() > 0.5,
    })
  }
  return particles
}

export function Confetti({ isActive, duration = 2000 }: ConfettiProps) {
  const [showParticles, setShowParticles] = useState(false)
  const [particleKey, setParticleKey] = useState(0)

  // 当 isActive 变为 true 时触发
  useEffect(() => {
    if (isActive) {
      setShowParticles(true)
      setParticleKey((k) => k + 1)

      // 清除粒子
      const timer = setTimeout(() => {
        setShowParticles(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  // 使用 useMemo 生成粒子，只在 key 变化时重新生成
  const particles = useMemo(() => {
    if (!showParticles) return []
    return generateParticles(50)
    // particleKey 确保每次触发都生成新的粒子
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleKey, showParticles])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: '-10vh',
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: '110vh',
                rotate: particle.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2.5,
                delay: particle.delay,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.isCircle ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export default Confetti
