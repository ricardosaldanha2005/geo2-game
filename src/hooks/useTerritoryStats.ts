import { useState, useEffect, useMemo } from 'react'
import { useRealtimeContext } from '../context/RealtimeContext'
import { supabase } from '@/lib/supabase'

interface TerritoryStats {
  total: number
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
    green: { total: 0 },
    blue: { total: 0 },
    red: { total: 0 }
  })

  // Calcular território total atual de cada equipe
  const calculateTotalTerritories = () => {
    console.log('🔍 Calculando território total atual...')
    console.log('🗺️ Territórios carregados:', territories.length)

    const newStats: TeamStats = {
      green: { total: 0 },
      blue: { total: 0 },
      red: { total: 0 }
    }

    // Calcular área total de cada equipe (apenas territórios ativos)
    territories.forEach(territory => {
      const teamKey = territory.team_id as keyof TeamStats
      const area = territory.area_lost || 0
      
      console.log('🔍 Território:', territory.id, 'equipe:', territory.team_id, 'área:', area, 'status:', territory.status)
      
      if (newStats[teamKey]) {
        newStats[teamKey].total += area
        console.log('✅ Área adicionada para equipe', teamKey, 'total atual:', newStats[teamKey].total)
      } else {
        console.log('❌ Equipe não encontrada:', teamKey)
      }
    })

    // Debug: log das áreas totais por equipe
    console.log('🏆 Território total por equipe:', {
      green: newStats.green.total,
      blue: newStats.blue.total,
      red: newStats.red.total
    })

    setStats(newStats)
  }

  // Atualizar estatísticas quando os territórios mudarem
  useEffect(() => {
    console.log('🔄 Territórios mudaram, atualizando estatísticas. Count:', territories.length)
    calculateTotalTerritories()
  }, [territories])

  // Forçar atualização a cada 30 segundos para evitar spam
  useEffect(() => {
    const interval = setInterval(() => {
      // console.log('🔄 Forçando atualização das estatísticas...')
      calculateTotalTerritories()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Forçar atualização inicial
  useEffect(() => {
    console.log('🚀 Inicializando estatísticas...')
    calculateTotalTerritories()
  }, [])

  // Debug: verificar se o hook está a ser chamado
  console.log('🔧 useTerritoryStats hook executado, territories:', territories.length)

  return {
    stats,
    getTeamStats: (team: 'green' | 'blue' | 'red') => stats[team],
    getTotalTerritories: () => Object.values(stats).reduce((sum, team) => sum + team.total, 0),
    refreshStats: calculateTotalTerritories,
    detectOverlaps: () => [] // Desabilitado para performance
  }
}
