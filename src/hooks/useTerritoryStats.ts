import { useState, useEffect, useMemo } from 'react'
import { useRealtime } from './useRealtime'
import { supabase } from '@/lib/supabase'

interface TerritoryStats {
  conquered: number
  lost: number
  expired: number
  net: number
}

interface TeamStats {
  green: TerritoryStats
  blue: TerritoryStats
  red: TerritoryStats
}





export function useTerritoryStats() {
  const { territories } = useRealtime()
  const [stats, setStats] = useState<TeamStats>({
    green: { conquered: 0, lost: 0, expired: 0, net: 0 },
    blue: { conquered: 0, lost: 0, expired: 0, net: 0 },
    red: { conquered: 0, lost: 0, expired: 0, net: 0 }
  })

  // Buscar histórico de conquistas e calcular estatísticas
  const fetchConquestHistory = async () => {
    if (!supabase) return

    try {
      const { data: conquestData, error } = await supabase
        .from('conquest_history')
        .select('*')

      if (error) throw error

             console.log('📋 Histórico de conquistas carregado:', conquestData?.length || 0, 'registros')

       const newStats: TeamStats = {
         green: { conquered: 0, lost: 0, expired: 0, net: 0 },
         blue: { conquered: 0, lost: 0, expired: 0, net: 0 },
         red: { conquered: 0, lost: 0, expired: 0, net: 0 }
       }

       // Calcular áreas conquistadas (apenas do histórico para evitar duplicação)
       console.log('🗺️ Territórios ativos carregados:', territories.length)
      
             // Calcular áreas conquistadas (apenas territórios ativos)
       territories.forEach(territory => {
         const teamKey = territory.team_id as keyof TeamStats
         if (newStats[teamKey]) {
           newStats[teamKey].conquered += territory.area || 0
         }
       })

      // Calcular áreas perdidas e esgotadas (histórico de conquistas)
      let expiredCount = 0
      let lostCount = 0
      
      conquestData?.forEach(conquest => {
        console.log('🔍 Processando conquista:', conquest)
        const conqueredTeam = conquest.conquered_team as keyof TeamStats
        console.log('🔍 Equipe conquistada:', conqueredTeam, 'Tipo:', typeof conqueredTeam)
        if (newStats[conqueredTeam]) {
                     if (conquest.conquering_team === 'expired') {
             // Área esgotada
             newStats[conqueredTeam].expired += conquest.area_lost || 0
             expiredCount++
             console.log('🕐 Área esgotada encontrada:', conquest.area_lost, 'para equipe:', conqueredTeam)
           } else {
             // Área perdida por conquista
             newStats[conqueredTeam].lost += conquest.area_lost || 0
             lostCount++
             console.log('💔 Área perdida encontrada:', conquest.area_lost, 'para equipe:', conqueredTeam)
           }
        }
      })

             console.log('📊 Processados:', expiredCount, 'áreas esgotadas e', lostCount, 'áreas perdidas')

       // Debug: log das áreas conquistadas por equipe
       console.log('🏆 Áreas conquistadas por equipe:', {
         green: newStats.green.conquered,
         blue: newStats.blue.conquered,
         red: newStats.red.conquered
       })

       // Debug: log das áreas esgotadas por equipe
       console.log('🕐 Áreas esgotadas por equipe:', {
         green: newStats.green.expired,
         blue: newStats.blue.expired,
         red: newStats.red.expired
       })

      // Calcular saldo (conquistado - perdido - esgotado)
      Object.keys(newStats).forEach(team => {
        const teamKey = team as keyof TeamStats
        newStats[teamKey].net = newStats[teamKey].conquered - newStats[teamKey].lost - newStats[teamKey].expired
      })

             // Debug: log das estatísticas
       console.log('📊 Estatísticas atualizadas:', {
         green: newStats.green,
         blue: newStats.blue,
         red: newStats.red
       })

      setStats(newStats)
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de conquistas:', error)
    }
  }

  // Atualizar estatísticas quando os territórios mudarem
  useEffect(() => {
    fetchConquestHistory()
  }, [territories])

  // Forçar atualização a cada 30 segundos para evitar spam
  useEffect(() => {
    const interval = setInterval(() => {
      // console.log('🔄 Forçando atualização das estatísticas...')
      fetchConquestHistory()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Forçar atualização inicial
  useEffect(() => {
    console.log('🚀 Inicializando estatísticas...')
    fetchConquestHistory()
  }, [])

  return {
    stats,
    getTeamStats: (team: 'green' | 'blue' | 'red') => stats[team],
    getTotalConquered: () => Object.values(stats).reduce((sum, team) => sum + team.conquered, 0),
    getTotalLost: () => Object.values(stats).reduce((sum, team) => sum + team.lost, 0),
    refreshStats: fetchConquestHistory,
    detectOverlaps: () => [] // Desabilitado para performance
  }
}
