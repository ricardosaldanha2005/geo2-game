-- Script para verificar territórios duplicados
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar se há territórios duplicados por coordenadas
SELECT 
  '=== TERRITÓRIOS DUPLICADOS ===' as info;

WITH duplicate_check AS (
  SELECT 
    team_id,
    player_id,
    area,
    created_at,
    COUNT(*) as count
  FROM territories
  GROUP BY team_id, player_id, area, created_at
  HAVING COUNT(*) > 1
)
SELECT 
  team_id,
  player_id,
  area,
  created_at,
  count as duplicatas
FROM duplicate_check
ORDER BY created_at DESC;

-- 2. Verificar territórios com coordenadas idênticas
SELECT 
  '=== TERRITÓRIOS COM COORDENADAS IDÊNTICAS ===' as info;

SELECT 
  t1.id as id1,
  t2.id as id2,
  t1.team_id,
  t1.created_at as created_at1,
  t2.created_at as created_at2,
  t1.expires_at as expires_at1,
  t2.expires_at as expires_at2
FROM territories t1
JOIN territories t2 ON 
  t1.id < t2.id AND 
  t1.polygon = t2.polygon
ORDER BY t1.created_at DESC;

-- 3. Verificar territórios expirados que ainda estão no banco
SELECT 
  '=== TERRITÓRIOS EXPIRADOS AINDA NO BANCO ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (NOW() - expires_at))/60 as minutos_expirado
FROM territories 
WHERE expires_at <= NOW()
ORDER BY expires_at;

-- 4. Limpar territórios duplicados (descomente se necessário)
/*
DELETE FROM territories 
WHERE id IN (
  SELECT t1.id
  FROM territories t1
  JOIN territories t2 ON 
    t1.id > t2.id AND 
    t1.polygon = t2.polygon
);
*/

-- 5. Forçar processamento de territórios expirados
SELECT process_expired_territories() as territorios_processados;

-- 6. Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;
