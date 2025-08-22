import { useState, useEffect, useRef } from 'react'
import { safeStorage } from '@/lib/storage'
import { useGameStore } from '@/store/gameStore'

export function useGeo() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const positionRef = useRef<[number, number] | null>(null)
  const { updatePlayerPosition } = useGameStore()
  const defaultCenter: [number, number] = [41.1333, -8.6167]

  // Função para atualizar posição manualmente (para controles de teclado)
  const updatePositionManual = (newPosition: [number, number]) => {
    setPosition(newPosition)
    positionRef.current = newPosition
    
    requestAnimationFrame(() => {
      updatePlayerPosition(newPosition)
    })
  }

  useEffect(() => {
    // Verificar se estamos no modo mock (usar storage seguro para iOS privado)
    const gameMode = safeStorage.getItem('gameMode')
    const isMockMode = gameMode === 'mock'

    if (isMockMode) {
      const initialPosition: [number, number] = defaultCenter
      setPosition(initialPosition)
      positionRef.current = initialPosition
      setError(null)
      setIsTracking(true)
      updatePlayerPosition(initialPosition)
      return
    }

    // GPS real
    if (!navigator.geolocation) {
      setError('Geolocalização não disponível neste dispositivo')
      // Fallback: permitir que o mapa carregue
      setPosition(defaultCenter)
      updatePlayerPosition(defaultCenter)
      return
    }

    setIsTracking(true)

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    // Posição inicial
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(newPosition)
        setError(null)
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
        // Fallback para carregar o mapa mesmo sem GPS
        setPosition(defaultCenter)
        updatePlayerPosition(defaultCenter)
        setIsTracking(false)
      },
      geoOptions
    )

    // Rastreamento contínuo (melhor esforço)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(newPosition)
        setError(null)
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
      },
      geoOptions
    )

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // Monitorar mudanças na posição
  useEffect(() => {
    if (position) {
      positionRef.current = position
    }
  }, [position])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não disponível')
      return
    }

    setIsTracking(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(newPosition)
        setError(null)
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
      },
      {
        enableHighAccuracy: true, // Alta precisão para iPhone
        timeout: 10000, // Mais tempo para iPhone
        maximumAge: 0 // Sempre obter posição atual
      }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  return {
    position,
    error,
    isTracking,
    startTracking,
    stopTracking,
    updatePosition: updatePositionManual
  }
}
