-- Script para verificar e corrigir dados de equipes inconsistentes
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar dados atuais
SELECT '=== DADOS ATUAIS ===' as info;

-- Verificar usuários
SELECT 'Usuários:' as tipo, COUNT(*) as total, 
       COUNT(CASE WHEN team = 'green' THEN 1 END) as green,
       COUNT(CASE WHEN team = 'blue' THEN 1 END) as blue,
       COUNT(CASE WHEN team = 'red' THEN 1 END) as red,
       COUNT(CASE WHEN team NOT IN ('green', 'blue', 'red') THEN 1 END) as invalid
FROM users;

-- Verificar territórios
SELECT 'Territórios:' as tipo, COUNT(*) as total,
       COUNT(CASE WHEN team_id = 'green' THEN 1 END) as green,
       COUNT(CASE WHEN team_id = 'blue' THEN 1 END) as blue,
       COUNT(CASE WHEN team_id = 'red' THEN 1 END) as red,
       COUNT(CASE WHEN team_id NOT IN ('green', 'blue', 'red') THEN 1 END) as invalid
FROM territories;

-- Verificar valores inválidos
SELECT '=== VALORES INVÁLIDOS ===' as info;

-- Usuários com equipes inválidas
SELECT 'Usuários com equipes inválidas:' as tipo, id, name, team, email
FROM users 
WHERE team NOT IN ('green', 'blue', 'red');

-- Territórios com equipes inválidas
SELECT 'Territórios com equipes inválidas:' as tipo, id, team_id, player_id, area
FROM territories 
WHERE team_id NOT IN ('green', 'blue', 'red');

-- 2. Corrigir dados inválidos (descomente se necessário)
/*
-- Corrigir usuários com equipes inválidas (definir como 'green')
UPDATE users 
SET team = 'green' 
WHERE team NOT IN ('green', 'blue', 'red');

-- Corrigir territórios com equipes inválidas (definir como 'green')
UPDATE territories 
SET team_id = 'green' 
WHERE team_id NOT IN ('green', 'blue', 'red');

-- Verificar se as correções funcionaram
SELECT '=== APÓS CORREÇÃO ===' as info;

SELECT 'Usuários:' as tipo, COUNT(*) as total, 
       COUNT(CASE WHEN team = 'green' THEN 1 END) as green,
       COUNT(CASE WHEN team = 'blue' THEN 1 END) as blue,
       COUNT(CASE WHEN team = 'red' THEN 1 END) as red
FROM users;

SELECT 'Territórios:' as tipo, COUNT(*) as total,
       COUNT(CASE WHEN team_id = 'green' THEN 1 END) as green,
       COUNT(CASE WHEN team_id = 'blue' THEN 1 END) as blue,
       COUNT(CASE WHEN team_id = 'red' THEN 1 END) as red
FROM territories;
*/

-- 3. Verificar dados específicos de um usuário (substitua pelo ID do usuário)
-- SELECT * FROM users WHERE id = 'SEU_USER_ID_AQUI';
-- SELECT * FROM territories WHERE player_id = 'SEU_USER_ID_AQUI';
