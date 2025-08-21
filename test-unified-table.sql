-- Script para testar a tabela unificada conquest_history
-- Execute este SQL para verificar se a migração funcionou

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT '=== ESTRUTURA DA TABELA ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conquest_history'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS POR STATUS
SELECT '=== DADOS POR STATUS ===' as info;

SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(area_lost) as area_total,
  AVG(area_lost) as area_media
FROM conquest_history 
GROUP BY status
ORDER BY status;

-- 3. VERIFICAR TERRITÓRIOS ATIVOS (para o mapa)
SELECT '=== TERRITÓRIOS ATIVOS (MAP) ===' as info;

SELECT 
  id,
  team_id,
  player_id,
  area_lost,
  created_at,
  status
FROM conquest_history 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR SCORE DE UM JOGADOR ESPECÍFICO
SELECT '=== SCORE DE JOGADOR ===' as info;

-- Substitua 'USER_ID_AQUI' pelo ID real do jogador
SELECT 
  player_id,
  status,
  COUNT(*) as territorios,
  SUM(area_lost) as area_total
FROM conquest_history 
WHERE player_id = 'USER_ID_AQUI' -- ALTERAR PARA ID REAL
GROUP BY player_id, status
ORDER BY status;

-- 5. VERIFICAR TERRITÓRIOS POR EQUIPE
SELECT '=== TERRITÓRIOS POR EQUIPE ===' as info;

SELECT 
  team_id,
  status,
  COUNT(*) as quantidade,
  SUM(area_lost) as area_total
FROM conquest_history 
GROUP BY team_id, status
ORDER BY team_id, status;

-- 6. VERIFICAR PERFORMANCE DOS ÍNDICES
SELECT '=== PERFORMANCE DOS ÍNDICES ===' as info;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM conquest_history 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- 7. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
  'Total registros:' as info,
  COUNT(*) as total
FROM conquest_history;

SELECT 
  'Registros por status:' as info,
  status,
  COUNT(*) as quantidade
FROM conquest_history 
GROUP BY status
ORDER BY status;

-- 8. VERIFICAR SE EXISTEM PROBLEMAS
SELECT '=== VERIFICAÇÃO DE PROBLEMAS ===' as info;

-- Verificar registros sem status
SELECT 'Registros sem status:' as problema, COUNT(*) as quantidade
FROM conquest_history 
WHERE status IS NULL OR status = '';

-- Verificar registros sem área
SELECT 'Registros sem área:' as problema, COUNT(*) as quantidade
FROM conquest_history 
WHERE area_lost IS NULL OR area_lost = 0;

-- Verificar registros duplicados
SELECT 'Possíveis duplicados:' as problema, COUNT(*) as quantidade
FROM (
  SELECT territory_id, COUNT(*) as cnt
  FROM conquest_history 
  GROUP BY territory_id 
  HAVING COUNT(*) > 1
) as duplicados;
