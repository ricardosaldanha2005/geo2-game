import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useGeo } from './useGeo'

export function usePawnControls() {
  const { position } = useGeo()
  const { currentPlayer } = useGameStore()
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se estamos no modo mock
      const gameMode = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('gameMode') : null
      const isMockMode = gameMode === 'mock'
      
      if (!isMockMode) {
        // No modo real, usar GPS em vez de controles de teclado
        return
      }

      const STEP_SIZE = 0.0001 // ~10 metros para melhor performance
      // Usar posição do currentPlayer (fonte única da verdade) ou do useGeo como fallback
      const currentPos = currentPlayer?.position || position || [41.1333, -8.6167]

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault()
          const newPosUp: [number, number] = [currentPos[0] + STEP_SIZE, currentPos[1]]
          useGameStore.getState().updatePlayerPosition(newPosUp)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          const newPosDown: [number, number] = [currentPos[0] - STEP_SIZE, currentPos[1]]
          useGameStore.getState().updatePlayerPosition(newPosDown)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          const newPosLeft: [number, number] = [currentPos[0], currentPos[1] - STEP_SIZE]
          useGameStore.getState().updatePlayerPosition(newPosLeft)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          const newPosRight: [number, number] = [currentPos[0], currentPos[1] + STEP_SIZE]
          useGameStore.getState().updatePlayerPosition(newPosRight)
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [position, currentPlayer?.position])
}


