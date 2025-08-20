-- Script para verificar territórios expirados não processados
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar territórios atuais
SELECT 
  '=== TERRITÓRIOS ATUAIS ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;

-- 2. Verificar territórios expirados
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
WHERE expires_at <= NOW()
ORDER BY expires_at;

-- 3. Verificar histórico de conquistas
SELECT 
  '=== HISTÓRICO DE CONQUISTAS ===' as info;

SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN conquering_team = 'expired' THEN 1 END) as areas_esgotadas
FROM conquest_history;

-- 4. Verificar se há territórios expirados não processados
SELECT 
  '=== TERRITÓRIOS EXPIRADOS NÃO PROCESSADOS ===' as info;

SELECT 
  t.id,
  t.team_id,
  t.area,
  t.expires_at,
  CASE 
    WHEN ch.territory_id IS NOT NULL THEN 'PROCESSADO'
    ELSE 'NÃO PROCESSADO'
  END as status
FROM territories t
LEFT JOIN conquest_history ch ON t.id = ch.territory_id AND ch.conquering_team = 'expired'
WHERE t.expires_at <= NOW()
ORDER BY t.expires_at;

-- 5. Processar territórios expirados não processados
SELECT 
  '=== PROCESSANDO TERRITÓRIOS EXPIRADOS ===' as info;

SELECT process_expired_territories() as territorios_processados;

-- 6. Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;
