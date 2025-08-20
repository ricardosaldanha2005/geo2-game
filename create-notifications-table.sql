-- Criar tabela de notificações para sincronização
-- Execute este SQL no SQL Editor do Supabase

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS territory_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('territory_created', 'territory_deleted', 'territory_conquered')),
  territory_id UUID,
  player_id UUID REFERENCES users(id),
  team_id TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE territory_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para notificações
CREATE POLICY "Notifications are viewable by all" ON territory_notifications 
FOR SELECT USING (true);

CREATE POLICY "Users can insert notifications" ON territory_notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON territory_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON territory_notifications(created_at);

-- 5. Verificar se foi criada
SELECT 'Tabela territory_notifications criada com sucesso!' as status;
