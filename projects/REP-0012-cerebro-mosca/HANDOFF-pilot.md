# Passagem de trabalho · 2026-11-12

- Participante: Felipe (fkumagae), objetivos e autorização; Codex como ferramenta de implementação/verificação.
- Ideia e Issue: REP-0012, #45.
- Branch: feat/flybrain-neural-pilot.
- Objetivo: analisar os resultados locais e iniciar um controle experimental verificável da mosca.

## O que mudou

Análise dos 99 ensaios; mapa olfativo lateral verificável; adapter compartilhado Node/browser do worker original; calibração e giro por potenciais de duas ALLN; arena 2D independente do jogo, controles e exportação. Resultados de 48 percursos e 16 sondagens preservados em app/pilot/. Acesso pelo portal Cérebro de mosca e laboratório.

## Verificações e evidências

Executados analyze.cjs, probe.cjs, evaluate.cjs (48 percursos), check.cjs e build_site.py. Chrome headless em 390 × 844: chegada neural em 189 passos no cenário padrão, pausa estável, rede desconectada com potenciais/giro zero, reinício, sem transbordamento horizontal ou erros de página. Captura mobile-check.png. Evidências em REPORT.md, analysis-99.json, probe-results.json, evaluation.json e test-results.json.

## Pendências e bloqueios

Piloto é hipótese de engenharia. Velocidade fixa, bordas e parada são regras; não há neurônios motores validados, obstáculos interiores ou codificação fisiológica. Neural chegou em 11/12, controles desligados em 2/12, regra direta em 12/12. Falha preservada no relatório. Não integrar este resultado como controle biológico validado no jogo.

## Próxima ação concreta

Ablação individual das duas leituras e recuperação, depois posições novas e ruído. Executar os scripts na pasta app/pilot/; nenhum faz chamadas de IA. A reconstrução do mapa exige CSVs originais, conferidos por hash. Não copiar dados privados.

## Estado da tarefa

Primeiro piloto experimental implementado e testado; projeto permanece exploring. Publicação e PR registrados no histórico GitHub desta branch.
