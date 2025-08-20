-- Adicionar política DELETE para territórios
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar políticas atuais
SELECT '=== POLÍTICAS ATUAIS ===' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'territories'
ORDER BY policyname;

-- 2. Adicionar política DELETE para territórios
-- Esta política permite que qualquer usuário autenticado delete territórios
-- (necessário para a lógica de conquista funcionar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'territories' AND policyname = 'Users can delete territories') THEN
    CREATE POLICY "Users can delete territories" ON territories 
    FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Verificar se a política foi criada
SELECT '=== APÓS ADIÇÃO ===' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'territories'
ORDER BY policyname;

-- 4. Testar se a política está funcionando
-- (Execute este comando para verificar se você pode deletar territórios)
-- DELETE FROM territories WHERE id = 'test-id';
