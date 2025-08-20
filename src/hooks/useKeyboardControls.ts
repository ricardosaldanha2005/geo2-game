import { useEffect, useRef } from 'react'

interface KeyboardControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void
  enabled?: boolean
}

export function useKeyboardControls({ onMove, enabled = true }: KeyboardControlsProps) {
  const keysPressed = useRef<Set<string>>(new Set())
  const moveInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      
      // Prevenir comportamento padrão para teclas de movimento
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault()
      }

             // Adicionar tecla ao conjunto de teclas pressionadas
       keysPressed.current.add(key)

       // Movimento imediato quando tecla é pressionada
       if (key === 'w' || key === 'arrowup') {
         onMove('up')
       } else if (key === 's' || key === 'arrowdown') {
         onMove('down')
       } else if (key === 'a' || key === 'arrowleft') {
         onMove('left')
       } else if (key === 'd' || key === 'arrowright') {
         onMove('right')
       }

       // Iniciar movimento contínuo se não estiver ativo
       if (!moveInterval.current) {
         moveInterval.current = setInterval(() => {
           const keys = Array.from(keysPressed.current)
           
           // Prioridade: WASD primeiro, depois setas
           if (keys.includes('w') || keys.includes('arrowup')) {
             onMove('up')
           } else if (keys.includes('s') || keys.includes('arrowdown')) {
             onMove('down')
           } else if (keys.includes('a') || keys.includes('arrowleft')) {
             onMove('left')
           } else if (keys.includes('d') || keys.includes('arrowright')) {
             onMove('right')
           }
                   }, 50) // Movimento a cada 50ms para melhor responsividade
       }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      keysPressed.current.delete(key)

      // Parar movimento se não há teclas pressionadas
      if (keysPressed.current.size === 0 && moveInterval.current) {
        clearInterval(moveInterval.current)
        moveInterval.current = null
      }
    }

    // Adicionar event listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (moveInterval.current) {
        clearInterval(moveInterval.current)
      }
    }
  }, [onMove, enabled])

  return {
    isMoving: keysPressed.current.size > 0
  }
}
