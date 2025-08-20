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
  CASE 
    WHEN expires_at <= NOW() THEN 'EXPIRADO'
    ELSE 'ATIVO'
  END as status
FROM territories
ORDER BY expires_at;

-- 2. Forçar expiração de um território (substitua o ID pelo território que quer testar)
-- UPDATE territories 
-- SET expires_at = NOW() - INTERVAL '1 minute'
-- WHERE id = 'ID_DO_TERRITORIO_AQUI';

-- 3. Processar territórios expirados manualmente
SELECT process_expired_territories() as territorios_processados;

-- 4. Verificar se os territórios foram removidos
SELECT 
  '=== APÓS PROCESSAMENTO ===' as info;

SELECT 
  COUNT(*) as territorios_restantes
FROM territories;

-- 5. Verificar histórico de conquistas para áreas esgotadas
SELECT 
  '=== HISTÓRICO DE ÁREAS ESGOTADAS ===' as info;

SELECT 
  territory_id,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history 
WHERE conquering_team = 'expired'
ORDER BY conquered_at DESC;
