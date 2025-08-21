import { useState, useEffect, useMemo } from 'react'
import { useRealtimeContext } from '../context/RealtimeContext'
import { supabase } from '@/lib/supabase'

interface TerritoryStats {
  conquered: number
  lost: number
  expired: number
  net: number
}

interface Territory {
  id: string;
  team_id: string;
  player_id: string;
  polygon: any;
  area: number;
  created_at: string;
}

interface TeamStats {
  green: TerritoryStats
  blue: TerritoryStats
  red: TerritoryStats
}





export function useTerritoryStats() {
  const { territories } = useRealtimeContext()
  const [stats, setStats] = useState<TeamStats>({
    green: { conquered: 0, lost: 0, expired: 0, net: 0 },
    blue: { conquered: 0, lost: 0, expired: 0, net: 0 },
    red: { conquered: 0, lost: 0, expired: 0, net: 0 }
  })

    // Calcular estatísticas baseadas nas tags de status
  const calculateStats = () => {
    console.log('🔍 Calculando estatísticas baseadas em tags de status...')
    console.log('🗺️ Territórios carregados:', territories.length)

    const newStats: TeamStats = {
      green: { conquered: 0, lost: 0, expired: 0, net: 0 },
      blue: { conquered: 0, lost: 0, expired: 0, net: 0 },
      red: { conquered: 0, lost: 0, expired: 0, net: 0 }
    }

    let createdCount = 0
    let expiredCount = 0
    let lostCount = 0

    // Processar cada território baseado no seu status
    territories.forEach(territory => {
      const teamKey = territory.team_id as keyof TeamStats
      const area = territory.area || 0
      const status = territory.status || 'created'

      console.log('🔍 Território:', territory.id, 'equipe:', territory.team_id, 'área:', area, 'status:', status)

      if (newStats[teamKey]) {
        switch (status) {
          case 'created':
            newStats[teamKey].conquered += area
            createdCount++
            console.log('✅ Área criada adicionada para equipe', teamKey, 'total atual:', newStats[teamKey].conquered)
            break
          case 'expired':
            newStats[teamKey].expired += area
            expiredCount++
            console.log('🕐 Área expirada adicionada para equipe', teamKey, 'total atual:', newStats[teamKey].expired)
            break
          case 'lost':
            newStats[teamKey].lost += area
            lostCount++
            console.log('💔 Área perdida adicionada para equipe', teamKey, 'total atual:', newStats[teamKey].lost)
            break
        }
      } else {
        console.log('❌ Equipe não encontrada:', teamKey)
      }
    })

    console.log('📊 Processados:', createdCount, 'áreas criadas,', expiredCount, 'áreas esgotadas e', lostCount, 'áreas perdidas')

    // Debug: log das áreas por status
    console.log('🏆 Áreas criadas por equipe:', {
      green: newStats.green.conquered,
      blue: newStats.blue.conquered,
      red: newStats.red.conquered
    })

    console.log('🕐 Áreas esgotadas por equipe:', {
      green: newStats.green.expired,
      blue: newStats.blue.expired,
      red: newStats.red.expired
    })

    console.log('💔 Áreas perdidas por equipe:', {
      green: newStats.green.lost,
      blue: newStats.blue.lost,
      red: newStats.red.lost
    })

    // Calcular saldo (conquistado - perdido - esgotado)
    Object.keys(newStats).forEach(team => {
      const teamKey = team as keyof TeamStats
      newStats[teamKey].net = newStats[teamKey].conquered - newStats[teamKey].lost - newStats[teamKey].expired
    })

    // Debug: log das estatísticas finais
    console.log('📊 Estatísticas atualizadas:', {
      green: newStats.green,
      blue: newStats.blue,
      red: newStats.red
    })

    setStats(newStats)
  }

  // Atualizar estatísticas quando os territórios mudarem
  useEffect(() => {
    console.log('🔄 Territórios mudaram, atualizando estatísticas. Count:', territories.length)
    calculateStats()
  }, [territories])

  // Forçar atualização a cada 30 segundos para evitar spam
  useEffect(() => {
    const interval = setInterval(() => {
      // console.log('🔄 Forçando atualização das estatísticas...')
      calculateStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Forçar atualização inicial
  useEffect(() => {
    console.log('🚀 Inicializando estatísticas...')
    calculateStats()
  }, [])

  // Debug: verificar se o hook está a ser chamado
  console.log('🔧 useTerritoryStats hook executado, territories:', territories.length)

  return {
    stats,
    getTeamStats: (team: 'green' | 'blue' | 'red') => stats[team],
    getTotalConquered: () => Object.values(stats).reduce((sum, team) => sum + team.conquered, 0),
    getTotalLost: () => Object.values(stats).reduce((sum, team) => sum + team.lost, 0),
    refreshStats: calculateStats,
    detectOverlaps: () => [] // Desabilitado para performance
  }
}
