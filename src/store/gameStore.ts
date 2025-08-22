import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Territory {
  id: string
  color: 'green' | 'blue' | 'red'
  points: [number, number][]
  area: number
}

interface Player {
  id: string
  name: string
  team: 'green' | 'blue' | 'red'
  position: [number, number] | null
  score: number
}

interface GameState {
  territories: Territory[]
  players: Player[]
  currentPlayer: Player | null
  loading: boolean
  error: string | null
  
  // Actions
  initializeCurrentPlayer: () => Promise<void>
  fetchTerritories: () => Promise<void>
  fetchPlayers: () => Promise<void>
  updatePlayerPosition: (position: [number, number]) => Promise<void>
  captureTerritory: (territoryId: string) => Promise<void>
  resetGame: () => void
}

const normalizeTeam = (team?: string): 'green' | 'blue' | 'red' => {
  const t = (team || '').toString().toLowerCase().trim()
  if (t === 'red') return 'red'
  if (t === 'blue') return 'blue'
  if (t === 'green') return 'green'
  return 'green'
}

export const useGameStore = create<GameState>((set, get) => ({
  territories: [],
  players: [],
  currentPlayer: null,
  loading: false,
  error: null,

  // Função para inicializar o currentPlayer com dados do usuário
  initializeCurrentPlayer: async () => {
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Buscar dados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team, name, score')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError)
        return
      }
      
      if (userData) {
        set({
          currentPlayer: {
            id: user.id,
            name: userData.name,
            team: normalizeTeam(userData.team),
            position: null,
            score: userData.score || 0
          }
        })
        console.log('✅ CurrentPlayer inicializado:', userData.team)
      }
    } catch (error) {
      console.error('Erro ao inicializar currentPlayer:', error)
    }
  },

  fetchTerritories: async () => {

    // Verificar se o Supabase está configurado
    if (!supabase) {
      set({ error: 'Supabase não configurado', loading: false })
      return
    }

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('territories')
        .select('*')

      if (error) {
        console.error('gameStore: Erro ao buscar territórios:', error)
        set({ error: error.message, loading: false })
        return
      }

      set({ territories: data || [], loading: false })
    } catch (error) {
      set({ error: 'Erro ao carregar territórios', loading: false })
    }
  },

  fetchPlayers: async () => {

    // Verificar se o Supabase está configurado
    if (!supabase) {
      set({ error: 'Supabase não configurado', loading: false })
      return
    }

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      if (error) {
        console.error('gameStore: Erro ao buscar jogadores:', error)
        set({ error: error.message, loading: false })
        return
      }

      const players: Player[] = (data || []).map(user => ({
        id: user.id,
        name: user.name,
        team: normalizeTeam(user.team),
        position: user.current_position ? 
          user.current_position.replace(/[()]/g, '').split(',').map(Number) as [number, number] : 
          null,
        score: user.score
      }))

      set({ players, loading: false })
    } catch (error) {
      set({ error: 'Erro ao carregar jogadores', loading: false })
    }
  },

  updatePlayerPosition: async (position: [number, number]) => {
    // Verificar se estamos no modo mock
    const gameMode = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('gameMode') : null
    const isMockMode = gameMode === 'mock'
    
    // Atualização simplificada para performance
    const currentPlayer = get().currentPlayer
    if (currentPlayer) {
      set(() => ({
        currentPlayer: {
          ...currentPlayer,
          position: position
        }
      }))
    }

    if (isMockMode) {
      
      // Se não há currentPlayer, criar um mock
      if (!get().currentPlayer) {
        
        // Tentar obter dados do usuário do Supabase se disponível
        let userTeam: 'green' | 'blue' | 'red' = 'green'
        let userName = 'Jogador Mock'
        let userId = 'mock-player'
        
        if (supabase) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              userId = user.id
              
              // Buscar dados do usuário na tabela users
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('team, name')
                .eq('id', user.id)
                .single()
              
              if (userError) {
                // Se não conseguir buscar, usar dados do user_metadata
                userTeam = normalizeTeam(user.user_metadata?.team)
                userName = user.user_metadata?.name || 'Jogador'
              } else if (userData) {
                userTeam = normalizeTeam(userData.team)
                userName = userData.name || 'Jogador'
              } else {
                // Fallback para user_metadata
                userTeam = normalizeTeam(user.user_metadata?.team)
                userName = user.user_metadata?.name || 'Jogador'
              }
                    }
      } catch (error) {
        // Erro silencioso
      }
        }
        
        set(() => ({
          currentPlayer: {
            id: userId,
            name: userName,
            team: userTeam,
            position: position,
            score: 0
          }
        }))
      } else {
        // Atualizar apenas a posição, manter a equipa original
        set(state => ({
          currentPlayer: state.currentPlayer ? { ...state.currentPlayer, position } : null,
          players: state.players.map(player => 
            player.id === state.currentPlayer?.id 
              ? { ...player, position }
              : player
          )
        }))
      }
      
      return
    }

    // Verificar se o Supabase está configurado
    if (!supabase) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Converter array para formato PostgreSQL point: (lat,lng)
      const positionString = `(${position[0]},${position[1]})`
      
      const { error } = await supabase
        .from('users')
        .update({ current_position: positionString })
        .eq('id', user.id)

      if (error) {
        return
      }
    } catch (error) {
      // Erro silencioso
    }
  },

  captureTerritory: async (territoryId: string) => {
    // Implementação omitida
  },

  resetGame: () => {
    set({ territories: [], players: [], currentPlayer: null })
  }
}))


