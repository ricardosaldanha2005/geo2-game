-- Script para verificar se os territórios têm o campo expires_at configurado
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar se a coluna expires_at existe
SELECT 
  '=== VERIFICAR COLUNA EXPIRES_AT ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'territories' 
  AND column_name = 'expires_at';

-- 2. Verificar territórios existentes
SELECT 
  '=== TERRITÓRIOS EXISTENTES ===' as info;

SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  lifetime_seconds,
  CASE 
    WHEN expires_at IS NULL THEN 'SEM EXPIRAÇÃO'
    WHEN expires_at <= NOW() THEN 'EXPIRADO'
    ELSE 'ATIVO'
  END as status
FROM territories
ORDER BY created_at DESC
LIMIT 10;

-- 3. Atualizar territórios que não têm expires_at
UPDATE territories 
SET expires_at = created_at + INTERVAL '1 minute'
WHERE expires_at IS NULL;

-- 4. Verificar se a atualização funcionou
SELECT 
  '=== APÓS ATUALIZAÇÃO ===' as info;

SELECT 
  COUNT(*) as total_territorios,
  COUNT(CASE WHEN expires_at IS NULL THEN 1 END) as sem_expiracao,
  COUNT(CASE WHEN expires_at IS NOT NULL THEN 1 END) as com_expiracao
FROM territories;

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
