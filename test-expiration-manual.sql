-- Script para testar manualmente a expiração de territórios
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar territórios atuais
SELECT 
  '=== TERRITÓRIOS ATUAIS ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories
ORDER BY expires_at;

-- 2. Forçar expiração de um território (substitua o ID pelo território que quer testar)
-- Primeiro, vamos ver qual território expira primeiro
SELECT 
  '=== PRÓXIMO A EXPIRAR ===' as info;

SELECT 
  id,
  team_id,
  area,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories 
WHERE expires_at > NOW()
ORDER BY expires_at
LIMIT 1;

-- 3. Forçar expiração do território mais antigo (descomente e substitua o ID)
/*
UPDATE territories 
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE id = 'ID_DO_TERRITORIO_AQUI';
*/

-- 4. Verificar territórios expirados
SELECT 
  '=== TERRITÓRIOS EXPIRADOS ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (NOW() - expires_at))/60 as minutos_expirado
FROM territories 
WHERE expires_at <= NOW();

-- 5. Processar territórios expirados manualmente
SELECT 
  '=== PROCESSANDO EXPIRAÇÃO ===' as info;

SELECT process_expired_territories() as territorios_processados;

-- 6. Verificar resultado
SELECT 
  '=== APÓS PROCESSAMENTO ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;

-- 7. Verificar histórico de conquistas
SELECT 
  '=== HISTÓRICO DE CONQUISTAS ===' as info;

SELECT 
  territory_id,
  conquering_team,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history 
WHERE conquering_team = 'expired'
ORDER BY conquered_at DESC;
