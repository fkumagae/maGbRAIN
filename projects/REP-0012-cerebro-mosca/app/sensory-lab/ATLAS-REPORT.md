# Atlas e executor · 2026-11-12

Primeira entrega do plano aprovado por Felipe: identidade verificável e ensaios reproduzíveis antes de um piloto. Issue #37.

## Identidade verificada

build-atlas.py reutiliza scripts/build_connectome.py e os CSVs originais: neurons.csv.gz, classification.csv.gz e connections.csv.gz. Confere todos os 2.698.236 registros de conexão e os metadados dos 139.255 neurônios, byte a byte, contra o binário descomprimido. A ordenação estável por grupo reproduz a do worker. Os 471 candidatos do ensaio anterior passam a ter root_id textual, anotações e todas as conexões incidentes. IDs são texto para evitar perda de precisão no JavaScript. Hashes dos insumos e do worker estão no atlas; o laboratório recusa conectoma ou worker incompatível (hash do código com finais de linha normalizados).

| Índice | root_id | Anotação original | Disparos no ensaio de odor 0,30 |
|---|---|---|---:|
| 99987 | 720575940623636701 | ALLN, right | 3 |
| 100133 | 720575940632403986 | ALLN, left | 3 |
| 100555 | 720575940622726271 | ALPN, uniglomerular, right | 1 |

Anotações são do conjunto de dados. Não comprovam função motora, nem que as duas primeiras células sejam um par funcional. O atlas cobre candidatos selecionados, não todas as células do conectoma. O construtor original atribui sinal positivo quando o neurotransmissor é desconhecido: 17.067 linhas de conexões usam esse fallback; a reprodução exata preserva essa limitação.

## Executor e sincronização

Abrir sensory-lab/laboratory.html. Pode buscar ID/índice/população, inspecionar conexões, executar, pausar, continuar, cancelar e exportar. O worker dedicado reutiliza as equações existentes e avança manualmente. Cada amostra contém exatamente o estímulo aplicado naquele passo, contagens de todas as populações e potencial/disparo das três células acima mais a célula selecionada no início. Não há jogo, movimento, temporizador neural adaptativo nem injeção por frame gráfico neste ensaio.

Protocolo: limiar 1; leak 0,95; refratário 3; 100 passos por condição (10 base, 60 entrada, 30 recuperação), com reset completo entre condições. 16 condições: vazio, quatro modalidades em correntes 0,10/0,20/0,30, odor 0,30 sem conexões e rampas visuais slow/fast até 0,30. São perfis sintéticos, não sensores biológicos calibrados. A posição do NPC ainda não fornece lateralidade. A remoção de conexões zera os pesos e os restaura ao terminar/cancelar; não é ablação seletiva.

## Resultados

Bateria automática executada em Chrome: 1.600 amostras, 16 condições completas. Odor 0,20: quatro disparos fora da entrada; odor 0,30: sete. Demais condições: zero disparos fora da entrada. Controles vazio e sem conexões: zero. As rampas visuais distintas continuam sem gerar disparos a jusante no limiar original; isso não demonstra ausência de potenciais ou função biológica. Não alteramos limiar para produzir artificialmente um piloto.

lab-check.json registra testes de identidade, tela móvel, pausa estável, retomada, sequência de passos, exportação e cancelamento parcial. automatic-results.json contém os dados completos da execução concluída. Modelo determinístico: estas condições não são réplicas biológicas independentes.

## Reprodução

Na raiz do aplicativo, execute `node sensory-lab/map-neurons.cjs` e, com os três CSVs originais em data/, `python sensory-lab/build-atlas.py`. Os CSVs não são duplicados na publicação; são os insumos já presentes no checkout FlyBrain. O construtor original está em scripts/build_connectome.py. Os hashes no atlas permitem verificar os arquivos usados. Servir o aplicativo por HTTP local ou HTTPS; abrir laboratory.html e executar/exportar. Teste de navegador: instalar Playwright com Chrome disponível, definir TEST_BASE para a raiz do site e executar `node sensory-lab/lab-check.cjs` (PLAYWRIGHT_MODULE opcional).

## Limite desta entrega

Atlas inicial e executor concluídos. Piloto, codificação espacial e ablações seletivas ainda pendentes. Plano completo em projects/REP-0012-cerebro-mosca/PLAN.md.
