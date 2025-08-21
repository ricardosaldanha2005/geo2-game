-- Script para resetar completamente o jogo
-- Execute este SQL no SQL Editor do Supabase para começar de novo

-- 1. LIMPAR HISTÓRICO DE CONQUISTAS
SELECT '=== LIMPANDO HISTÓRICO DE CONQUISTAS ===' as info;

-- Verificar quantos registros existem
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN conquering_team = 'expired' THEN 1 END) as areas_esgotadas,
  COUNT(CASE WHEN conquering_team != 'expired' THEN 1 END) as areas_conquistadas
FROM conquest_history;

-- Limpar toda a tabela conquest_history
DELETE FROM conquest_history;

-- Verificar se foi limpa
SELECT 'Histórico limpo!' as status, COUNT(*) as registros_restantes FROM conquest_history;

-- 2. RESETAR SCORES DOS JOGADORES
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

-- 3. VERIFICAR TERRITÓRIOS ATIVOS
SELECT '=== TERRITÓRIOS ATIVOS ATUAIS ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN team_id = 'green' THEN 1 END) as equipe_verde,
  COUNT(CASE WHEN team_id = 'blue' THEN 1 END) as equipe_azul,
  COUNT(CASE WHEN team_id = 'red' THEN 1 END) as equipe_vermelha
FROM territories;

-- 4. RESUMO FINAL
SELECT '=== RESUMO DO RESET ===' as info;

SELECT 
  'Histórico de conquistas' as tabela,
  (SELECT COUNT(*) FROM conquest_history) as registros
UNION ALL
SELECT 
  'Usuários com score > 0' as tabela,
  (SELECT COUNT(*) FROM users WHERE score > 0) as registros
UNION ALL
SELECT 
  'Territórios ativos' as tabela,
  (SELECT COUNT(*) FROM territories) as registros;

-- 5. MENSAGEM DE SUCESSO
SELECT '🎮 JOGO RESETADO COM SUCESSO! 🎮' as mensagem;
SELECT 'Todos os históricos foram limpos e scores resetados.' as detalhes;
SELECT 'O jogo está pronto para começar de novo!' as status;
