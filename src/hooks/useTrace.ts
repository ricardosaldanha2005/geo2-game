import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useGeo } from './useGeo'

export function useTrace() {
  const { position } = useGeo()
  
  useEffect(() => {
    // Remover verificação de modo mock para permitir funcionamento

    const interval = setInterval(() => {
      if (position) {
        // Atualizar posição do jogador no gameStore
        useGameStore.getState().updatePlayerPosition(position)
      }
    }, 500) // Reduzir para 500ms para atualização mais frequente

    return () => {
      clearInterval(interval)
    }
  }, [position])
}
