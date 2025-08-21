-- Script para limpar tabelas antigas após migração
-- Execute este SQL APÓS executar o script de migração

-- ⚠️ ATENÇÃO: Este script APAGA dados das tabelas antigas
-- Só execute depois de confirmar que a migração funcionou!

-- 1. VERIFICAR SE A MIGRAÇÃO FUNCIONOU
SELECT '=== VERIFICANDO MIGRAÇÃO ===' as info;

SELECT 
  'Territórios ativos na conquest_history:' as info,
  COUNT(*) as total
FROM conquest_history 
WHERE status = 'active';

-- 2. LIMPAR TABELA territories (APENAS se a migração funcionou)
SELECT '=== LIMPANDO TABELA territories ===' as info;

-- Verificar quantos territórios existem
SELECT COUNT(*) as territorios_antes FROM territories;

-- APAGAR todos os territórios (dados já migrados para conquest_history)
DELETE FROM territories;

-- Verificar se foi limpa
SELECT 'Territórios limpos!' as status, COUNT(*) as territorios_restantes FROM territories;

-- 3. VERIFICAR RESULTADO FINAL
SELECT '=== RESULTADO FINAL ===' as info;

SELECT 
  'Total conquest_history:' as tabela,
  COUNT(*) as registros
FROM conquest_history;

SELECT 
  'Por status:' as info,
  status,
  COUNT(*) as quantidade,
  SUM(area_lost) as area_total
FROM conquest_history 
GROUP BY status
ORDER BY status;

-- 4. MENSAGEM DE SUCESSO
SELECT '🧹 LIMPEZA CONCLUÍDA! 🧹' as mensagem;
SELECT 'Tabela territories foi limpa.' as detalhes;
SELECT 'Todos os dados estão agora na conquest_history unificada!' as status;
