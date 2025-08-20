import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      // Criar usuário mock para funcionar offline
      const mockUser = {
        id: 'mock-user',
        email: 'mock@example.com',
        user_metadata: {
          name: 'Jogador Offline',
          team: 'green'
        }
      } as any
      setUser(mockUser)
      setLoading(false)
      return
    }

    // Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      // Se o login foi bem-sucedido, verificar se o usuário existe na tabela users
      if (data.user) {
        try {
          // Verificar se o usuário já existe na tabela users
          const { error: selectError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single()
          
                               if (selectError && selectError.code === 'PGRST116') {
            // Usuário não existe na tabela users, vamos criá-lo
             
             const { error: insertError } = await supabase
               .from('users')
               .insert([
                 {
                   id: data.user.id,
                   name: data.user.user_metadata?.name || 'Jogador',
                   team: data.user.user_metadata?.team || 'green',
                   email: data.user.email || '',
                   score: 0
                 }
               ])
             
                           if (insertError) {
                // Erro silencioso
              }
            }
        } catch (dbError) {
          // Erro silencioso
        }
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, name: string, team: string) => {
    if (!supabase) {
      throw new Error('Supabase não configurado')
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            team
          }
        }
      })
      
      if (error) {
        throw error
      }
      
      // Verificar se o email precisa ser confirmado
      if (data.user && !data.user.email_confirmed_at) {
        return { 
          data, 
          error: null, 
          message: 'Conta criada! Verifique seu email para confirmar o endereço antes de fazer login.' 
        }
      }
      
      // Se o email já está confirmado, inserir na tabela users
      if (data.user && data.user.email_confirmed_at) {
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name,
                team,
                email,
                score: 0
              }
            ])
          
          if (insertError) {
            // Não vamos falhar o registro por causa disso
          }
        } catch (insertError) {
          // Erro silencioso
        }
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      if (supabase) {
        // Limpar posição atual antes de fazer logout
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('users')
            .update({ current_position: null })
            .eq('id', user.id)
        }
        
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          throw error
        }
      }
      
      setUser(null)
      
      // Emitir evento para notificar que o logout foi feito
      window.dispatchEvent(new CustomEvent('user-logged-out'))
    } catch (error) {
      // Mesmo com erro, limpar o usuário localmente
      setUser(null)
      throw error
    }
  }

  return { user, loading, signIn, signUp, signOut }
}
