-- Script para fazer RESET do jogo (mantendo usuários)
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar dados atuais antes do reset
SELECT 
  '=== DADOS ATUAIS (ANTES DO RESET) ===' as info;

SELECT 
  'Territórios:' as tabela,
  COUNT(*) as total
FROM territories
UNION ALL
SELECT 
  'Histórico de conquistas:' as tabela,
  COUNT(*) as total
FROM conquest_history;

-- 2. APAGAR TODOS OS TERRITÓRIOS
SELECT 
  '=== APAGANDO TERRITÓRIOS ===' as info;

DELETE FROM territories;

-- 3. APAGAR TODO O HISTÓRICO DE CONQUISTAS
SELECT 
  '=== APAGANDO HISTÓRICO DE CONQUISTAS ===' as info;

DELETE FROM conquest_history;

-- 4. Verificar resultado do reset
SELECT 
  '=== RESULTADO DO RESET ===' as info;

SELECT 
  'Territórios:' as tabela,
  COUNT(*) as total
FROM territories
UNION ALL
SELECT 
  'Histórico de conquistas:' as tabela,
  COUNT(*) as total
FROM conquest_history;

-- 5. Verificar usuários (mantidos)
SELECT 
  '=== USUÁRIOS (MANTIDOS) ===' as info;

SELECT 
  id,
  name,
  team,
  score,
  created_at
FROM users
ORDER BY created_at DESC;
