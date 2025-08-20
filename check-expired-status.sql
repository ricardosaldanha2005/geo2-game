-- Script para verificar o status atual das áreas expiradas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar territórios atuais
SELECT 
  '=== TERRITÓRIOS ATUAIS ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;

-- 2. Verificar histórico de conquistas (áreas esgotadas)
SELECT 
  '=== HISTÓRICO DE CONQUISTAS - ÁREAS ESGOTADAS ===' as info;

SELECT 
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
WHERE conquering_team = 'expired'
ORDER BY conquered_at DESC;

-- 3. Resumo por equipe - áreas esgotadas
SELECT 
  '=== RESUMO POR EQUIPE - ÁREAS ESGOTADAS ===' as info;

SELECT 
  conquered_team as equipe,
  COUNT(*) as total_areas_esgotadas,
  SUM(area_lost) as area_total_esgotada,
  MIN(conquered_at) as primeira_expiracao,
  MAX(conquered_at) as ultima_expiracao
FROM conquest_history 
WHERE conquering_team = 'expired'
GROUP BY conquered_team
ORDER BY area_total_esgotada DESC;

-- 4. Verificar se há territórios expirados que não foram processados
SELECT 
  '=== TERRITÓRIOS EXPIRADOS NÃO PROCESSADOS ===' as info;

SELECT 
  t.id,
  t.team_id,
  t.area,
  t.created_at,
  t.expires_at,
  EXTRACT(EPOCH FROM (NOW() - t.expires_at))/60 as minutos_expirado,
  CASE 
    WHEN ch.territory_id IS NOT NULL THEN 'PROCESSADO'
    ELSE 'NÃO PROCESSADO'
  END as status
FROM territories t
LEFT JOIN conquest_history ch ON t.id = ch.territory_id AND ch.conquering_team = 'expired'
WHERE t.expires_at <= NOW()
ORDER BY t.expires_at;

-- 5. Verificar territórios ativos
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
ORDER BY expires_at;

-- 6. Processar territórios expirados não processados (se houver)
SELECT 
  '=== PROCESSANDO TERRITÓRIOS EXPIRADOS ===' as info;

SELECT process_expired_territories() as territorios_processados;

-- 7. Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expirados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ativos
FROM territories;
