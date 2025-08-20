-- Verificar registros 'expired' no conquest_history
SELECT 
  conquering_team,
  conquered_team,
  area_lost,
  conquered_at,
  COUNT(*) as total_registros
FROM conquest_history 
WHERE conquering_team = 'expired'
GROUP BY conquering_team, conquered_team, area_lost, conquered_at
ORDER BY conquered_at DESC;

-- Resumo por equipe
SELECT 
  conquered_team as equipe,
  COUNT(*) as areas_esgotadas,
  SUM(area_lost) as area_total_esgotada
FROM conquest_history 
WHERE conquering_team = 'expired'
GROUP BY conquered_team
ORDER BY area_total_esgotada DESC;

-- Verificar se há territórios ativos que deveriam ter expirado
SELECT 
  id,
  team_id,
  area,
  expires_at,
  NOW() as agora,
  (expires_at < NOW()) as deveria_ter_expirado
FROM territories 
WHERE expires_at < NOW()
ORDER BY expires_at DESC;
