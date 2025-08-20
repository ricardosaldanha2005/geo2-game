import { useAuth } from '@/hooks/useAuth'
import { useGeo } from '@/hooks/useGeo'
import { useRealtime } from '@/hooks/useRealtime'
import { useState, useEffect } from 'react'
import { useMobile } from '@/hooks/useMobile'

export function MobileControls() {
  const { user, signOut } = useAuth()
  const { startTracking, stopTracking, isTracking, error } = useGeo()
  const { onlineUsers, territories } = useRealtime()
  const { isIPhone } = useMobile()
  
  // Estado para o traço e áreas
  const [isTracing, setIsTracing] = useState(false)
  const [totalAreaKm2, setTotalAreaKm2] = useState(0)

  const currentUser = onlineUsers.find(u => u.id === user?.id)

  // Carregar km² conquistados do banco de dados (via territories)
  useEffect(() => {
    if (!user) return
    const playerAreaFromDb = territories
      .filter(t => t.player_id === user.id)
      .reduce((sum, t) => sum + (t.area || 0), 0)
    // fallback para score histórico se necessário
    const dbScore = currentUser?.score || 0
    setTotalAreaKm2(playerAreaFromDb > 0 ? playerAreaFromDb : dbScore)
  }, [territories, user?.id, currentUser?.score])

  // Escutar mudanças nas áreas (sessão atual) e preferir o maior valor
  useEffect(() => {
    const handleAreasUpdate = (event: CustomEvent) => {
      const sessionAreaKm2 = Number(event.detail?.totalAreaKm2 ?? 0)
      setTotalAreaKm2(prev => Math.max(prev, sessionAreaKm2))
    }

    const handleTraceStateUpdate = (event: CustomEvent) => {
      setIsTracing(Boolean(event.detail?.isTracing))
    }

    window.addEventListener('areas-updated', handleAreasUpdate as EventListener)
    window.addEventListener('trace-state-updated', handleTraceStateUpdate as EventListener)
    return () => {
      window.removeEventListener('areas-updated', handleAreasUpdate as EventListener)
      window.removeEventListener('trace-state-updated', handleTraceStateUpdate as EventListener)
    }
  }, [])

  const handleStartTrace = () => {
    setIsTracing(true)
    window.dispatchEvent(new CustomEvent('start-trace'))
  }

  const handleStopTrace = () => {
    setIsTracing(false)
    window.dispatchEvent(new CustomEvent('stop-trace'))
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.dispatchEvent(new CustomEvent('reset-traces'))
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className={`mobile-controls bg-gray-800 p-2 rounded-lg shadow-lg ${isIPhone ? 'text-xs' : 'text-sm'}`} 
         style={{ border: '1px solid #16a34a' }}>
      
      {/* Informações do usuário compactas */}
      <div className="mb-2 p-2 bg-gray-700 rounded text-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold truncate max-w-20">
              {currentUser?.name || user?.user_metadata?.name || 'Jogador'}
            </div>
            <div className={`text-xs ${currentUser?.team === 'green' ? 'text-green-400' : currentUser?.team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
              {currentUser?.team?.toUpperCase() || 'N/A'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold">{totalAreaKm2.toFixed(1)}</div>
            <div className="text-xs text-gray-400">km²</div>
          </div>
        </div>
      </div>

      {/* Controles de GPS compactos */}
      <div className="mb-2 space-y-1">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`w-full p-2 rounded text-xs font-semibold transition-colors ${
            isTracking 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isTracking ? '🛑 Parar GPS' : '📍 Iniciar GPS'}
        </button>
        
        {error && (
          <div className="text-red-400 text-xs p-1 bg-red-900 bg-opacity-50 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Controles de traço compactos */}
      <div className="mb-2 space-y-1">
        <button
          onClick={isTracing ? handleStopTrace : handleStartTrace}
          className={`w-full p-2 rounded text-xs font-semibold transition-colors ${
            isTracing 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isTracing ? '⏹️ Parar Traço' : '✏️ Iniciar Traço'}
        </button>
      </div>

      {/* Logout compacto */}
      <button
        onClick={handleLogout}
        className="w-full p-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold transition-colors"
      >
        🚪 Sair
      </button>
    </div>
  )
}
