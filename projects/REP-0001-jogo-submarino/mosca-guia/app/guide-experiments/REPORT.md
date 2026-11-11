# Aproximação visual no FlyBrain

## Resultado

O worker original distingue a entrada na população diretamente estimulada, mas **não produziu disparos em nenhuma população não estimulada** neste ensaio. GNG_DESC permaneceu em zero nas nove execuções. Não há sinal descendente demonstrado que justifique atribuir a fuga ao cérebro virtual. A demo usa uma regra de jogo explícita para fugir e pode exibir a telemetria visual real do FlyBrain.

## Protocolo reproduzível

Execute `node flybrain/guide-experiments/run-experiment.cjs` a partir da pasta Mag Brain. O script carrega o código original `js/sim-worker.js` num contexto Node, descomprime o conectoma local e chama a mesma função `tick()` sem temporizador. Ele não substitui nem reimplementa o modelo neural. O arquivo `results.json` contém configuração, hashes SHA-256 das fontes, resumo e 1.080 amostras com contagens das 63 populações.

A rede usada possui 139.255 neurônios e 2.698.236 arestas. Foram mantidos os parâmetros originais, incluindo leak 0,95, limiar 1, refratário 3 passos e normalização global dos pesos para máximo absoluto 0,15. Cada execução começa com potenciais, disparos, refratários e ativação de grupos zerados. As três repetições têm condições iniciais idênticas e são determinísticas, não amostras de variabilidade biológica.

Cada cenário tem 120 passos a 10 Hz nominais, equivalentes a 12 segundos de tempo de jogo. O jogador começa a 5 m da mosca. Durante os primeiros 3 segundos, permanece parado, aproxima-se a 1,1 m/s ou a 4,4 m/s, conforme o cenário. A distância mínima é 0,8 m. Ao alcançar esse limite ou terminar os 3 segundos, a aproximação cessa. O restante mede relaxamento. A duração de movimento real é menor no cenário rápido porque ele chega ao limite mais cedo. Os registros incluem distância e velocidade em todos os passos para explicitar essa diferença.

A mosca é fixa neste ensaio para isolar a entrada sensorial. Um objeto com raio aparente de 0,5 m representa o jogador. A taxa de expansão angular é `2*r*max(v,0)/(d*d+r*r)`. A corrente por neurônio de VIS_R1R6 é `0.02 + 0.48*min(1, taxa/0.3)`. Apenas essa população recebe corrente externa. A área aparente cresce com a aproximação e a entrada representa sua expansão temporal. Esse mapeamento, suas unidades e ganho são uma escolha experimental de jogo, sem calibração fisiológica.

## Medidas por repetição

| Condição | Corrente máxima | Disparos VIS_R1R6 | Disparos GNG_DESC | Disparos em todas as outras populações |
|---|---:|---:|---:|---:|
| Parado | 0,02 | 0 | 0 | 0 |
| Lento | 0,50 | 45.948 | 0 | 0 |
| Rápido | 0,50 | 22.974 | 0 | 0 |

As três repetições de cada cenário produziram séries de disparos idênticas. No primeiro segundo de registro, o lento e parado tiveram zero disparos, enquanto o rápido teve 22.974, todos na população diretamente estimulada. Os pulsos completos de 11.487 neurônios refletem a injeção uniforme e a sincronização do modelo. Eles não demonstram reconhecimento de ameaça.

A soma de disparos ao longo da execução é maior no cenário lento, pois o estímulo dura mais. Um classificador baseado apenas nessa soma confundiria a comparação. Uma janela inicial separa os estímulos, mas depende da distância inicial e mede principalmente a corrente artificial aplicada. Não foi adotada como circuito de fuga.

As populações denominadas DN_FLIGHT, DN_STARTLE e DN_BACKUP estão vazias nos metadados locais. GNG_DESC tem 3.581 neurônios e é uma saída observável, mas apresentou zero neste protocolo. A ausência de disparos com esta normalização e estas entradas não prova ausência de circuitos de fuga na mosca real ou noutro modelo.

## Integração

O arquivo `brain-adapter.js` oferece `GuideBrain.create({onSample,onStatus})`, `init()`, `setApproach(distance,closingSpeed)`, `reset()`, `getSamples()` e `dispose()`. Ele usa fetch local, o Worker original e o mesmo mapeamento visual. As amostras contêm entrada submetida, fração visual, fração GNG_DESC, disparos fora da população visual e identificação `escapeSource="game-rule"`. O limite de retenção é 6.000 amostras. A inicialização neural ocorre em segundo plano e falhas preservam a regra de jogo. A telemetria em tempo real usa mensagens assíncronas a aproximadamente 10 Hz e não deve ser tratada como timestamp físico exato.

O trajeto, esconderijo, espera, retomada e descoberta são controlados pelo jogo. Nenhum deles foi atribuído ao conectoma.

## Verificação no navegador

O adaptador foi aberto em Chrome no servidor local em `http://127.0.0.1:8772/guide-experiments/adapter-check.html`. Foram observadas 12 amostras paradas com zero disparos, estímulo rápido com 45.948 disparos visuais e zero disparos fora da população estimulada, e 7 amostras após reset com zero disparos. Nenhum erro JavaScript foi observado. O ensaio do navegador é uma verificação de integração e reset, com entrada rápida sustentada em distância fixa, distinta do protocolo cinemático controlado. As amostras e o resultado estão em `browser-check.json`.
