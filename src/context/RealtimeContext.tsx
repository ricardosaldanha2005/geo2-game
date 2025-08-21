import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Territory {
  id: string;
  team_id: string;
  player_id: string;
  polygon: any;
  area: number;
  created_at: string;
  expires_at?: string;
  conquered_at?: string;
  lifetime_seconds?: number;
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
      const { data, error } = await supabase
        .from('territories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ fetchTerritories: Erro na query:', error);
        setError(error.message);
        return;
      }

      console.log('🗺️ fetchTerritories: Dados recebidos:', data?.length || 0, 'territórios');
      
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
      
      // Chamar a função do banco de dados para processar territórios expirados
      const { data, error } = await supabase
        .rpc('process_expired_territories');

      if (error) {
        console.error('❌ Erro ao processar territórios expirados:', error);
        return;
      }

      if (data && data > 0) {
        console.log('🕐 Territórios expirados processados:', data);
        // Atualizar a lista de territórios após processar os expirados
        console.log('🔄 Atualizando lista de territórios após expiração...');
        await fetchTerritories();
        console.log('✅ Lista de territórios atualizada após expiração');
        
        // Recalcular scores de todos os jogadores após expiração
        console.log('🔄 Recalculando scores após expiração...');
        const { data: allUsers, error: usersError } = await supabase
          .from('users')
          .select('id')
        
        if (!usersError && allUsers) {
          for (const user of allUsers) {
            await updatePlayerScore(user.id);
          }
          console.log('✅ Scores recalculados para todos os jogadores');
        }
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

  // Função para atualizar score do jogador baseado nas suas conquistas totais
  const updatePlayerScore = async (playerId: string) => {
    if (!supabase) return

    try {
      // Buscar TODOS os territórios conquistados pelo jogador (ativos + perdidos + esgotados)
      const { data: playerTerritories, error: territoriesError } = await supabase
        .from('territories')
        .select('area')
        .eq('player_id', playerId)

      if (territoriesError) {
        console.error('❌ Erro ao buscar territórios do jogador:', territoriesError)
        return
      }

      // Buscar também territórios perdidos/esgotados do histórico de conquistas
      const { data: conquestHistory, error: historyError } = await supabase
        .from('conquest_history')
        .select('area_lost')
        .eq('player_id', playerId)

      if (historyError) {
        console.error('❌ Erro ao buscar histórico de conquistas:', historyError)
        return
      }

      // Calcular área total dos territórios ativos
      const activeArea = playerTerritories?.reduce((sum, territory) => sum + (territory.area || 0), 0) || 0
      
      // Calcular área total perdida/esgotada
      const lostArea = conquestHistory?.reduce((sum, conquest) => sum + (conquest.area_lost || 0), 0) || 0
      
      // Score total = área ativa + área perdida/esgotada (histórico completo)
      const totalArea = activeArea + lostArea
      const newScore = Math.round(totalArea * 1000) // Converter para pontos

      // Atualizar score do jogador
      const { error: updateError } = await supabase
        .from('users')
        .update({ score: newScore })
        .eq('id', playerId)

      if (updateError) {
        console.error('❌ Erro ao atualizar score do jogador:', updateError)
        return
      }

      console.log('📈 Score do jogador atualizado:', playerId, 'Score:', newScore, 'Área ativa:', activeArea, 'Área perdida:', lostArea, 'Total:', totalArea)
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
