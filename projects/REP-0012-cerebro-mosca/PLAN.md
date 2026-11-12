# Plano do laboratório à navegação autônoma

Proposta de Felipe, aprovada para execução em 2026-11-12. Projeto permanece exploring. Cada fase exige evidência antes de avançar; não interpretar a conclusão da fase 1 como autonomia.

1. **Concluído — base de laboratório:** atlas inicial de candidatos com root_ids verificados, conexões, executor determinístico com pausa/cancelamento e registros sincronizados. Evidências: ATLAS-REPORT.md, atlas.json, automatic-results.json, lab-check.json. Issue #37.
2. **Pendente — codificação sensorial:** representar posição e direção dos estímulos em grupos identificados. Separar luz constante de expansão visual. Curvas de dose, duração e recuperação; não escolher parâmetros apenas porque geram disparos.
3. **Pendente — causalidade:** retirar saídas de candidatos individualmente e em conjuntos, comparar controles pareados e estimulação isolada. Registrar efeito sobre células seguintes e preservar IDs/versões.
4. **Pendente — piloto mínimo:** decodificador explícito de velocidade, giro e parada, sem fornecer posição do alvo à camada motora. Ambiente calcula sensores e colisões; rede fornece sinais. Inicialmente uma hipótese de engenharia, sem alegação de função biológica comprovada.
5. **Pendente — navegação fechada:** localizar fonte de odor, aproximar-se e evitar obstáculos, sem pontos de passagem. Movimento altera a percepção seguinte. Modo separado da demo roteirizada.
6. **Pendente — validação:** comparar rede conectada, rede desconectada e piloto por regras; posições e mapas reservados. Definir previamente limites de sucesso, colisões, tempo e estabilidade. Acrescentar aproximação/abrigo apenas após a tarefa simples funcionar.

Próxima tarefa delimitada: ablação seletiva das três células de odor e análise temporal de suas conexões, com ensaios de corrente pareados. Não deduzir sinal de giro apenas de side=left/right.

## Executor local por script · 2026-11-12

Felipe delimitou os testes às entradas úteis para mobilidade do NPC e pediu execução automática sem consumo de tokens por ensaio. Issue #39: executor Node.js configurável, checkpoints por ensaio, relatórios e importação no MagLab. Plano operacional e comandos em app/sensory-lab/node/README.md. Primeira bateria: 13 condições sensoriais/controladas; ainda sem ambiente espacial nem piloto. Analisar os dados antes de escolher a próxima bateria; nenhuma IA é chamada pelo executor.
