-- Script para verificar a estrutura atual da tabela conquest_history
-- Execute este SQL para diagnosticar problemas antes da migração

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT '=== ESTRUTURA ATUAL DA TABELA ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'conquest_history'
ORDER BY ordinal_position;

-- 2. VERIFICAR CONSTRAINTS EXISTENTES
SELECT '=== CONSTRAINTS EXISTENTES ===' as info;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conquest_history'::regclass
ORDER BY conname;

-- 3. VERIFICAR ÍNDICES EXISTENTES
SELECT '=== ÍNDICES EXISTENTES ===' as info;

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'conquest_history'
ORDER BY indexname;

-- 4. VERIFICAR DADOS ATUAIS
SELECT '=== DADOS ATUAIS ===' as info;

SELECT 
  'Total registros:' as info,
  COUNT(*) as total
FROM conquest_history;

-- 5. VERIFICAR SE EXISTEM DUPLICADOS
SELECT '=== VERIFICAÇÃO DE DUPLICADOS ===' as info;

SELECT 
  territory_id,
  COUNT(*) as quantidade
FROM conquest_history 
WHERE territory_id IS NOT NULL
GROUP BY territory_id 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 6. VERIFICAR TIPOS DE DADOS PROBLEMÁTICOS
SELECT '=== VERIFICAÇÃO DE TIPOS ===' as info;

-- Verificar se territory_id é único
SELECT 
  'territory_id único:' as verificação,
  CASE 
    WHEN COUNT(DISTINCT territory_id) = COUNT(territory_id) 
    THEN '✅ SIM' 
    ELSE '❌ NÃO' 
  END as resultado
FROM conquest_history 
WHERE territory_id IS NOT NULL;

-- 7. RECOMENDAÇÕES
SELECT '=== RECOMENDAÇÕES ===' as info;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'conquest_history'::regclass 
      AND contype = 'u' 
      AND conname LIKE '%territory_id%'
    ) THEN '✅ Constraint única já existe para territory_id'
    ELSE '❌ ADICIONAR: ALTER TABLE conquest_history ADD CONSTRAINT conquest_history_territory_id_key UNIQUE (territory_id)'
  END as recomendação;
