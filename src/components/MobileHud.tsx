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

  // Totais por equipa para pie chart
  const totals = {
    green: Number(normalizedStats.green.total || 0),
    blue: Number(normalizedStats.blue.total || 0),
    red: Number(normalizedStats.red.total || 0)
  }
  const sumTotal = Math.max(0, totals.green + totals.blue + totals.red)
  const pct = sumTotal > 0 ? {
    green: (totals.green / sumTotal) * 100,
    blue: (totals.blue / sumTotal) * 100,
    red: (totals.red / sumTotal) * 100
  } : { green: 0, blue: 0, red: 0 }
  const segments = [
    { color: getTeamColor('green'), value: pct.green, key: 'green' },
    { color: getTeamColor('blue'), value: pct.blue, key: 'blue' },
    { color: getTeamColor('red'), value: pct.red, key: 'red' }
  ]
  let acc = 0
  const gradient = segments
    .filter(s => s.value > 0.01)
    .map(s => {
      const start = acc
      const end = acc + s.value
      acc = end
      return `${s.color} ${start}% ${end}%`
    })
    .join(', ')
  const leader = (['green','blue','red'] as const)
    .map(k => ({ k, v: totals[k] }))
    .sort((a, b) => b.v - a.v)[0]

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

      {/* Pie chart total por equipa */}
      <div className="mt-3 flex items-center gap-3">
        <div
          aria-label="Distribuição por equipa"
          className="shrink-0"
          style={{
            width: 56,
            height: 56,
            borderRadius: '9999px',
            background: sumTotal > 0 ? `conic-gradient(${gradient})` : '#374151',
            border: '2px solid #1f2937'
          }}
        />
        <div className="flex-1 grid grid-cols-3 gap-2 text-[10px]">
          {(['green','blue','red'] as const).map(k => (
            <div key={k} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: getTeamColor(k) }} />
              <span className="text-gray-300 capitalize">{k}:</span>
              <span className="text-white">{totals[k].toFixed(1)} km²</span>
            </div>
          ))}
          <div className="col-span-3 text-[11px] mt-1">
            <span className="text-gray-300">A ganhar:</span>
            <span className="ml-1 font-semibold" style={{ color: getTeamColor(leader.k as any) }}>
              {leader.k.toUpperCase()} ({leader.v.toFixed(1)} km²)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 text-center text-[10px] text-gray-300">
        <div>GPS: <span className={isTracking ? 'text-green-400' : 'text-red-400'}>{isTracking ? 'Ativo' : 'Off'}</span></div>
        <div>Territórios: <span className="text-white">{territories.length}</span></div>
        <div>Jogadores: <span className="text-white">{onlineUsers.length}</span></div>
      </div>
    </div>
  )
}
