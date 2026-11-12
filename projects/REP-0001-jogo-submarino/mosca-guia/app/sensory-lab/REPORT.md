# Mapeamento sensorial · 2026-11-12

## Resultado e limite

A saída medida é atividade neural simulada. Ainda não há comando motor validado para o NPC. A sala conserva sua fuga e trajeto por regras. O FlyBrain original preserva sua própria camada de comportamento; vê-lo se mover não valida uma associação biológica entre célula e comando.

No limiar original 1,00, odor alimentar provocou sete disparos fora da população injetada: três no índice 99987 (OLF_LN), três no 100133 (OLF_LN) e um no 100555 (OLF_PN). São índices internos ordenados por grupo, **não root_ids FlyWire**. Precisam dos hashes do worker e conectoma presentes nos JSON para serem interpretados.

Aproximação visual, luz, toque e vibração alteram potenciais a jusante, mas não produziram disparos a jusante nas condições da varredura original. Ausência de disparo neste protocolo não prova ausência de função biológica.

## Varredura de ontem

`sweep.cjs` / `sweep.json`: 35 condições = sete entradas × cinco limiares (1; 0,30; 0,10; 0,03; 0,01), com reset por execução. Cada execução: 100 passos, 10 sem entrada, 60 com entrada, 30 sem entrada. Passo nominal 0,1 s, não uma calibração temporal fisiológica. Leak 0,95, refratário 3. Potenciais medidos depois da atualização/reset; não são mV.

As aproximações lenta e rápida usam velocidade dividida pela distância ao quadrado, saturação a 0,50 e distância mínima 0,80. Não há retina espacial nem detecção visual real de objeto em expansão. Luz e aproximação injetam na mesma população VIS_R1R6. Para limiares ≤ 0,10, os totais de disparos dessas três condições são idênticos: o teste revela perda de discriminação. Não usar esse limiar para afirmar reconhecimento de ameaça.

Odor usa OLF_ORN_FOOD; toque usa MECH_BRISTLE; vibração usa MECH_JO (classificação ampla, incluindo anotações mecânicas). São injeções artificiais em populações inteiras, não sensores calibrados. A vibração da varredura é pulsada (3 de cada 10 passos); no painel e no novo mapeamento é constante. Não comparar os dois como se fossem o mesmo protocolo.

No limiar 0,30, visual gera disparos em GNG_DESC. O nome desse agrupamento não estabelece direção, fuga nem identidade funcional. Limiares menores são diagnósticos, não ajustes validados biologicamente.

## Novo teste de propagação por célula

`node sensory-lab/map-neurons.cjs`, executado na raiz do aplicativo. Reutiliza o texto exato do worker, sem alterar suas equações, e carrega o mesmo binário. 20 condições = cinco entradas (vazio, visual, odor, vibração, toque) × dois limiares × conexões presentes/zeradas. Corrente constante 0,30, mesma janela de 100 passos. `neuron-map.json` registra todos os índices a jusante com ao menos um disparo ou V máximo ≥ 0,10, número de disparos e primeiro passo de disparo.

| Entrada | Disparos a jusante, limiar 1 | Disparos a jusante, limiar 0,30 |
|---|---:|---:|
| Sem entrada | 0 | 0 |
| Visual | 0 | 5 |
| Odor | 7 | 340 |
| Vibração constante | 0 | 1 |
| Toque | 0 | 124 |

Em todos os dez controles com pesos sinápticos zerados, não houve disparos nem candidatos a jusante. As injeções foram preservadas. Isso demonstra dependência das conexões no modelo; não isola um caminho sináptico específico nem prova causalidade de comportamento. As oito condições intactas comparáveis coincidem com a varredura anterior (excluída vibração, cujo perfil mudou). Ver `reproducibility.json`. Modelo determinístico: repetir não é uma réplica biológica independente.

## Bancada e acesso

Na sala, abrir **Bancada de estímulos**, desativar aproximação para isolar outras entradas, escolher uma corrente e aplicar. Aplicar reinicia a rede; **Controle sem entrada** zera as injeções; **Exportar registro** baixa até os últimos 1.200 passos. Objetos da sala ilustram os canais, mas distância aos objetos ainda não modula odor/vibração. O painel mede populações; o mapa de resultados fornece os candidatos individuais do ensaio offline.

Testes de navegador de 11/11: controle sem entrada, odor, limiar diagnóstico, exportação, jogo após reset e layout móvel; `browser-results.json` sem erros e `gameStillWorks=true`. A verificação integrada de 12/11 está em `site-check.json`.

## Próxima etapa delimitada

1. Reconstruir e verificar a correspondência dos índices com root_ids/anotações do conjunto original; não deduzir função pelo nome agregado.
2. Separar codificação espacial/temporal de aproximação e luminosidade e evitar saturação; comparar estímulos em diversas intensidades/durações com controles pareados.
3. Traçar conexões dos candidatos e fazer ablações seletivas, conservando os controles sem entrada e sem conexões.
4. Só então testar um decodificador explícito de saída (virar/parar/avançar), validando seletividade, latência e falsos positivos em cenários que não serviram para escolher parâmetros. Até lá, não remover a rota do NPC como se fosse autonomia neural demonstrada.

Fonte da classificação: scripts/build_connectome.py do FlyBrain; fonte dinâmica: js/sim-worker.js. Créditos e licença MIT do projeto original preservados no aplicativo.
