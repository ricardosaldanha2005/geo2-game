-- Verificar se há usuários com equipe 'blue' no banco
SELECT 
  id,
  name,
  team,
  email
FROM users 
WHERE team = 'blue'
ORDER BY created_at DESC;

-- Verificar se há territórios da equipe azul
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
WHERE t.team_id = 'blue'
ORDER BY t.conquered_at DESC;

-- Atualizar usuário para equipe azul (substitua 'SEU_USER_ID' pelo ID correto)
-- UPDATE users SET team = 'blue' WHERE id = 'SEU_USER_ID';

-- Verificar se a normalização está funcionando corretamente
-- A função normalizeTeam deveria retornar 'blue' para 'blue', mas pode estar retornando 'green'
