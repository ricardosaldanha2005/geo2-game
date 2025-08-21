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
  status?: 'created' | 'expired' | 'lost';
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
  processTerritoryStatus: () => Promise<void>;
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
      setTerritories(data || []);
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

  const normalizeTeam = (team?: string): 'green' | 'blue' | 'red' => {
    const t = (team || '').toString().toLowerCase().trim()
    if (t === 'red') return 'red'
    if (t === 'blue') return 'blue'
    if (t === 'green') return 'green'
    return 'green'
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
          conquered_at: new Date().toISOString(),
          status: 'created'
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

      // Processar conquistas e expirações
      await processTerritoryStatus()

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

  const processTerritoryStatus = async () => {
    if (!supabase) return

    try {
      console.log('🔄 Processando status dos territórios...')
      
      // Buscar todos os territórios
      const { data: allTerritories, error } = await supabase
        .from('territories')
        .select('*')

      if (error) throw error

      const now = new Date()
      const updates: Promise<any>[] = []

      // Processar territórios expirados
      allTerritories?.forEach(territory => {
        if (territory.expires_at && territory.status === 'created') {
          const expirationDate = new Date(territory.expires_at)
          if (expirationDate <= now) {
            console.log('🕐 Marcando território como expirado:', territory.id)
            updates.push(
              supabase
                .from('territories')
                .update({ status: 'expired' })
                .eq('id', territory.id)
            )
          }
        }
      })

      // Processar conquistas (territórios perdidos)
      allTerritories?.forEach(territory => {
        if (territory.status === 'created') {
          // Verificar se há sobreposição com territórios de outras equipes
          allTerritories?.forEach(otherTerritory => {
            if (otherTerritory.id !== territory.id && 
                otherTerritory.team_id !== territory.team_id &&
                otherTerritory.status === 'created') {
              // Aqui você pode adicionar lógica de sobreposição se necessário
              // Por agora, vamos apenas marcar como perdido se foi criado depois
              if (new Date(otherTerritory.created_at) > new Date(territory.created_at)) {
                console.log('💔 Marcando território como perdido:', territory.id)
                updates.push(
                  supabase
                    .from('territories')
                    .update({ status: 'lost' })
                    .eq('id', territory.id)
                )
              }
            }
          })
        }
      })

      // Executar todas as atualizações
      if (updates.length > 0) {
        await Promise.all(updates)
        console.log('✅ Status dos territórios atualizados:', updates.length, 'atualizações')
      }

    } catch (error) {
      console.error('❌ Erro ao processar status dos territórios:', error)
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

    // Processar status dos territórios periodicamente
    const statusInterval = setInterval(() => {
      processTerritoryStatus();
    }, 10000); // A cada 10 segundos

    // Cleanup subscriptions
    return () => {
      territoriesSubscription.unsubscribe();
      onlineUsersSubscription.unsubscribe();
      clearInterval(statusInterval);
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
    addTerritory,
    processTerritoryStatus
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
