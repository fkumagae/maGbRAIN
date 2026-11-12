# Passagem de trabalho

- Data/participante: 2026-11-12, Felipe (fkumagae); ferramenta: Codex.
- Ideias: REP-0012 e REP-0001; Issue #35; branch feat/flybrain-sensory-lab.
- Escopo: restaurar FlyBrain e separar acessos; continuar mapeamento, sem afirmar controle neural do NPC.

## Alterações

Portal cerebro-mosca/ abre FlyBrain, sala e resultados. Jogo conserva mosca-guia/. FlyBrain estático não carrega módulos do cuidador que exigem servidor privado na porta 7600. Fonte da visualização original preservada; alterações locais preexistentes de lab.html não incorporadas. Bancada injeta estímulos explícitos e registra atividade; mapa oferece índices e controles.

## Evidências

Relatório, sweep.json (35 condições), neuron-map.json (20 condições), comparação dos ensaios e resultados de navegador na pasta sensory-lab do aplicativo. Build e diff devem passar antes do envio. A publicação deve ser conferida após integração.

## Limites e próxima ação

Não há identidade FlyWire confirmada para índices nem comando motor validado. Próximo trabalho está delimitado no REPORT.md: validar identidade, separar estímulos visuais, ablação seletiva e só depois decodificador. Projeto continua exploring. Dados ficam em arquivos públicos sem depender do chat.

## Crédito

Felipe definiu objetivos e conduziu solicitações; Codex implementou e verificou. Revisar atribuição na ficha 2026-11-12-flybrain-sensory-lab.
