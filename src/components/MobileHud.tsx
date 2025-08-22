import { useRealtime } from '@/hooks/useRealtime'
import { useGeo } from '@/hooks/useGeo'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'
import { useMobile } from '@/hooks/useMobile'
import { useState, useEffect } from 'react'
import { safeStorage } from '@/lib/storage'

export function MobileHud() {
  const { territories, onlineUsers } = useRealtime()
  const { isTracking } = useGeo()
  const { stats } = useTerritoryStats()
  const { isIPhone } = useMobile()
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

  const getTeamColor = (teamColor: string) => {
    switch (teamColor) {
      case 'green': return '#16a34a'
      case 'blue': return '#3b82f6'
      case 'red': return '#dc2626'
      default: return '#6b7280'
    }
  }

  // Normalizar estatísticas para evitar undefined (useTerritoryStats pode expor apenas 'total')
  const normalizeTeamStats = (raw: any) => {
    const total = Number(raw?.total ?? 0)
    const conquered = Number(raw?.conquered ?? total)
    const lost = Number(raw?.lost ?? 0)
    const expired = Number(raw?.expired ?? 0)
    const net = Number(raw?.net ?? (conquered - lost - expired))
    return { total, conquered, lost, expired, net }
  }

  const normalizedStats = {
    green: normalizeTeamStats((stats as any).green),
    blue: normalizeTeamStats((stats as any).blue),
    red: normalizeTeamStats((stats as any).red)
  }

  const maxArea = Math.max(
    ...Object.values(normalizedStats).map(team => Math.max(team.conquered, team.lost, team.expired))
  )

  const getBarWidth = (value: number) => {
    if (maxArea === 0) return 0
    return Math.min((value / maxArea) * 100, 100)
  }

  return (
    <div className={`mobile-hud bg-gray-800 p-2 rounded-lg shadow-lg ${isIPhone ? 'text-xs' : 'text-sm'}`} 
         style={{ border: '1px solid #3b82f6', maxHeight: '60vh', overflowY: 'auto' }}>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-xs">🏆 Estatísticas</h3>
        <div className="text-xs text-gray-400">
          {territories.length} territórios
        </div>
      </div>
      
      <div className="space-y-2">
        {(['green', 'blue', 'red'] as const).map((teamColor) => {
          const teamName = teamColor === 'green' ? 'Verdes' : teamColor === 'blue' ? 'Azul' : 'Vermelho'
          const teamStats = normalizedStats[teamColor]
          const teamColorHex = getTeamColor(teamColor)
          
          return (
            <div key={teamColor} className="bg-gray-700 p-2 rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: teamColorHex }}
                  />
                  <span className="text-white font-semibold">{teamName}</span>
                </div>
                <span className={`font-semibold ${teamStats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {teamStats.net >= 0 ? '+' : ''}{Number(teamStats.net).toFixed(1)}
                </span>
              </div>
              
              {/* Barras compactas */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">C:</span>
                  <span className="text-white">{Number(teamStats.conquered).toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(Number(teamStats.conquered))}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-red-400">P:</span>
                  <span className="text-white">{Number(teamStats.lost).toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-red-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(Number(teamStats.lost))}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-orange-400">E:</span>
                  <span className="text-white">{Number(teamStats.expired).toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(Number(teamStats.expired))}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-300">GPS:</span>
          <span className={`${isTracking ? 'text-green-400' : 'text-red-400'}`}>
            {isTracking ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Jogadores:</span>
          <span className="text-white">{onlineUsers.length}</span>
        </div>
        
        {/* Botão para alternar modo - versão mobile */}
        <div className="mt-2 pt-2 border-t border-gray-600">
          <button
            onClick={toggleGameMode}
            className={`w-full py-1 px-2 rounded text-xs font-semibold transition-colors ${
              gameMode === 'mock' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {gameMode === 'mock' ? '🎭 Teste' : '🌍 GPS'}
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            {gameMode === 'mock' ? 'Posição fixa' : 'GPS real'}
          </p>
        </div>
      </div>
    </div>
  )
}
