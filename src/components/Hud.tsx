import { useRealtime } from '@/hooks/useRealtime'
import { useGeo } from '@/hooks/useGeo'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'

export function Hud() {
  const { territories, onlineUsers } = useRealtime()
  const { isTracking } = useGeo()
  const { stats } = useTerritoryStats()

  // Debug: log das estatísticas no HUD (removido para evitar spam)
  // console.log('🏆 HUD - Estatísticas recebidas:', stats)



  const getTeamColor = (teamColor: string) => {
    switch (teamColor) {
      case 'green': return '#16a34a'
      case 'blue': return '#3b82f6'
      case 'red': return '#dc2626'
      default: return '#6b7280'
    }
  }



  // Calcular largura máxima para os gráficos
  const maxArea = Math.max(
    ...Object.values(stats).map(team => Math.max(team.conquered, team.lost, team.expired))
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
      <h3 className="text-white font-semibold mb-3">🏆 Estatísticas das Equipes</h3>
      
      <div className="space-y-4">
        {(['green', 'blue', 'red'] as const).map((teamColor) => {
          const teamName = teamColor === 'green' ? 'Verdes' : teamColor === 'blue' ? 'Azul' : 'Vermelho'
          const teamStats = stats[teamColor]
          const teamColorHex = getTeamColor(teamColor)
          
          return (
            <div key={teamColor} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: teamColorHex }}
                  />
                  <span className="text-white font-semibold">{teamName}</span>
                </div>
              </div>
              
              {/* Gráfico de território conquistado */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-400">Conquistado</span>
                  <span className="text-white">{teamStats.conquered.toFixed(2)} km²</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(teamStats.conquered)}%` }}
                  />
                </div>
              </div>
              
              {/* Gráfico de território perdido */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400">Perdido</span>
                  <span className="text-white">{teamStats.lost.toFixed(2)} km²</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(teamStats.lost)}%` }}
                  />
                </div>
              </div>

              {/* Gráfico de território esgotado */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-orange-400">Esgotado</span>
                  <span className="text-white">{teamStats.expired.toFixed(2)} km²</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getBarWidth(teamStats.expired)}%` }}
                  />
                </div>
              </div>
              
              {/* Saldo líquido */}
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Saldo:</span>
                  <span className={`font-semibold ${teamStats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {teamStats.net >= 0 ? '+' : ''}{teamStats.net.toFixed(2)} km²
                  </span>
                </div>
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
        

      </div>
    </div>
  )
}


