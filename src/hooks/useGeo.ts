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
    // Atualização síncrona para melhor responsividade
    setPosition(newPosition)
    positionRef.current = newPosition
    
    // Atualizar gameStore de forma assíncrona para não bloquear
    requestAnimationFrame(() => {
      updatePlayerPosition(newPosition)
    })
  }

  useEffect(() => {
    // Verificar se estamos no modo mock
    const gameMode = localStorage.getItem('gameMode')
    const isMockMode = gameMode === 'mock'
    
         // Forçar modo mock para performance
     if (isMockMode || true) {
      const initialPosition: [number, number] = [41.1333, -8.6167] // Gaia
      setPosition(initialPosition)
      positionRef.current = initialPosition
      setError(null)
      setIsTracking(true)
      // Atualizar posição no gameStore
      updatePlayerPosition(initialPosition)
    }

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

    // Obter posição inicial
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(newPosition)
        setError(null)
        
        // Atualizar apenas o gameStore para evitar conflitos
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 1000
      }
    )

    // Iniciar rastreamento contínuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(newPosition)
        setError(null)
        
        // Atualizar apenas o gameStore para evitar conflitos
        updatePlayerPosition(newPosition)
      },
      (err) => {
        setError(`Erro GPS: ${err.message}`)
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 1000
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

    // Removida função updatePositionInSupabase para evitar conflitos

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
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 1000
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
