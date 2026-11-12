# MagLab Node · passagem de trabalho

Felipe (fkumagae), 2026-11-12; Codex. Issue #39, branch feat/maglab-node. Escopo: preparar plano e controle local por script, sem IA durante ensaios.

## Entrega

CLI e API runCampaign, configuração JSON validada, perfis constante/rampa/pulso, remoção seletiva de saídas, checkpoint por ensaio e proteção de integridade. Relatório importável no laboratório. Documentação em sensory-lab/node/README.md. Campos de configuração nunca são executados como código. O worker neural original é reutilizado.

## Evidências

Testes Node em test.cjs/test-results.json: resultados individuais conhecidos, controles, retomada idêntica, interrupção no meio do ensaio, hashes, arquivos existentes, sobreposição de corrente e configurações inválidas. example-report.json registra a bateria inicial. A remoção das saídas dos três candidatos não mudou o total de sete disparos nessa condição; isso não valida nem descarta função motora. Build/diff e importação no navegador conferidos antes de publicar.

## Próximo passo e limites

Analisar potenciais/latências e então definir outra bateria. Interface espacial e decodificador ainda não implementados. Retomada refaz somente o ensaio interrompido, preservando completos. Resultados novos ficam locais e não são versionados automaticamente. A UI importa arquivos, não controla uma sessão Node remota. Nenhum segredo ou serviço novo necessário.

## Crédito

Felipe definiu objetivo, escopo e autorizou execução. Codex implementou e verificou; ficha 2026-11-12-maglab-node. Projeto continua exploring.
