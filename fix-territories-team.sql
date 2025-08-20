-- Verificar territórios com team_id incorreto
SELECT 
  t.id,
  t.team_id,
  t.player_id,
  u.name,
  u.team as user_team,
  t.area,
  t.conquered_at
FROM territories t
LEFT JOIN users u ON t.player_id = u.id
WHERE t.team_id != u.team
ORDER BY t.conquered_at DESC;

-- Corrigir territórios com team_id incorreto
UPDATE territories 
SET team_id = u.team
FROM users u
WHERE territories.player_id = u.id 
  AND territories.team_id != u.team;

-- Verificar se a correção funcionou
SELECT 
  t.id,
  t.team_id,
  t.player_id,
  u.name,
  u.team as user_team,
  t.area,
  t.conquered_at
FROM territories t
LEFT JOIN users u ON t.player_id = u.id
ORDER BY t.conquered_at DESC
LIMIT 10;
