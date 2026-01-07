import { useEffect, useRef, memo } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

// Memoized component to prevent unnecessary re-renders
const ParticlesBackground = memo(function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const isVisibleRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resizeCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()

    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 150)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // Particle colors
    const colors = [
      'rgba(16, 185, 129, 0.5)',
      'rgba(20, 184, 166, 0.5)',
      'rgba(6, 182, 212, 0.4)',
      'rgba(34, 197, 94, 0.4)',
    ]

    // Reduced particle count for better performance
    const particleCount = Math.min(40, Math.floor(window.innerWidth / 40))
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
    particlesRef.current = particles

    // Visibility API to pause animation when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      if (isVisibleRef.current && !animationRef.current) {
        animate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Throttled mouse position
    let mouseX = 0
    let mouseY = 0
    let isMouseNear = false
    let lastMouseMove = 0

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMouseMove < 50) return // Throttle to 20fps
      lastMouseMove = now
      mouseX = e.clientX
      mouseY = e.clientY
      isMouseNear = true
      setTimeout(() => { isMouseNear = false }, 150)
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Optimized animation loop with frame skipping
    let lastFrame = 0
    const targetFPS = 30 // Reduced from 60fps
    const frameInterval = 1000 / targetFPS

    const animate = (timestamp: number = 0) => {
      if (!isVisibleRef.current) {
        animationRef.current = 0
        return
      }

      const elapsed = timestamp - lastFrame

      if (elapsed >= frameInterval) {
        lastFrame = timestamp - (elapsed % frameInterval)

        const width = window.innerWidth
        const height = window.innerHeight

        ctx.clearRect(0, 0, width, height)

        // Draw particles
        const particles = particlesRef.current
        const len = particles.length

        for (let i = 0; i < len; i++) {
          const particle = particles[i]

          // Update position
          particle.x += particle.speedX
          particle.y += particle.speedY

          // Mouse interaction (simplified)
          if (isMouseNear) {
            const dx = particle.x - mouseX
            const dy = particle.y - mouseY
            const distSq = dx * dx + dy * dy
            if (distSq < 22500) { // 150^2
              const dist = Math.sqrt(distSq)
              const force = (150 - dist) / 150
              particle.x += (dx / dist) * force * 1.5
              particle.y += (dy / dist) * force * 1.5
            }
          }

          // Wrap around edges
          if (particle.x < 0) particle.x = width
          else if (particle.x > width) particle.x = 0
          if (particle.y < 0) particle.y = height
          else if (particle.y > height) particle.y = 0

          // Draw particle
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particle.color
          ctx.fill()
        }

        // Draw connections (optimized - only check nearby particles)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'
        ctx.lineWidth = 0.5

        for (let i = 0; i < len - 1; i++) {
          const p1 = particles[i]
          // Only check next few particles to reduce O(n²) complexity
          const maxJ = Math.min(i + 8, len)
          for (let j = i + 1; j < maxJ; j++) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy

            if (distSq < 10000) { // 100^2
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      clearTimeout(resizeTimeout)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
})

export default ParticlesBackground
