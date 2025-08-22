import { useRealtimeContext } from '@/context/RealtimeContext'
import { useGeo } from '@/hooks/useGeo'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'
import { useState, useEffect } from 'react'
import { safeStorage } from '@/lib/storage'

export function Hud() {
  const { territories, onlineUsers } = useRealtimeContext()
  const { isTracking } = useGeo()
  const { stats } = useTerritoryStats()
  const [gameMode, setGameMode] = useState<string>('live')
  
  // Carregar modo do jogo do localStorage
  useEffect(() => {
    const savedMode = safeStorage.getItem('gameMode')
    setGameMode(savedMode || 'live')
  }, [])
  
  // Função para alternar modo
  const toggleGameMode = () => {
    const newMode = gameMode === 'mock' ? 'live' : 'mock'
    setGameMode(newMode)
    safeStorage.setItem('gameMode', newMode)
    // Recarregar a página para aplicar as mudanças
    window.location.reload()
  }

  // Debug: log das estatísticas no HUD
  console.log('🏆 HUD - Estatísticas recebidas:', stats)



  const getTeamColor = (teamColor: string) => {
    switch (teamColor) {
      case 'green': return '#16a34a'
      case 'blue': return '#3b82f6'
      case 'red': return '#dc2626'
      default: return '#6b7280'
    }
  }



  // Calcular largura máxima para os gráficos
  // Normalizar para evitar undefined em iOS
  const normalizeTeamStats = (raw: any) => ({ total: Number(raw?.total ?? 0) })
  const normalizedStats = {
    green: normalizeTeamStats((stats as any).green),
    blue: normalizeTeamStats((stats as any).blue),
    red: normalizeTeamStats((stats as any).red)
  }

  const maxArea = Math.max(
    ...Object.values(normalizedStats).map(team => team.total)
  )

  const getBarWidth = (value: number) => {
    if (maxArea === 0) return 0
    return Math.min((value / maxArea) * 100, 100)
  }

  return (
    <div className="hud bg-gray-800 p-4 rounded-lg shadow-lg" style={{ border: '2px solid #3b82f6' }}>
      <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '10px' }}>
        HUD
      </div>
      <h3 className="text-white font-semibold mb-3">🏆 Território Total das Equipes</h3>
      
      <div className="space-y-4">
        {(['green', 'blue', 'red'] as const).map((teamColor) => {
          const teamName = teamColor === 'green' ? 'Verdes' : teamColor === 'blue' ? 'Azul' : 'Vermelho'
          const teamStats = normalizedStats[teamColor]
          const teamColorHex = getTeamColor(teamColor)
          
          return (
            <div key={teamColor} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: teamColorHex }}
                  />
                  <span className="text-white font-semibold">{teamName}</span>
                </div>
                <span className="text-white font-bold text-lg">
                  {teamStats.total.toFixed(2)} km²
                </span>
              </div>
              
              {/* Barra de progresso do território total */}
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getBarWidth(teamStats.total)}%`,
                    backgroundColor: teamColorHex
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Territórios:</span>
          <span className="text-white font-semibold">{territories.length}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-300 text-sm">GPS:</span>
          <span className={`text-sm ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
            {isTracking ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-300 text-sm">Jogadores:</span>
          <span className="text-white font-semibold">{onlineUsers.length}</span>
        </div>
        
        {/* Botão para alternar modo */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <button
            onClick={toggleGameMode}
            className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              gameMode === 'mock' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {gameMode === 'mock' ? '🎭 Modo Teste (Gaia)' : '🌍 Modo Real (GPS)'}
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            {gameMode === 'mock' 
              ? 'Usando posição fixa para testes' 
              : 'Usando GPS real do dispositivo'
            }
          </p>
        </div>

      </div>
    </div>
  )
}


