import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const showMessage = (msg: string, _type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const resetAllScores = async () => {
    if (!confirm('Tens a certeza que queres resetar TODAS as áreas conquistadas dos jogadores?')) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        showMessage('❌ Erro: Supabase não disponível', 'error');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({ score: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users

      if (error) throw error;
      showMessage('✅ Todas as áreas conquistadas foram resetadas!', 'success');
    } catch (error) {
      console.error('Erro ao resetar pontuações:', error);
      showMessage('❌ Erro ao resetar pontuações', 'error');
    }
    setLoading(false);
  };

  const recalculateAllScores = async () => {
    if (!confirm('Recalcular áreas conquistadas baseado nos territórios existentes?')) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        showMessage('❌ Erro: Supabase não disponível', 'error');
        setLoading(false);
        return;
      }
      
      // Buscar todos os usuários
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) throw usersError;

      for (const userItem of users || []) {
        // Buscar territórios do jogador
        const { data: territories, error: territoriesError } = await supabase
          .from('conquest_history')
          .select('area_lost')
          .eq('player_id', userItem.id);

        if (territoriesError) {
          console.error(`Erro ao buscar territórios do jogador ${userItem.id}:`, territoriesError);
          continue;
        }

        // Calcular área total
        const totalArea = territories?.reduce((sum, territory) => sum + (territory.area_lost || 0), 0) || 0;
        const newScore = Math.round(totalArea * 1000) / 1000; // Manter como km²

        // Atualizar score
        const { error: updateError } = await supabase
          .from('users')
          .update({ score: newScore })
          .eq('id', userItem.id);

        if (updateError) {
          console.error(`Erro ao atualizar score do jogador ${userItem.id}:`, updateError);
        }
      }

      showMessage('✅ Áreas totais (km²) recalculadas baseado nos territórios existentes!', 'success');
    } catch (error) {
      console.error('Erro ao recalcular pontuações:', error);
      showMessage('❌ Erro ao recalcular pontuações', 'error');
    }
    setLoading(false);
  };

  const resetGameCompletely = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isto vai APAGAR TODOS os territórios e resetar TODAS as pontuações! Tens a certeza?')) return;
    if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO: Todos os dados do jogo serão perdidos. Continuar?')) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        showMessage('❌ Erro: Supabase não disponível', 'error');
        setLoading(false);
        return;
      }
      
      // Apagar todos os territórios
      const { error: territoriesError } = await supabase
        .from('conquest_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (territoriesError) throw territoriesError;

      // Resetar todas as áreas conquistadas
      const { error: scoresError } = await supabase
        .from('users')
        .update({ score: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users

      if (scoresError) throw scoresError;

      showMessage('✅ Jogo completamente resetado! Todos os territórios e áreas conquistadas foram apagados.', 'success');
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
      showMessage('❌ Erro ao resetar jogo completamente', 'error');
    }
    setLoading(false);
  };

  const cleanExpiredTerritories = async () => {
    if (!confirm('Apagar todos os territórios com status "expired"?')) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        showMessage('❌ Erro: Supabase não disponível', 'error');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('conquest_history')
        .delete()
        .eq('status', 'expired')
        .select();

      if (error) throw error;
      showMessage(`✅ ${data?.length || 0} territórios expirados foram apagados!`, 'success');
    } catch (error) {
      console.error('Erro ao limpar territórios expirados:', error);
      showMessage('❌ Erro ao limpar territórios expirados', 'error');
    }
    setLoading(false);
  };

  const forceRecalculateMyScore = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        showMessage('❌ Erro: Supabase não disponível', 'error');
        setLoading(false);
        return;
      }
      
      // Buscar territórios do jogador atual
      const { data: territories, error: territoriesError } = await supabase
        .from('conquest_history')
        .select('area_lost')
        .eq('player_id', user.id);

      if (territoriesError) throw territoriesError;

      // Calcular área total
      const totalArea = territories?.reduce((sum, territory) => sum + (territory.area_lost || 0), 0) || 0;
      const newScore = Math.round(totalArea * 1000) / 1000; // Manter como km²

      // Atualizar score
      const { error: updateError } = await supabase
        .from('users')
        .update({ score: newScore })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showMessage(`✅ Tua área total foi recalculada: ${newScore.toFixed(3)} km²`, 'success');
    } catch (error) {
      console.error('Erro ao recalcular minha pontuação:', error);
      showMessage('❌ Erro ao recalcular pontuação', 'error');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🔒 Acesso Restrito</h1>
          <p>Precisas de estar autenticado para aceder à área de administração.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🛠️ Administração do Jogo</h1>
          <p className="text-gray-400">Painel de controlo para gerir o jogo geo2</p>
          <p className="text-sm text-gray-500 mt-2">Utilizador: {user.email}</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('❌') ? 'bg-red-900 border border-red-600' : 'bg-green-900 border border-green-600'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pontuações */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">📊 Gestão de Áreas Conquistadas</h2>
            
            <button
              onClick={forceRecalculateMyScore}
              disabled={loading}
              className="w-full mb-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              🔄 Recalcular Minha Área Total
            </button>

            <button
              onClick={recalculateAllScores}
              disabled={loading}
              className="w-full mb-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              🧮 Recalcular Todas as Áreas
            </button>

            <button
              onClick={resetAllScores}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              🗑️ Resetar Todas as Áreas
            </button>
          </div>

          {/* Territórios */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-green-400">🗺️ Gestão de Territórios</h2>
            
            <button
              onClick={cleanExpiredTerritories}
              disabled={loading}
              className="w-full mb-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              🧹 Limpar Territórios Expirados
            </button>

            <button
              onClick={resetGameCompletely}
              disabled={loading}
              className="w-full bg-red-800 hover:bg-red-900 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              ☢️ Reset Completo do Jogo
            </button>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-purple-400">ℹ️ Informações</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>🔄 Recalcular Minha Área Total:</strong> Recalcula apenas a tua área total (km²) baseado nos territórios que tens na base de dados</p>
            <p><strong>🧮 Recalcular Todas as Áreas:</strong> Recalcula as áreas totais (km²) de todos os jogadores baseado nos territórios existentes</p>
            <p><strong>🗑️ Resetar Todas as Áreas:</strong> Coloca todas as áreas conquistadas a zero (não apaga territórios)</p>
            <p><strong>🧹 Limpar Territórios Expirados:</strong> Remove da base de dados todos os territórios com status "expired"</p>
            <p><strong>☢️ Reset Completo:</strong> APAGA TUDO - territórios e áreas conquistadas (não há volta atrás!)</p>
          </div>
        </div>

        {/* Voltar ao jogo */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            🎮 Voltar ao Jogo
          </a>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>A processar...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
