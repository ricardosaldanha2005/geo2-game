import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface Territory {
  id: string
  team_id: string
  player_id: string
  polygon: {
    type: string
    coordinates: number[][][]
  }
  area: number
  conquered_at: string
  created_at: string
  lifetime_seconds: number
  expires_at: string
}

interface User {
  id: string
  name: string
  team: 'green' | 'blue' | 'red'
  current_position: [number, number] | null
  score: number
}

const normalizeTeam = (team?: string): 'green' | 'blue' | 'red' => {
  const t = (team || '').toString().toLowerCase().trim()
  if (t === 'red') return 'red'
  if (t === 'blue') return 'blue'
  if (t === 'green') return 'green'
  return 'green'
}

export function useRealtime() {
  const { user } = useAuth()
  const [territories, setTerritories] = useState<Territory[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])

  // Debug: monitorar mudanças no estado territories
  useEffect(() => {
    console.log('🗺️ Estado territories mudou:', territories.length, 'territórios')
  }, [territories])

  useEffect(() => {
    console.log('🔄 useRealtime: Iniciando...')
    console.log('👤 Usuário atual:', user?.id)
    // Verificar se o Supabase está configurado
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔧 useRealtime: Supabase config:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, hasSupabase: !!supabase })
    
    if (!supabaseUrl || !supabaseAnonKey || !supabase) {
      console.log('🔄 useRealtime: Usando modo offline/mock')
      // Criar dados mock para funcionar offline
      const mockTerritories: Territory[] = []
      const mockUsers: User[] = [{
        id: 'mock-user',
        name: 'Jogador Offline',
        team: 'green',
        current_position: null,
        score: 0
      }]
      setTerritories(mockTerritories)
      setOnlineUsers(mockUsers)
      return
    }

    if (!user) return

    // Buscar dados iniciais imediatamente
    fetchTerritories()
    fetchOnlineUsers()
    
    // Forçar busca inicial após um pequeno delay para garantir que o usuário foi criado
    setTimeout(() => {
      fetchOnlineUsers()
      fetchTerritories()
    }, 1000)

    // Verificar se estamos no modo mock
    const gameMode = localStorage.getItem('gameMode')
    const isMockMode = gameMode === 'mock'
    
    if (isMockMode) {
      // No modo mock, usar polling em vez de realtime
      const interval = setInterval(() => {
        fetchTerritories()
        fetchOnlineUsers()
      }, 10000) // Atualizar a cada 10 segundos para melhor performance
      
      return () => clearInterval(interval)
    }

                                                     // Sistema de polling MUITO LENTO para evitar loops infinitos
        const mainInterval = setInterval(() => {
          fetchTerritories()
          fetchOnlineUsers()
        }, 30000) // Verificar a cada 30 segundos

        // Sistema de verificação de áreas expiradas
        const expirationCheckInterval = setInterval(() => {
          console.log('⏰ Verificação de expiração executada')
          checkExpiredTerritories()
        }, 60000) // Verificar a cada 60 segundos

         // Sistema simplificado - apenas polling agressivo
     // Removendo real-time que pode estar a causar conflitos

                                       return () => {
         clearInterval(mainInterval)
         clearInterval(expirationCheckInterval)
       }
  }, [user])

     const fetchTerritories = async () => {
     if (!supabase) return
     
     console.log('🗺️ fetchTerritories: Iniciando busca...')
     try {
       const { data, error } = await supabase
         .from('territories')
         .select('*')
         .order('created_at', { ascending: false })

       if (error) throw error
       
       console.log('🗺️ fetchTerritories: Dados recebidos:', data?.length || 0, 'territórios')

       // Sempre atualizar os territórios para garantir que estão sincronizados
       setTerritories(data || [])
       console.log('✅ Territórios atualizados no estado:', data?.length || 0, 'territórios')
       if (data && data.length > 0) {
         console.log('📋 Primeiro território:', data[0])
       }
       
     } catch (error) {
       console.error('❌ Erro ao buscar territórios:', error)
     }
   }

  const fetchOnlineUsers = async () => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      if (error) throw error
      
      // Converter posições do formato PostgreSQL para array e normalizar equipa
      const usersWithPositions = (data || []).map(u => ({
        ...u,
        team: normalizeTeam(u.team),
        current_position: u.current_position ? 
          u.current_position.replace(/[()]/g, '').split(',').map(Number) as [number, number] :
          null
      })) as unknown as User[]
      
      setOnlineUsers(usersWithPositions)
    } catch (error) {
      // Erro silencioso
    }
  }

  const addTerritory = async (polygon: any, area: number, team?: string) => {
    if (!user || !supabase) return

    try {
      console.log('🎯 Adicionando território - Área:', area, 'Equipe:', team)
      
      // Usar a equipa fornecida ou buscar do usuário
      
      // Buscar dados atualizados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', userError)
      }
      
      const teamId = normalizeTeam(team || userData?.team || (user as any).team)
      
      const { data, error } = await supabase
        .from('territories')
        .insert({
          team_id: teamId,
          player_id: user.id,
          polygon,
          area,
          conquered_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Território criado com ID:', data.id)

      // Buscar score atual do usuário e incrementar
      const { data: me, error: meErr } = await supabase
        .from('users')
        .select('score')
        .eq('id', user.id)
        .single()
      if (meErr) throw meErr
      // Converter área para inteiro (multiplicar por 1000 para manter precisão)
      const areaPoints = Math.round(area * 1000)
      const newScore = (me?.score || 0) + areaPoints
      const { error: scoreError } = await supabase
        .from('users')
        .update({ score: newScore })
        .eq('id', user.id)
      if (scoreError) throw scoreError

      console.log('📈 Score atualizado para:', newScore)

             // Sistema simplificado - sem broadcasts ou notificações

       // Processar conquista de territórios
       console.log('🔄 Iniciando processamento de conquista...')
       await processTerritoryConquest(data)

             // Refresh único após processamento
       setTimeout(async () => {
         await fetchTerritories()
       }, 1000)

      return data
    } catch (error) {
      console.error('❌ Erro ao adicionar território:', error)
      throw error
    }
  }

  // Função para processar conquista de territórios (nova lógica)
  const processTerritoryConquest = async (newTerritory: any) => {
    if (!supabase) return

    try {
      console.log('🔄 Processando conquista para território:', newTerritory.id, 'equipe:', newTerritory.team_id)
      
      // Buscar todos os territórios existentes
      const { data: allTerritories, error } = await supabase
        .from('territories')
        .select('*')
        .neq('id', newTerritory.id) // Excluir o território recém-criado

      if (error) throw error

      console.log('📊 Territórios existentes encontrados:', allTerritories?.length || 0)

      const territoriesToRemove: string[] = []
      const playersToUpdate: { [key: string]: number } = {}

      // Verificar cada território existente
      for (const existingTerritory of allTerritories || []) {
        // Só verificar territórios de equipes diferentes
        if (existingTerritory.team_id === newTerritory.team_id) {
          continue
        }

        // Verificar se o território existente está dentro do novo território
        const isInside = isTerritoryInsidePolygon(existingTerritory, newTerritory.polygon)
        
        console.log('🔍 Verificando território:', existingTerritory.id, 'equipe:', existingTerritory.team_id, 'dentro?', isInside)

                 if (isInside) {
           territoriesToRemove.push(existingTerritory.id)
           
           // Acumular área perdida por jogador
           const playerId = existingTerritory.player_id
           playersToUpdate[playerId] = (playersToUpdate[playerId] || 0) + existingTerritory.area
           
           // Registar conquista no histórico
           try {
             await supabase
               .from('conquest_history')
               .insert({
                 territory_id: existingTerritory.id,
                 conquering_team: newTerritory.team_id,
                 conquered_team: existingTerritory.team_id,
                 area_lost: existingTerritory.area,
                 player_id: user?.id
               })
             console.log('📊 Conquista registada no histórico:', existingTerritory.team_id, 'perdeu', existingTerritory.area, 'km²')
           } catch (historyError) {
             console.error('❌ Erro ao registar conquista no histórico:', historyError)
           }
           
           console.log('🗑️ Território marcado para remoção:', existingTerritory.id)
         }
      }

      console.log('📋 Territórios para remover:', territoriesToRemove.length)

              // Remover territórios conquistados
        if (territoriesToRemove.length > 0) {
          console.log('🗑️ Removendo territórios:', territoriesToRemove)
          
          // Tentar deletar um por um para identificar qual está falhando
          for (const territoryId of territoriesToRemove) {
            console.log('🗑️ Tentando remover território:', territoryId)
            const { error: deleteError } = await supabase
              .from('territories')
              .delete()
              .eq('id', territoryId)
            
            if (deleteError) {
              console.error('❌ Erro ao remover território', territoryId, ':', deleteError)
            } else {
              console.log('✅ Território removido com sucesso:', territoryId)
            }
          }
          
          // Verificar se os territórios foram realmente removidos
          const { data: verifyData, error: verifyError } = await supabase
            .from('territories')
            .select('id')
            .in('id', territoriesToRemove)
          
          if (verifyError) {
            console.error('❌ Erro ao verificar remoção:', verifyError)
          } else {
            console.log('🔍 Verificação: territórios ainda no banco:', verifyData?.length || 0)
            if (verifyData && verifyData.length > 0) {
              console.log('⚠️ ALERTA: Territórios não foram removidos!')
              console.log('📋 IDs que ainda existem:', verifyData.map(t => t.id))
            } else {
              console.log('✅ Confirmação: Territórios removidos do banco')
            }
          }
          
                                // Forçar atualização única dos dados locais
            await fetchTerritories()
        } else {
          console.log('ℹ️ Nenhum território para remover')
        }

      // Atualizar scores dos jogadores que perderam territórios
      for (const [playerId, lostArea] of Object.entries(playersToUpdate)) {
        const { data: player } = await supabase
          .from('users')
          .select('score')
          .eq('id', playerId)
          .single()

        if (player) {
          // Converter área perdida para inteiro (multiplicar por 1000 para manter precisão)
          const lostAreaPoints = Math.round(lostArea * 1000)
          const newScore = Math.max(0, (player.score || 0) - lostAreaPoints)
          await supabase
            .from('users')
            .update({ score: newScore })
            .eq('id', playerId)
          
          console.log('📉 Score atualizado para jogador:', playerId, 'nova pontuação:', newScore)
        }
      }
    } catch (error) {
      console.error('❌ Erro no processamento de conquista:', error)
    }
  }

  // Função para verificar se um território está dentro de um polígono
  const isTerritoryInsidePolygon = (territory: any, polygon: any): boolean => {
    try {
      const territoryCoords = territory.polygon.coordinates[0]
      const polygonCoords = polygon.coordinates[0]
      
      if (!territoryCoords || !polygonCoords) {
        console.log('❌ Coordenadas inválidas')
        return false
      }

      console.log('🔍 Verificando território com', territoryCoords.length, 'pontos')
      console.log('🎯 Polígono tem', polygonCoords.length, 'pontos')

      // **LÓGICA SIMPLIFICADA**: Verificar apenas o centro do território
      // Calcular o centro do território
      let centerX = 0, centerY = 0
      for (const coord of territoryCoords) {
        centerX += coord[0]
        centerY += coord[1]
      }
      centerX /= territoryCoords.length
      centerY /= territoryCoords.length

      console.log('📍 Centro do território:', [centerX, centerY])

      // Verificar se o centro está dentro do polígono
      const centerInside = isPointInPolygon([centerX, centerY], polygonCoords)
      console.log('🎯 Centro dentro do polígono?', centerInside)

      // **CONDIÇÃO MUITO PERMISSIVA**: Se o centro estiver dentro, conquistar
      return centerInside
    } catch (error) {
      console.error('❌ Erro na verificação:', error)
      return false
    }
  }

     // Função para verificar se um ponto está dentro de um polígono (ray casting)
   const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
     try {
       const [x, y] = point
       let inside = false
       
       // Verificar se o polígono tem pelo menos 3 pontos
       if (polygon.length < 3) {
         console.log('❌ Polígono com menos de 3 pontos')
         return false
       }
       
       console.log('🎯 Verificando ponto', [x, y], 'em polígono com', polygon.length, 'pontos')
       
       for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
         const [xi, yi] = polygon[i]
         const [xj, yj] = polygon[j]
         
         if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
           inside = !inside
         }
       }
       
       console.log('✅ Resultado ray casting:', inside)
       return inside
     } catch (error) {
       console.error('❌ Erro no ray casting:', error)
       return false
     }
   }

   // Função para verificar e processar áreas expiradas
   const checkExpiredTerritories = async () => {
     if (!supabase) return

     try {
       console.log('⏰ Verificando áreas expiradas...')
       
       // Primeiro, verificar se há territórios expirados
       const { data: expiredTerritories, error: checkError } = await supabase
         .from('territories')
         .select('id, team_id, player_id, area')
         .lte('expires_at', new Date().toISOString())

       if (checkError) {
         console.error('❌ Erro ao verificar territórios expirados:', checkError)
         return
       }

       if (expiredTerritories && expiredTerritories.length > 0) {
         console.log('🕐 Encontrados territórios expirados:', expiredTerritories.length)
         
         // Processar cada território expirado
         for (const territory of expiredTerritories) {
           try {
             // Registrar no histórico de conquistas como "esgotada"
             await supabase
               .from('conquest_history')
               .insert({
                 territory_id: territory.id,
                 conquering_team: 'expired',
                 conquered_team: territory.team_id,
                 area_lost: territory.area,
                 player_id: territory.player_id
               })

             // Descontar pontos do jogador
             const { data: player } = await supabase
               .from('users')
               .select('score')
               .eq('id', territory.player_id)
               .single()

             if (player) {
               const lostAreaPoints = Math.round(territory.area * 1000)
               const newScore = Math.max(0, (player.score || 0) - lostAreaPoints)
               await supabase
                 .from('users')
                 .update({ score: newScore })
                 .eq('id', territory.player_id)
             }

             // Remover o território expirado
             await supabase
               .from('territories')
               .delete()
               .eq('id', territory.id)

             console.log('🗑️ Território expirado removido:', territory.id)
           } catch (territoryError) {
             console.error('❌ Erro ao processar território expirado:', territory.id, territoryError)
           }
         }

         // Atualizar dados após processamento
         console.log('🔄 Atualizando dados após remoção de territórios expirados...')
         await fetchTerritories()
         await fetchOnlineUsers()
       } else {
         console.log('✅ Nenhum território expirado encontrado')
       }
     } catch (error) {
       console.error('❌ Erro ao verificar áreas expiradas:', error)
     }
   }





  return {
    territories,
    onlineUsers,
    addTerritory,
    fetchTerritories,
    fetchOnlineUsers
  }
}
