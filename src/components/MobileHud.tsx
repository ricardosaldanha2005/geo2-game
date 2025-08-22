import { useRealtime } from '@/hooks/useRealtime'
import { useGeo } from '@/hooks/useGeo'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'
import { useMobile } from '@/hooks/useMobile'
import { useState, useEffect } from 'react'
import { safeStorage } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'

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

  // Determinar equipa do utilizador e mostrar apenas o total ativo dessa equipa
  const { user } = useAuth()
  const myTeam = (user as any)?.user_metadata?.team?.toLowerCase?.() || 'green'
  const teamKey = (['green','blue','red'] as const).includes(myTeam as any) ? myTeam as 'green'|'blue'|'red' : 'green'
  const myStats = normalizedStats[teamKey]
  const myColor = getTeamColor(teamKey)

  return (
    <div className={`mobile-hud bg-gray-900/80 p-2 rounded-xl shadow-lg ${isIPhone ? 'text-xs' : 'text-sm'}`} 
         style={{ border: `1px solid ${myColor}`, width: 'min(100%, 420px)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: myColor }} />
          <span className="text-white font-semibold">Território Ativo</span>
        </div>
        <span className="text-white font-bold">{Number(myStats.total).toFixed(1)} km²</span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
        <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${getBarWidth(Number(myStats.total))}%`, backgroundColor: myColor }} />
      </div>

      <div className="mt-2 grid grid-cols-3 text-center text-[10px] text-gray-300">
        <div>GPS: <span className={isTracking ? 'text-green-400' : 'text-red-400'}>{isTracking ? 'Ativo' : 'Off'}</span></div>
        <div>Territórios: <span className="text-white">{territories.length}</span></div>
        <div>Jogadores: <span className="text-white">{onlineUsers.length}</span></div>
      </div>
    </div>
  )
}
