import { useRealtime } from '@/hooks/useRealtime'
import { useGeo } from '@/hooks/useGeo'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'
import { useMobile } from '@/hooks/useMobile'
import { useState, useEffect } from 'react'
import { safeStorage } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

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

  // Total de utilizadores (para exibir online/total) – opcional
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    const fetchTotal = async () => {
      if (!supabase) return
      try {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
        if (active) setTotalUsers(count ?? null)
      } catch {
        // ignore
      }
    }
    fetchTotal()
    return () => { active = false }
  }, [])

  return (
    <div className={`mobile-hud bg-gray-800 px-2 py-1.5 rounded-lg shadow-lg ${isIPhone ? 'text-[11px]' : 'text-sm'}`} 
         style={{ border: `1px solid ${myColor}`, width: '100%' }}>
      <div className="flex items-center justify-between gap-2">
        {/* Texto à esquerda (linha única para menor altura) */}
        <div className="flex-1 text-left text-[11px] md:text-[12px] leading-tight">
          <div className="text-white font-semibold">
            Território Total {sumTotal.toFixed(1)} km² · Territórios {territories.length} · Online {onlineUsers.length}{totalUsers ? `/${totalUsers}` : ''}
          </div>
          <div className="text-gray-300 mt-0.5">A ganhar: <span className="font-semibold" style={{ color: getTeamColor(leader.k as any) }}>{leader.k.toUpperCase()}</span></div>
        </div>

        {/* Pie à direita com SVG (menor) */}
        <div className="shrink-0" style={{ width: 88, height: 88 }}>
          <svg viewBox="0 0 42 42" width="88" height="88" aria-label="Distribuição por equipa">
            <circle cx="21" cy="21" r="20" fill="#111827" stroke="#ffffff" strokeWidth="1.5" />
            {(() => {
              const r = 16.5
              const c = 2 * Math.PI * r
              const g = (pct.green / 100) * c
              const b = (pct.blue / 100) * c
              const rr = (pct.red / 100) * c
              const segs = [
                { color: getTeamColor('green'), len: g },
                { color: getTeamColor('blue'), len: b },
                { color: getTeamColor('red'), len: rr },
              ]
              let offset = 0
              return segs.map((s, i) => {
                const el = (
                  <circle key={i}
                    cx="21" cy="21" r={r}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth="6"
                    strokeDasharray={`${s.len} ${c - s.len}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 21 21)"
                  />
                )
                offset += s.len
                return el
              })
            })()}
          </svg>
        </div>
      </div>
    </div>
  )
}
