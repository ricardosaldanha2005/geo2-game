-- Script para verificar o histórico de conquistas e áreas esgotadas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar todo o histórico de conquistas
SELECT 
  '=== TODO O HISTÓRICO DE CONQUISTAS ===' as info;

SELECT 
  id,
  territory_id,
  conquering_team,
  conquered_team,
  area_lost,
  conquered_at,
  CASE 
    WHEN conquering_team = 'expired' THEN 'ESGOTADA'
    ELSE 'CONQUISTADA'
  END as tipo
FROM conquest_history 
ORDER BY conquered_at DESC;

-- 2. Verificar apenas áreas esgotadas
SELECT 
  '=== APENAS ÁREAS ESGOTADAS ===' as info;

SELECT 
  id,
  territory_id,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history 
WHERE conquering_team = 'expired'
ORDER BY conquered_at DESC;

-- 3. Resumo por equipe - todas as conquistas
SELECT 
  '=== RESUMO POR EQUIPE - TODAS AS CONQUISTAS ===' as info;

SELECT 
  conquered_team as equipe,
  COUNT(*) as total_conquistas,
  SUM(area_lost) as area_total_perdida,
  COUNT(CASE WHEN conquering_team = 'expired' THEN 1 END) as areas_esgotadas,
  SUM(CASE WHEN conquering_team = 'expired' THEN area_lost ELSE 0 END) as area_esgotada,
  MIN(conquered_at) as primeira_conquista,
  MAX(conquered_at) as ultima_conquista
FROM conquest_history 
GROUP BY conquered_team
ORDER BY area_total_perdida DESC;

-- 4. Verificar se há territórios órfãos (sem histórico)
SELECT 
  '=== TERRITÓRIOS ÓRFÃOS ===' as info;

SELECT 
  'Nenhum território encontrado na tabela territories' as status;

-- 5. Verificar usuários e seus scores
SELECT 
  '=== USUÁRIOS E SCORES ===' as info;

SELECT 
  id,
  name,
  team,
  score,
  created_at
FROM users
ORDER BY score DESC;

-- 6. Criar território de teste (se necessário)
SELECT 
  '=== CRIAR TERRITÓRIO DE TESTE ===' as info;

-- Descomente as linhas abaixo se quiser criar um território de teste
/*
INSERT INTO territories (
  team_id, 
  player_id, 
  polygon, 
  area, 
  conquered_at,
  lifetime_seconds,
  expires_at
) VALUES (
  'green',
  (SELECT id FROM users LIMIT 1),
  '{"type":"Polygon","coordinates":[[[-8.5,41.1],[-8.4,41.1],[-8.4,41.2],[-8.5,41.2],[-8.5,41.1]]]}',
  0.01,
  NOW(),
  60,
  NOW() + INTERVAL '1 minute'
);
*/
