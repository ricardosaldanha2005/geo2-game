import { useAuth } from '@/hooks/useAuth'
import { useGeo } from '@/hooks/useGeo'
import { useRealtime } from '@/hooks/useRealtime'
import { useState, useEffect } from 'react'

export function Controls() {
  const { user, signOut } = useAuth()
  const { startTracking, stopTracking, isTracking, error } = useGeo()
  const { onlineUsers, territories } = useRealtime()
  
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
    <div className="controls bg-gray-800 p-4 rounded-lg shadow-lg" style={{ border: '2px solid #16a34a' }}>
      <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#16a34a', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '10px' }}>
        CONTROLS
      </div>
      
      {/* Informações do usuário */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">
              {currentUser?.name || user?.user_metadata?.name || 'Jogador'}
            </div>
            <div className={`text-sm ${currentUser?.team === 'green' ? 'text-green-400' : currentUser?.team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
              Equipa {currentUser?.team?.toUpperCase() || 'N/A'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold">{totalAreaKm2.toFixed(2)}</div>
            <div className="text-xs text-gray-400">km²</div>
          </div>
        </div>
      </div>

      {/* Controles de GPS */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm">GPS</span>
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        
        {error && (
          <div className="text-red-400 text-xs mb-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
              isTracking 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTracking ? 'Parar GPS' : (navigator.geolocation ? 'Iniciar GPS' : 'Ativar Posição')}
          </button>
        </div>
      </div>

      {/* Controles de Traço */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm">Traço</span>
          <div className={`w-3 h-3 rounded-full ${isTracing ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={isTracing ? handleStopTrace : handleStartTrace}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
              isTracing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTracing ? 'Parar Traço' : 'Iniciar Traço'}
          </button>
        </div>
        
        <div className="text-xs text-gray-400 mt-1">
          Use ESPAÇO ou ENTER para controlar
        </div>
      </div>

      {/* Informações das Áreas */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="text-white text-sm font-semibold mb-2">km² Conquistados</div>
        <div className="text-green-400 text-lg font-bold">
          {totalAreaKm2.toFixed(2)} km²
        </div>
        <div className="text-gray-400 text-xs mt-1">
          {totalAreaKm2 > 0 ? 'Pontos = km² conquistados!' : 'Risque até cruzar linhas'}
        </div>
      </div>

      {/* Jogadores online - REMOVIDO POR SEGURANÇA */}
      {/* Informações sobre outros jogadores não são exibidas */}

      {/* Botão de logout */}
      <div className="mb-4">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Logout
        </button>
      </div>

      {/* Dicas */}
      <div className="text-xs text-gray-400">
        <div className="mb-1">💡 Dicas:</div>
        <div>• ESPAÇO/ENTER para traçar</div>
        <div>• Cruze linhas para fechar áreas</div>
        <div>• Pontos = km² conquistados!</div>
        <div>• Compita com outros jogadores</div>
        {navigator.geolocation && (
          <div>• Ative GPS para posição real</div>
        )}
      </div>
    </div>
  )
}


