-- Adicionar sistema de vida das áreas na tabela territories
-- Execute este SQL no SQL Editor do Supabase

-- 1. Adicionar coluna para vida da área (em segundos)
-- Para desenvolvimento: 1 minuto = 60 segundos
-- Para produção: 24 horas = 86400 segundos
ALTER TABLE territories 
ADD COLUMN IF NOT EXISTS lifetime_seconds INTEGER DEFAULT 60;

-- 2. Adicionar coluna para data de expiração
ALTER TABLE territories 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Atualizar registros existentes com data de expiração
UPDATE territories 
SET expires_at = created_at + INTERVAL '1 minute'
WHERE expires_at IS NULL;

-- 4. Criar função para calcular automaticamente a data de expiração
CREATE OR REPLACE FUNCTION set_territory_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir data de expiração baseada no lifetime_seconds
  NEW.expires_at = NEW.created_at + (NEW.lifetime_seconds || ' seconds')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para definir automaticamente a data de expiração
DROP TRIGGER IF EXISTS trigger_set_territory_expiration ON territories;
CREATE TRIGGER trigger_set_territory_expiration
  BEFORE INSERT ON territories
  FOR EACH ROW
  EXECUTE FUNCTION set_territory_expiration();

-- 6. Criar função para processar áreas expiradas
CREATE OR REPLACE FUNCTION process_expired_territories()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  territory_record RECORD;
BEGIN
  -- Buscar territórios expirados
  FOR territory_record IN 
    SELECT id, team_id, player_id, area
    FROM territories 
    WHERE expires_at <= NOW()
  LOOP
    -- Registrar no histórico de conquistas como "esgotada"
    INSERT INTO conquest_history (
      territory_id, 
      conquering_team, 
      conquered_team, 
      area_lost, 
      player_id
    ) VALUES (
      territory_record.id,
      'expired', -- Equipe conquistadora é "expired" para indicar esgotamento
      territory_record.team_id,
      territory_record.area,
      territory_record.player_id
    );
    
    -- Descontar pontos do jogador que perdeu a área
    UPDATE users 
    SET score = GREATEST(0, score - ROUND(territory_record.area * 1000))
    WHERE id = territory_record.player_id;
    
    -- Remover o território expirado
    DELETE FROM territories WHERE id = territory_record.id;
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para verificar e processar áreas expiradas periodicamente
CREATE OR REPLACE FUNCTION check_expired_territories()
RETURNS void AS $$
BEGIN
  -- Processar territórios expirados
  PERFORM process_expired_territories();
END;
$$ LANGUAGE plpgsql;

-- 8. Criar índice para performance na verificação de expiração
CREATE INDEX IF NOT EXISTS idx_territories_expires_at ON territories(expires_at);

-- 9. Verificar se tudo foi criado corretamente
SELECT 
  'Sistema de vida das áreas configurado!' as status,
  (SELECT COUNT(*) FROM territories WHERE expires_at IS NOT NULL) as territories_with_expiration,
  (SELECT COUNT(*) FROM territories WHERE expires_at <= NOW()) as expired_territories;

-- 10. Testar a função de processamento (opcional)
-- SELECT process_expired_territories() as territories_processed;
