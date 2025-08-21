-- Script para migrar para tabela unificada conquest_history
-- Execute este SQL no SQL Editor do Supabase

-- 1. VERIFICAR DADOS ATUAIS
SELECT '=== VERIFICANDO DADOS ATUAIS ===' as info;

SELECT 'Territórios ativos:' as tabela, COUNT(*) as total FROM territories;
SELECT 'Histórico conquistas:' as tabela, COUNT(*) as total FROM conquest_history;

-- 2. ADICIONAR COLUNAS NECESSÁRIAS À TABELA conquest_history
SELECT '=== ADICIONANDO COLUNAS NECESSÁRIAS ===' as info;

-- Adicionar colunas se não existirem
ALTER TABLE conquest_history 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'lost',
ADD COLUMN IF NOT EXISTS team_id TEXT,
ADD COLUMN IF NOT EXISTS polygon JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2.1. ADICIONAR CONSTRAINT ÚNICA PARA territory_id
SELECT '=== ADICIONANDO CONSTRAINT ÚNICA ===' as info;

-- Adicionar constraint única para territory_id (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'conquest_history_territory_id_key'
    ) THEN
        ALTER TABLE conquest_history 
        ADD CONSTRAINT conquest_history_territory_id_key 
        UNIQUE (territory_id);
        RAISE NOTICE 'Constraint única adicionada para territory_id';
    END IF;
END $$;

-- 3. MIGRAR TERRITÓRIOS ATIVOS PARA conquest_history
SELECT '=== MIGRANDO TERRITÓRIOS ATIVOS ===' as info;

-- Inserir territórios ativos como 'active'
INSERT INTO conquest_history (
  territory_id,
  player_id,
  team_id,
  conquering_team,
  conquered_team,
  area_lost,
  polygon,
  created_at,
  status
)
SELECT 
  id as territory_id,
  player_id,
  team_id,
  team_id as conquering_team, -- Equipe que conquistou
  team_id as conquered_team,   -- Equipe que foi conquistada
  area as area_lost,
  ST_AsGeoJSON(polygon)::jsonb as polygon, -- Converter geometry para JSONB
  created_at,
  'active' as status
FROM territories
ON CONFLICT (territory_id) DO NOTHING;

-- Verificar quantos foram migrados
SELECT 'Territórios ativos migrados:' as info, COUNT(*) as total 
FROM conquest_history WHERE status = 'active';

-- 4. ATUALIZAR REGISTROS EXISTENTES NO conquest_history
SELECT '=== ATUALIZANDO REGISTROS EXISTENTES ===' as info;

-- Marcar registros existentes como 'lost' (se não tiverem status)
UPDATE conquest_history 
SET status = 'lost' 
WHERE status IS NULL OR status = '';

-- 5. VERIFICAR RESULTADO DA MIGRAÇÃO
SELECT '=== RESULTADO DA MIGRAÇÃO ===' as info;

SELECT 
  status,
  COUNT(*) as total,
  SUM(area_lost) as area_total
FROM conquest_history 
GROUP BY status
ORDER BY status;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
SELECT '=== CRIANDO ÍNDICES ===' as info;

CREATE INDEX IF NOT EXISTS idx_conquest_history_status ON conquest_history(status);
CREATE INDEX IF NOT EXISTS idx_conquest_history_player_id ON conquest_history(player_id);
CREATE INDEX IF NOT EXISTS idx_conquest_history_team_id ON conquest_history(team_id);

-- 7. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
  'Total registros conquest_history:' as info,
  COUNT(*) as total
FROM conquest_history;

SELECT 
  'Por status:' as info,
  status,
  COUNT(*) as quantidade
FROM conquest_history 
GROUP BY status
ORDER BY status;

-- 8. MENSAGEM DE SUCESSO
SELECT '🎯 MIGRAÇÃO CONCLUÍDA COM SUCESSO! 🎯' as mensagem;
SELECT 'Agora podes executar o script de limpeza das tabelas antigas.' as proximo_passo;
