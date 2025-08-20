-- Script para verificar o status do banco de dados
-- Execute este SQL no SQL Editor do Supabase para ver o que já está configurado

-- Verificar se as tabelas existem
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'teams', 'territories', 'quiz')
ORDER BY table_name;

-- Verificar se o PostGIS está ativo
SELECT 
  'PostGIS Extension' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN '✅ Ativo'
    ELSE '❌ Não ativo'
  END as status;

-- Verificar políticas de segurança
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'teams', 'territories', 'quiz')
ORDER BY tablename, policyname;

-- Verificar dados nas tabelas
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'territories' as table_name, COUNT(*) as record_count FROM territories
UNION ALL
SELECT 'quiz' as table_name, COUNT(*) as record_count FROM quiz;

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
