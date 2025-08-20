-- Verificar equipe do usuário atual
SELECT 
  id,
  name,
  team,
  email,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Verificar territórios recentes e suas equipes
SELECT 
  t.id,
  t.team_id,
  t.player_id,
  u.name as player_name,
  u.team as player_team,
  t.area,
  t.conquered_at
FROM territories t
LEFT JOIN users u ON t.player_id = u.id
ORDER BY t.conquered_at DESC
LIMIT 10;
