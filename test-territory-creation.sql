-- Script para testar criação de território e verificar estatísticas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar usuários disponíveis
SELECT 
  '=== USUÁRIOS DISPONÍVEIS ===' as info;

SELECT 
  id,
  name,
  team,
  score
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Criar território de teste
SELECT 
  '=== CRIANDO TERRITÓRIO DE TESTE ===' as info;

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
  (SELECT id FROM users WHERE team = 'green' LIMIT 1),
  '{"type":"Polygon","coordinates":[[[-8.5,41.1],[-8.4,41.1],[-8.4,41.2],[-8.5,41.2],[-8.5,41.1]]]}',
  0.05,
  NOW(),
  60,
  NOW() + INTERVAL '1 minute'
) RETURNING id, team_id, area, expires_at;

-- 3. Verificar território criado
SELECT 
  '=== TERRITÓRIO CRIADO ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories
ORDER BY created_at DESC
LIMIT 1;

-- 4. Verificar estatísticas atuais
SELECT 
  '=== ESTATÍSTICAS ATUAIS ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados
FROM territories;
