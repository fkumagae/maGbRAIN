# Resultados publicados do MagLab

Estes dados foram executados localmente e publicados a pedido de Felipe. A pasta results era ignorada pelo Git; por isso o GitHub tinha exemplos e ferramentas, mas não todos os registros locais. As duas baterias abaixo agora são versionadas integralmente, exceto logs vazios/PIDs/locks operacionais. Atributos Git preservam os bytes para não invalidar hashes em Windows.

## Bateria básica — 99 ensaios

- [Configuração](mapeamento-basico-2026-11-12/config.json)
- [Resumo](mapeamento-basico-2026-11-12/output/report.md)
- [Relatório importável no MagLab](mapeamento-basico-2026-11-12/output/report.json)
- [Neurônios por teste, CSV](mapeamento-basico-2026-11-12/neuronios-por-teste.csv)
- [Conclusões numéricas](mapeamento-basico-2026-11-12/resumo.json)
- [Executor da campanha](mapeamento-basico-2026-11-12/executar.cjs)
- [Dados passo a passo e checkpoints](mapeamento-basico-2026-11-12/output/)

99 condições, 22.940 passos. Controles negativos sem disparos; oito neurônios fora das populações de entrada dispararam em alguma condição. Isso ainda não define comandos motores. Entradas: odor, visual e contato, intensidades/durações/perfis, combinações e retirada seletiva de saídas.

## Bateria inicial — 13 ensaios

[Configuração](mobility-001/config.json), [resumo](mobility-001/report.md), [relatório importável](mobility-001/report.json) e [dados completos](mobility-001/).

## Reprodução e preservação

Use o executor documentado em [../README.md](../README.md), apontando para a configuração desejada e **uma pasta nova de saída**. Não edite os arquivos arquivados: os checkpoints registram seus hashes. Reexecutar não exige IA. O script da campanha de 99 pode retomar a pasta output, mas, estando completa, apenas lê/verifica os resultados; para uma nova execução use run.cjs com --out novo.

As próximas baterias continuam locais até publicação explícita. Foram conferidos os hashes de todos os arquivos dos checkpoints, a contagem e a sequência dos passos antes deste envio. Proveniência e limites estão nos próprios relatórios. Não há posição espacial nem piloto validado nesta bateria.
