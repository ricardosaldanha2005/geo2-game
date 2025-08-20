import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY



// Criar cliente Supabase apenas se as variáveis estiverem configuradas
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  team: 'green' | 'blue' | 'red'
  score: number
  current_position: [number, number] | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  color: 'green' | 'blue' | 'red'
  score_total: number
  created_at: string
}

export interface Territory {
  id: string
  team_id: string
  player_id: string
  polygon: any // GeoJSON
  area: number
  conquered_at: string
  created_at: string
  lifetime_seconds: number
  expires_at: string
}

export interface Quiz {
  id: string
  question: string
  correct_answer: string
  options: string[]
  team_id: string
  player_id: string
  points: number
  answered: boolean
  created_at: string
}
