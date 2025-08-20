-- Script simples para verificar o histórico de conquistas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar se a tabela conquest_history existe
SELECT 
  '=== VERIFICAR TABELA ===' as info;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'conquest_history'
ORDER BY ordinal_position;

-- 2. Verificar todo o histórico de conquistas
SELECT 
  '=== TODO O HISTÓRICO ===' as info;

SELECT 
  id,
  territory_id,
  conquering_team,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history 
ORDER BY conquered_at DESC;

-- 3. Verificar apenas áreas esgotadas
SELECT 
  '=== ÁREAS ESGOTADAS ===' as info;

SELECT 
  id,
  territory_id,
  conquered_team,
  area_lost,
  conquered_at
FROM conquest_history 
WHERE conquering_team = 'expired'
ORDER BY conquered_at DESC;

-- 4. Resumo por equipe
SELECT 
  '=== RESUMO POR EQUIPE ===' as info;

SELECT 
  conquered_team as equipe,
  COUNT(*) as total_registros,
  SUM(area_lost) as area_total,
  COUNT(CASE WHEN conquering_team = 'expired' THEN 1 END) as areas_esgotadas,
  SUM(CASE WHEN conquering_team = 'expired' THEN area_lost ELSE 0 END) as area_esgotada
FROM conquest_history 
GROUP BY conquered_team
ORDER BY area_total DESC;
