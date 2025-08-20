-- Script para verificar territórios ativos
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar todos os territórios
SELECT 
  '=== TODOS OS TERRITÓRIOS ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN 'ATIVO'
    WHEN expires_at <= NOW() THEN 'EXPIRADO'
    ELSE 'SEM EXPIRAÇÃO'
  END as status,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories
ORDER BY created_at DESC;

-- 2. Verificar territórios ativos
SELECT 
  '=== TERRITÓRIOS ATIVOS ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories 
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- 3. Resumo por equipe
SELECT 
  '=== RESUMO POR EQUIPE ===' as info;

SELECT 
  team_id as equipe,
  COUNT(*) as total_territorios,
  SUM(area) as area_total,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos,
  SUM(CASE WHEN expires_at > NOW() THEN area ELSE 0 END) as area_ativa
FROM territories
GROUP BY team_id
ORDER BY area_total DESC;

-- 4. Verificar histórico de conquistas
SELECT 
  '=== HISTÓRICO DE CONQUISTAS ===' as info;

SELECT 
  conquering_team,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history
ORDER BY conquered_at DESC;
