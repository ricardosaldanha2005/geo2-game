-- Jogo Geo - Configuração do Banco de Dados
-- Execute este SQL no SQL Editor do Supabase

-- 1. ATIVAR POSTGIS (OBRIGATÓRIO)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabela de usuários
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT CHECK (team IN ('green', 'blue', 'red')) NOT NULL,
  score INTEGER DEFAULT 0,
  current_position POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de equipes
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT CHECK (color IN ('green', 'blue', 'red')) UNIQUE NOT NULL,
  score_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de territórios (AGORA COM POSTGIS ATIVO)
CREATE TABLE territories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  player_id UUID REFERENCES users(id),
  polygon GEOMETRY(POLYGON, 4326) NOT NULL,
  area DOUBLE PRECISION NOT NULL,
  conquered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de quizzes
CREATE TABLE quiz (
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

-- 6. Inserir equipes iniciais
INSERT INTO teams (name, color) VALUES 
  ('Equipa Verde', 'green'),
  ('Equipa Azul', 'blue'),
  ('Equipa Vermelha', 'red');

-- 7. Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para usuários
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert during signup" ON users FOR INSERT WITH CHECK (true);

-- 9. Políticas para equipes
CREATE POLICY "Teams are viewable by all" ON teams FOR SELECT USING (true);

-- 10. Políticas para territórios
CREATE POLICY "Territories are viewable by all" ON territories FOR SELECT USING (true);
CREATE POLICY "Users can insert territories" ON territories FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 11. Políticas para quiz
CREATE POLICY "Quiz are viewable by all" ON quiz FOR SELECT USING (true);
CREATE POLICY "Users can insert quiz" ON quiz FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 12. Índices para performance
CREATE INDEX idx_users_team ON users(team);
CREATE INDEX idx_territories_team_id ON territories(team_id);
CREATE INDEX idx_territories_created_at ON territories(created_at);
CREATE INDEX idx_quiz_team_id ON quiz(team_id);

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

-- 14. Trigger para atualizar score da equipe
CREATE TRIGGER trigger_update_team_score
  AFTER INSERT ON territories
  FOR EACH ROW
  EXECUTE FUNCTION update_team_score();
