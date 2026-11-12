# Estado atual

- Entrega em foco: preservar a visão de design e uma passagem de trabalho independente do chat.
- Estado do projeto: **exploring**; design parcial, sem implementação.
- Pessoa de referência: PedroCamargoLINCE, identidade pública confirmada pelo proponente.
- Última atualização: 2026-11-06.

## O que existe

DECISIONS.md consolida as definições atuais; DESIGN-HISTORY.md preserva as rodadas, referências e propostas não aprovadas. README.md orienta a retomada. A captura original em IDEA.md foi preservada.

## Trabalho ativo e limitações

Branch: `docs/rep-0001-design-retomada`. Entrega documental vinculada à [Issue #12](https://github.com/PedroCamargoLINCE/maGbRAIN/issues/12) e ao [PR #13](https://github.com/PedroCamargoLINCE/maGbRAIN/pull/13); consultar esses registros para o estado de integração. O bloqueio inicial da API foi resolvido após publicação do ambiente. Issues e PRs abertos foram consultados: nenhuma outra tarefa aberta sobre esta entrega foi identificada. A solicitação de merge do proponente aplica-se a esta documentação; o jogo continua em exploring.

Crédito público confirmado explicitamente pelo proponente: PedroCamargoLINCE, registrado em contributions/2026-11-04-rep-0001-design.json. Nenhum outro participante foi informado.

## Próxima contribuição disponível

Proposta de tarefa: **definir a primeira expedição e desenhar seu ciclo completo**, ainda sem implementar. Antes de assumir, consultar Issues/PRs e abrir/vincular a nova tarefa.

Retomar destas quatro perguntas que ainda não foram respondidas:

1. Moto aberta com roupa/capacete de mergulho ou cabine? Podemos sair dela livremente para entrar nos prédios?
2. Como outras profissões exploram antes do submarino? Pequenas saídas acompanhadas e equipamento cedido são sugestão do assistente, não decisão.
3. Primeiro submarino: localizar e reativar um casco explorável, reconstruir destroços perto do domo ou outra solução?
4. Durante a viagem: pilotar, circular fazendo tarefas, comandar NPCs ou alternar? Qual atividade o jogador executa diretamente?

Depois, desenhar preparação → autorização → navegação → descoberta → retorno/resgate/morte → consequência no domo, para solo e coop. Critério da tarefa: cada etapa tem ação do jogador, decisão e consequência, com pontos em aberto explicitados e regras revisadas pelo proponente. Não escolher engine nem iniciar código antes de delimitar esse escopo.

## Pendências posteriores

Cronologia/idade do sucessor no coop; homenagem sem capacete recuperado; regras de projetos tecnológicos versus equipamentos; composição mínima por divisão; geografia/geração do mundo; custos, tempos e alcance. Não reabrir a explicação dos olhos vermelhos: o proponente definiu que não será explicada ou investigada.

## Sugestão da mosca-guia · 2026-11-06

Sugestão de Felipe (fkumagae) registrada na ficha REP-0001, com referência textual a REP-0012 e mecânica sugerida pela IA. Entrega vinculada à [Issue #24](https://github.com/PedroCamargoLINCE/maGbRAIN/issues/24), aguardando revisão e integração. [Passagem de trabalho](handoffs/2026-11-06-mosca-guia.md). Modelo virtual e divisão dos comportamentos permanecem em aberto.

## Demo mosca-guia

2026-11-11 · Demo jogável independente, Issue #33. Publicação e acesso pelas duas fichas. Fuga por regra de jogo e telemetria FlyBrain, com experimento documentado em mosca-guia/app/guide-experiments/REPORT.md.


## Bancada sensorial · 2026-11-12

Issue #35: acessos separados ao FlyBrain e à sala 3D pela ficha REP-0012; 35 condições de varredura e 20 condições de mapeamento/controle. Resultados em projects/REP-0001-jogo-submarino/mosca-guia/app/sensory-lab/REPORT.md. Controle neural do NPC continua em investigação.
