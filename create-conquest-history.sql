-- Criar tabela de histórico de conquistas para estatísticas
-- Execute este SQL no SQL Editor do Supabase

-- 1. Criar tabela de histórico de conquistas
CREATE TABLE IF NOT EXISTS conquest_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID,
  conquering_team TEXT NOT NULL,
  conquered_team TEXT NOT NULL,
  area_lost DOUBLE PRECISION NOT NULL,
  player_id UUID REFERENCES users(id),
  conquered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE conquest_history ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para histórico de conquistas
CREATE POLICY "Conquest history is viewable by all" ON conquest_history 
FOR SELECT USING (true);

CREATE POLICY "Users can insert conquest history" ON conquest_history 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_conquest_conquering_team ON conquest_history(conquering_team);
CREATE INDEX IF NOT EXISTS idx_conquest_conquered_team ON conquest_history(conquered_team);
CREATE INDEX IF NOT EXISTS idx_conquest_conquered_at ON conquest_history(conquered_at);

-- 5. Verificar se foi criada
SELECT 'Tabela conquest_history criada com sucesso!' as status;
