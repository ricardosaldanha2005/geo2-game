-- Script para testar o sistema de áreas expiradas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar se as colunas foram criadas corretamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'territories' 
  AND column_name IN ('lifetime_seconds', 'expires_at')
ORDER BY column_name;

-- 2. Verificar territórios existentes e suas datas de expiração
SELECT 
  id,
  team_id,
  area,
  created_at,
  expires_at,
  lifetime_seconds,
  CASE 
    WHEN expires_at <= NOW() THEN 'EXPIRADO'
    ELSE 'ATIVO'
  END as status,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM territories
ORDER BY expires_at;

-- 3. Verificar se há territórios expirados
SELECT 
  COUNT(*) as territorios_expirados,
  SUM(area) as area_total_expirada
FROM territories 
WHERE expires_at <= NOW();

-- 4. Testar manualmente a função de processamento (descomente se necessário)
-- SELECT process_expired_territories() as territorios_processados;

-- 5. Verificar histórico de conquistas para áreas esgotadas
SELECT 
  COUNT(*) as areas_esgotadas,
  SUM(area_lost) as area_total_esgotada
FROM conquest_history 
WHERE conquering_team = 'expired';

-- 6. Criar um território de teste que expira em 30 segundos (para teste)
INSERT INTO territories (
  team_id,
  player_id,
  polygon,
  area,
  lifetime_seconds,
  expires_at
) VALUES (
  'green',
  (SELECT id FROM users LIMIT 1),
  '{"type":"Polygon","coordinates":[[[-8.6167,41.1333],[-8.6168,41.1333],[-8.6168,41.1334],[-8.6167,41.1334],[-8.6167,41.1333]]]}',
  0.001,
  30,
  NOW() + INTERVAL '30 seconds'
) ON CONFLICT DO NOTHING;

-- 7. Verificar o território de teste criado
SELECT 
  'Território de teste criado!' as status,
  id,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as segundos_restantes
FROM territories 
WHERE lifetime_seconds = 30
ORDER BY created_at DESC
LIMIT 1;
