-- SCRIPT DE LIMPEZA COMPLETA - COMEÇAR DO ZERO
-- ⚠️ ATENÇÃO: Este script APAGA TODOS os dados existentes!

-- 1. LIMPAR TABELA territories (se existir)
SELECT '=== LIMPANDO TABELA territories ===' as info;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'territories') THEN
        DELETE FROM territories;
        RAISE NOTICE 'Tabela territories limpa!';
    ELSE
        RAISE NOTICE 'Tabela territories não existe';
    END IF;
END $$;

-- 2. LIMPAR TABELA conquest_history
SELECT '=== LIMPANDO TABELA conquest_history ===' as info;

DELETE FROM conquest_history;
SELECT 'Tabela conquest_history limpa!' as status;

-- 3. RESETAR SCORES DOS JOGADORES
SELECT '=== RESETANDO SCORES ===' as info;

UPDATE users SET score = 0;
SELECT 'Scores resetados para 0!' as status;

-- 4. VERIFICAR RESULTADO
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
  'Total conquest_history:' as tabela,
  COUNT(*) as registros
FROM conquest_history;

SELECT 
  'Total users com score:' as info,
  COUNT(*) as jogadores
FROM users 
WHERE score > 0;

-- 5. MENSAGEM DE SUCESSO
SELECT '🧹 LIMPEZA COMPLETA CONCLUÍDA! 🧹' as mensagem;
SELECT 'Todas as tabelas foram limpas.' as detalhes;
SELECT 'Podes começar a criar territórios novos!' as proximo_passo;
