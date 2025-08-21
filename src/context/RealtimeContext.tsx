import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Territory {
  id: string;
  team_id: string;
  player_id: string;
  polygon_coords: any; // Mudou para polygon_coords para compatibilidade com a migração
  area_lost: number; // Mudou de 'area' para 'area_lost' para manter compatibilidade
  created_at: string;
  status: 'active' | 'expired' | 'lost' | 'conquered';
  conquering_team: string;
  conquered_team: string;
}

interface OnlineUser {
  id: string;
  team_id: string;
  last_seen: string;
  team?: string;
  name?: string;
}

interface RealtimeContextType {
  territories: Territory[];
  onlineUsers: OnlineUser[];
  loading: boolean;
  error: string | null;
  addTerritory: (polygon: any, area: number, team?: string) => Promise<any>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTerritories = async () => {
    console.log('🗺️ fetchTerritories: Função chamada');
    
    if (!supabase) {
      console.log('❌ fetchTerritories: Supabase não disponível');
      setError('Supabase não disponível');
      return;
    }

    try {
      // Buscar apenas territórios ativos da tabela unificada
      const { data, error } = await supabase
        .from('conquest_history')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ fetchTerritories: Erro na query:', error);
        setError(error.message);
        return;
      }

      console.log('🗺️ fetchTerritories: Dados recebidos:', data?.length || 0, 'territórios ativos');
      
      // Forçar atualização do estado mesmo se o número de territórios for o mesmo
      setTerritories(prev => {
        const newTerritories = data || [];
        console.log('🔄 Atualizando estado de territórios:', prev.length, '→', newTerritories.length);
        return newTerritories;
      });
      
      console.log('✅ Territórios atualizados no estado:', data?.length || 0, 'territórios');
      
      if (data && data.length > 0) {
        console.log('📋 Primeiro território:', data[0]);
      }
    } catch (err) {
      console.error('❌ fetchTerritories: Erro inesperado:', err);
      setError('Erro ao buscar territórios');
    }
  };

  const fetchOnlineUsers = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('online_users')
        .select('*')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (error) {
        console.error('❌ fetchOnlineUsers: Erro na query:', error);
        return;
      }

      setOnlineUsers(data || []);
    } catch (err) {
      console.error('❌ fetchOnlineUsers: Erro inesperado:', err);
    }
  };

  // Função para processar territórios expirados
  const processExpiredTerritories = async () => {
    if (!supabase) return;

    try {
      console.log('⏰ Verificando territórios expirados...');
      
      // Primeiro, verificar quantos territórios temos antes
      console.log('📊 Territórios antes da verificação:', territories.length);
      
      // Buscar territórios que devem ter expirado (mais de 1 minuto)
      const now = new Date().toISOString();
      const { data: expiredTerritories, error: fetchError } = await supabase
        .from('conquest_history')
        .select('id, created_at')
        .eq('status', 'active')
        .lt('created_at', new Date(Date.now() - 60000).toISOString()); // 1 minuto atrás

      if (fetchError) {
        console.error('❌ Erro ao buscar territórios expirados:', fetchError);
        return;
      }

      if (expiredTerritories && expiredTerritories.length > 0) {
        console.log('🕐 Encontrados territórios para expirar:', expiredTerritories.length);
        
        // Marcar territórios como expirados
        const { error: updateError } = await supabase
          .from('conquest_history')
          .update({ status: 'expired' })
          .in('id', expiredTerritories.map(t => t.id));

        if (updateError) {
          console.error('❌ Erro ao marcar territórios como expirados:', updateError);
          return;
        }

        console.log('🕐 Territórios marcados como expirados:', expiredTerritories.length);
        
        // Atualizar a lista de territórios
        console.log('🔄 Atualizando lista de territórios após expiração...');
        await fetchTerritories();
        console.log('✅ Lista de territórios atualizada após expiração');
      } else {
        console.log('⏰ Nenhum território expirado encontrado');
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao processar territórios expirados:', err);
    }
  };

  const normalizeTeam = (team?: string): 'green' | 'blue' | 'red' => {
    const t = (team || '').toString().toLowerCase().trim()
    if (t === 'red') return 'red'
    if (t === 'blue') return 'blue'
    if (t === 'green') return 'green'
    return 'green'
  }

  // Função para atualizar score do jogador baseado na tabela unificada
  const updatePlayerScore = async (playerId: string) => {
    if (!supabase) return

    try {
      // Buscar TODOS os territórios do jogador da tabela unificada
      const { data: allTerritories, error: territoriesError } = await supabase
        .from('conquest_history')
        .select('area_lost, status')
        .eq('player_id', playerId)

      if (territoriesError) {
        console.error('❌ Erro ao buscar territórios do jogador:', territoriesError)
        return
      }

      // Calcular área total (todos os territórios, independente do status)
      const totalArea = allTerritories?.reduce((sum, territory) => sum + (territory.area_lost || 0), 0) || 0
      const newScore = Math.round(totalArea * 1000) // Converter para pontos

      // Debug: mostrar detalhes do cálculo
      console.log('🔍 Debug score jogador:', playerId)
      console.log('  - Total territórios:', allTerritories?.length || 0)
      console.log('  - Área total:', totalArea)
      console.log('  - Score final:', newScore)

      // Atualizar score do jogador
      const { error: updateError } = await supabase
        .from('users')
        .update({ score: newScore })
        .eq('id', playerId)

      if (updateError) {
        console.error('❌ Erro ao atualizar score do jogador:', updateError)
        return
      }

      console.log('📈 Score do jogador atualizado:', playerId, 'Score:', newScore, 'Área total:', totalArea)
    } catch (err) {
      console.error('❌ Erro inesperado ao atualizar score do jogador:', err)
    }
  }

  const addTerritory = async (polygon: any, area: number, team?: string) => {
    if (!user || !supabase) return

    try {
      console.log('🎯 Adicionando território - Área:', area, 'Equipe:', team)
      
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
          .from('conquest_history')
          .insert({
            team_id: teamId,
            player_id: user.id,
            polygon_coords: polygon,
            area_lost: area,
            conquering_team: teamId,
            conquered_team: teamId,
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

      if (error) throw error

            console.log('✅ Território criado com ID:', data.id)

      // Atualizar score do jogador baseado nas suas conquistas totais
      await updatePlayerScore(user.id)

      // Refresh territórios após adicionar
      setTimeout(async () => {
        await fetchTerritories()
      }, 1000)

      return data
    } catch (error) {
      console.error('❌ Erro ao adicionar território:', error)
      throw error
    }
  }



  useEffect(() => {
    console.log('👤 Usuário atual:', user?.id);
    console.log('🔧 RealtimeProvider: Hook executado, user existe:', !!user);
    
    if (!user) {
      console.log('❌ RealtimeProvider: Usuário não autenticado, saindo...');
      setLoading(false);
      return;
    }

    console.log('🔄 RealtimeProvider: Chamando fetchTerritories inicial...');
    fetchTerritories();
    fetchOnlineUsers();
    
    // Verificar territórios expirados na inicialização
    processExpiredTerritories();
    
    setLoading(false);

    // Set up real-time subscriptions
    const territoriesSubscription = supabase
      .channel('territories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'territories' },
        () => {
          console.log('🔄 RealtimeProvider: Mudança detectada em territórios, atualizando...');
          fetchTerritories();
        }
      )
      .subscribe();

    const onlineUsersSubscription = supabase
      .channel('online_users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'online_users' },
        () => {
          console.log('🔄 RealtimeProvider: Mudança detectada em usuários online, atualizando...');
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Verificar territórios expirados a cada 10 segundos para ser mais responsivo
    const expiredCheckInterval = setInterval(() => {
      processExpiredTerritories();
    }, 10000);

         // Cleanup subscriptions
     return () => {
       territoriesSubscription.unsubscribe();
       onlineUsersSubscription.unsubscribe();
       clearInterval(expiredCheckInterval);
     };
  }, [user]);

  // Log when territories state changes
  useEffect(() => {
    console.log('🗺️ RealtimeProvider: Estado territories mudou:', territories.length, 'territórios');
  }, [territories]);

  const value: RealtimeContextType = {
    territories,
    onlineUsers,
    loading,
    error,
    addTerritory
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
