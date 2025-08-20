-- Correção das Políticas de Segurança para o Jogo Geo
-- Execute este SQL no SQL Editor do Supabase APÓS executar o database-setup.sql

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert during signup" ON users;

-- 2. Criar política mais permissiva para inserção de utilizadores
-- Esta política permite inserção durante o registo
CREATE POLICY "Users can insert during signup" ON users 
FOR INSERT WITH CHECK (true);

-- 3. Verificar se as outras políticas estão corretas
-- (Não é necessário recriar as outras políticas se já existem)

-- 4. Testar se as políticas estão funcionando
-- Podes verificar executando: SELECT * FROM users LIMIT 1;
