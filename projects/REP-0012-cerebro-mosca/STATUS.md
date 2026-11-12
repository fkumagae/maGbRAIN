# Estado · 2026-11-12

Exploring. Atlas inicial e executor implementados na Issue #37, branch feat/flybrain-atlas-runner. 471 candidatos identificados após conferir 139.255 neurônios e 2.698.236 conexões; bateria de 16 condições/1.600 passos registrada. Piloto neural ainda não implementado. Próximas fases em PLAN.md; evidências no ATLAS-REPORT.md do aplicativo. Felipe (fkumagae) definiu objetivos e autorizou a execução; Codex implementou e verificou.


Issue #39: MagLab aceita campanhas JSON via CLI/API Node local, preserva ensaios completos na retomada e importa report.json. Primeira bateria offline executada e testada. Limite: entradas são correntes em populações; percepção espacial e piloto continuam pendentes.


Raiz corrigida na Issue #41: toda a implementação fica em REP-0012/app e os acessos canônicos em cerebro-mosca/. REP-0001 preserva somente a proposta de integração ao jogo de Pedro.


Issue #43: arquivos completos das baterias locais (99 e 13 ensaios) publicados em app/sensory-lab/node/results/, incluindo configurações, relatórios e dados por passo. Conferidos hashes e sequência. Ver índice README.md nessa pasta.

## Piloto experimental · Issue #45 · 2026-11-12

Primeiro giro guiado por potenciais neurais implementado em app/pilot/, separado da demo do jogo. Análise dos 99 ensaios e 48 percursos arquivados: neural 11/12 chegadas, rede desligada e sem leitura 2/12, regras 12/12. Avanço fixo, bordas e parada continuam regras; não há circuito motor biológico validado. Leia app/pilot/REPORT.md. O estado anterior de piloto pendente foi superado apenas para este escopo experimental; autonomia geral permanece pendente.
