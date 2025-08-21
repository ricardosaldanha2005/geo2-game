-- Script AGGRESSIVO para resetar completamente o jogo
-- ⚠️ ATENÇÃO: Este script limpa TUDO, incluindo territórios ativos
-- Execute este SQL no SQL Editor do Supabase para começar completamente de novo

-- 1. LIMPAR HISTÓRICO DE CONQUISTAS
SELECT '=== LIMPANDO HISTÓRICO DE CONQUISTAS ===' as info;

-- Verificar quantos registros existem
SELECT COUNT(*) as total_registros FROM conquest_history;

-- Limpar toda a tabela conquest_history
DELETE FROM conquest_history;

-- Verificar se foi limpa
SELECT 'Histórico limpo!' as status, COUNT(*) as registros_restantes FROM conquest_history;

-- 2. LIMPAR TERRITÓRIOS ATIVOS
SELECT '=== LIMPANDO TERRITÓRIOS ATIVOS ===' as info;

-- Verificar territórios atuais
SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN team_id = 'green' THEN 1 END) as equipe_verde,
  COUNT(CASE WHEN team_id = 'blue' THEN 1 END) as equipe_azul,
  COUNT(CASE WHEN team_id = 'red' THEN 1 END) as equipe_vermelha
FROM territories;

-- Limpar todos os territórios ativos
DELETE FROM territories;

-- Verificar se foi limpa
SELECT 'Territórios limpos!' as status, COUNT(*) as territorios_restantes FROM territories;

-- 3. RESETAR SCORES DOS JOGADORES
SELECT '=== RESETANDO SCORES DOS JOGADORES ===' as info;

-- Verificar scores atuais
SELECT 
  id,
  name,
  team,
  score
FROM users
ORDER BY score DESC;

-- Resetar todos os scores para 0
UPDATE users 
SET score = 0;

-- Verificar scores após reset
SELECT 
  id,
  name,
  team,
  score
FROM users
ORDER BY score DESC;

-- 4. RESUMO FINAL COMPLETO
SELECT '=== RESUMO DO RESET COMPLETO ===' as info;

SELECT 
  'Histórico de conquistas' as tabela,
  (SELECT COUNT(*) FROM conquest_history) as registros
UNION ALL
SELECT 
  'Territórios ativos' as tabela,
  (SELECT COUNT(*) FROM territories) as registros
UNION ALL
SELECT 
  'Usuários com score > 0' as tabela,
  (SELECT COUNT(*) FROM users WHERE score > 0) as registros;

-- 5. MENSAGEM DE SUCESSO
SELECT '🎮 JOGO COMPLETAMENTE RESETADO! 🎮' as mensagem;
SELECT 'TODOS os dados foram limpos:' as detalhes;
SELECT '- Histórico de conquistas: LIMPO' as item1;
SELECT '- Territórios ativos: LIMPOS' as item2;
SELECT '- Scores dos jogadores: RESETADOS' as item3;
SELECT 'O jogo está 100% limpo para começar de novo!' as status;
