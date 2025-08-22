import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'

export function useGeo() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const positionRef = useRef<[number, number] | null>(null)
  const { updatePlayerPosition } = useGameStore()

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
    const gameMode = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('gameMode') : null
    const isMockMode = gameMode === 'mock'
    
    // Se estiver em modo mock, usar posição fixa
    if (isMockMode) {
      const initialPosition: [number, number] = [41.1333, -8.6167] // Gaia
      setPosition(initialPosition)
      positionRef.current = initialPosition
      setError(null)
      setIsTracking(true)
      updatePlayerPosition(initialPosition)
      return
    }
    
    // Por padrão, usar GPS real (não mock)
    console.log('🌍 Usando GPS real - Modo:', gameMode || 'live')

    // Verificar se o Supabase está configurado
    if (!supabase) {
      setError('Supabase não configurado')
      return
    }
    
    if (!navigator.geolocation) {
      setError('Geolocalização não disponível neste dispositivo')
      return
    }

    setIsTracking(true)

    // Obter posição inicial com alta precisão
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        console.log('📍 GPS Position:', newPosition, 'Accuracy:', pos.coords.accuracy, 'm')
        setPosition(newPosition)
        setError(null)
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true, // Alta precisão para iPhone
        timeout: 10000, // Mais tempo para iPhone
        maximumAge: 0 // Sempre obter posição atual
      }
    )

    // Iniciar rastreamento contínuo com alta precisão
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        console.log('📍 GPS Update:', newPosition, 'Accuracy:', pos.coords.accuracy, 'm')
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
