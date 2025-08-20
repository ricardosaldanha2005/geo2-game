-- Jogo Geo - Configuração do Banco de Dados (Versão Segura)
-- Execute este SQL no SQL Editor do Supabase
-- Esta versão verifica se as tabelas existem antes de criá-las

-- 1. ATIVAR POSTGIS (OBRIGATÓRIO)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT CHECK (team IN ('green', 'blue', 'red')) NOT NULL,
  score INTEGER DEFAULT 0,
  current_position POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT CHECK (color IN ('green', 'blue', 'red')) UNIQUE NOT NULL,
  score_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de territórios (AGORA COM POSTGIS ATIVO)
CREATE TABLE IF NOT EXISTS territories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  player_id UUID REFERENCES users(id),
  polygon GEOMETRY(POLYGON, 4326) NOT NULL,
  area DOUBLE PRECISION NOT NULL,
  conquered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de quizzes
CREATE TABLE IF NOT EXISTS quiz (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options TEXT[] NOT NULL,
  team_id TEXT NOT NULL,
  player_id UUID REFERENCES users(id),
  points INTEGER DEFAULT 0,
  answered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir equipes iniciais (apenas se não existirem)
INSERT INTO teams (name, color) VALUES 
  ('Equipa Verde', 'green'),
  ('Equipa Azul', 'blue'),
  ('Equipa Vermelha', 'red')
ON CONFLICT (color) DO NOTHING;

-- 7. Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para usuários (apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view all users') THEN
    CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert during signup') THEN
    CREATE POLICY "Users can insert during signup" ON users FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 9. Políticas para equipes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Teams are viewable by all') THEN
    CREATE POLICY "Teams are viewable by all" ON teams FOR SELECT USING (true);
  END IF;
END $$;

-- 10. Políticas para territórios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'territories' AND policyname = 'Territories are viewable by all') THEN
    CREATE POLICY "Territories are viewable by all" ON territories FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'territories' AND policyname = 'Users can insert territories') THEN
    CREATE POLICY "Users can insert territories" ON territories FOR INSERT WITH CHECK (auth.uid() = player_id);
  END IF;
END $$;

-- 11. Políticas para quiz
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz' AND policyname = 'Quiz are viewable by all') THEN
    CREATE POLICY "Quiz are viewable by all" ON quiz FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz' AND policyname = 'Users can insert quiz') THEN
    CREATE POLICY "Users can insert quiz" ON quiz FOR INSERT WITH CHECK (auth.uid() = player_id);
  END IF;
END $$;

-- 12. Índices para performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
CREATE INDEX IF NOT EXISTS idx_territories_team_id ON territories(team_id);
CREATE INDEX IF NOT EXISTS idx_territories_created_at ON territories(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_team_id ON quiz(team_id);

-- 13. Função para atualizar score da equipe automaticamente
CREATE OR REPLACE FUNCTION update_team_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar score da equipe quando um território é inserido
  -- Pontos = km² conquistados (área exata)
  UPDATE teams 
  SET score_total = score_total + NEW.area
  WHERE color = NEW.team_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Trigger para atualizar score da equipe (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_team_score') THEN
    CREATE TRIGGER trigger_update_team_score
      AFTER INSERT ON territories
      FOR EACH ROW
      EXECUTE FUNCTION update_team_score();
  END IF;
END $$;

-- 15. Verificação final
SELECT 
  'Database setup completed successfully!' as status,
  (SELECT COUNT(*) FROM teams) as teams_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'teams', 'territories', 'quiz')) as tables_created;
