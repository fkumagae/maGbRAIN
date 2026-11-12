# MagLab por script — sem IA durante a execução

Esta interface executa localmente o mesmo worker neural usado pelo laboratório. Não usa API, modelo de linguagem, navegador, rede ou pacote npm. Requer Node.js instalado (validado com a versão registrada em `report.json`). O computador fornece CPU, memória e disco. O site público pode visualizar relatórios, mas não executar Node.js no celular.

## Executar

Abra um terminal na raiz do aplicativo FlyBrain (a pasta que contém `data/`, `js/` e `sensory-lab/`). No repositório maGbRAIN essa raiz é `projects/REP-0001-jogo-submarino/mosca-guia/app/`.

```powershell
node sensory-lab/node/run.cjs --config sensory-lab/node/mobility-inputs.json --out sensory-lab/node/results/bateria-001
```

Use uma pasta nova por configuração. Para executar só dois ensaios agora, acrescente `--max-cases 2`. Para interromper, Ctrl+C: a execução para no próximo passo disponível. Para retomar:

```powershell
node sensory-lab/node/run.cjs --config sensory-lab/node/mobility-inputs.json --out sensory-lab/node/results/bateria-001 --resume
```

Ensaios completos são preservados. O ensaio interrompido é refeito desde o reset, nunca anexado parcialmente. Configuração, worker, conectoma, executor e versão Node devem coincidir. A integridade dos arquivos completos é conferida por SHA-256. Arquivos existentes não são sobrescritos sem retomada explícita. `--max-cases` conta novos ensaios da chamada atual, não os já concluídos.

O arquivo `.lock` impede duas execuções na mesma pasta. Ctrl+C normal o remove. Se o processo for encerrado à força, confirme que o PID registrado no arquivo já terminou e só então remova esse `.lock` antes de retomar. Não execute duas instâncias na mesma pasta. Gravações atômicas protegem checkpoints, mas falta de espaço/falha física do disco pode exigir uma pasta nova; o executor recusa artefatos corrompidos.

## Configuração JSON v1

Copie `mobility-inputs.json` e edite a cópia. Campos desconhecidos são rejeitados para evitar erros silenciosos.

- `parameters`: limiar (`threshold`), retenção de potencial (`leak`), passos refratários (`refractory`). O exemplo mantém 1 / 0,95 / 3; mudar isso é uma intervenção diagnóstica, não calibração biológica.
- `watch`: índices internos a registrar individualmente a cada passo. Não são root_ids. O atlas permite consultar a correspondência.
- `cases`: lista ordenada de ensaios, cada um com `id` único, `steps` e `stimuli`.
- Cada estímulo tem `group`, `start` inclusivo, `end` exclusivo, `current` (0 a 0,5) e `profile`: `constant`, `ramp` ou `pulse`. Rampa cresce linearmente de zero até a corrente; pulso tem `period` e `on`, em passos, alinhados ao início. Estímulos sobrepostos no mesmo grupo somam; acima de 0,5 são recusados antes da execução.
- `disconnectAll: true` zera todos os pesos sinápticos no ensaio.
- `disconnectOutgoing: [99987]` zera apenas as conexões que saem daquela célula. Ela ainda pode receber sinal e disparar; não equivale a desligar o neurônio inteiro. Os pesos originais são restaurados antes do próximo ensaio.

Exemplo de um ensaio:

```json
{
  "id": "odor-pulsado",
  "steps": 120,
  "stimuli": [{"group":"OLF_ORN_FOOD","start":10,"end":90,"current":0.3,"profile":"pulse","period":10,"on":3}],
  "disconnectOutgoing": [99987]
}
```

O motor é determinístico, não usa aleatoriedade; repetições idênticas não são réplicas biológicas. Limites: 10 milhões de passos por campanha, 10 mil ensaios, 256 células acompanhadas e 32 estímulos por ensaio. Arquivos por passo podem ficar grandes; comece com campanhas curtas e acompanhe o espaço em disco.

## Saídas

- `config.json`: configuração integral.
- `checkpoint.json`: ensaios concluídos e hashes.
- `<id>.ndjson`: uma linha JSON por passo com entrada efetivamente aplicada, disparos de todas as populações e potencial/disparo das células acompanhadas.
- `<id>.summary.json`: totais e candidatos individuais fora das populações de entrada (disparo ou potencial pós-atualização >= 0,1).
- `report.json`: resumo importável no MagLab, com configuração e proveniência.
- `report.md`: tabela legível para comparação.

Abra o laboratório visual e use **Importar resultado local** para escolher `report.json`. O arquivo fica no navegador, sem upload. Os índices do relatório pertencem ao modelo identificado pelos hashes; a importação apenas mostra os dados, não certifica arquivos editados externamente. Para campanhas cujo relatório ultrapasse 25 MB, divida a configuração; os NDJSON continuam disponíveis para análise local.

## Controle por outro script Node

```js
const {runCampaign} = require('./sensory-lab/node/run.cjs');
const config = require('./minha-configuracao.json');
let parar = false;
runCampaign({
  config, output: './resultados/ensaio-001', resume: false,
  shouldStop: () => parar,
  onProgress: progresso => console.log(progresso)
}).then(relatorio => console.log(relatorio.status));
```

Retorna uma Promise. `shouldStop` é consultado entre passos; use um evento/temporizador para mudar a variável. Não envia comandos a uma aba aberta: executa a simulação neural local, independentemente da interface. O laboratório visual serve para inspecionar os resultados. Teste automatizado: `node sensory-lab/node/test.cjs`.

## Plano orientado à mobilidade

1. **Pronto:** executor offline, perfis temporais, controles, remoção seletiva de saídas, retomada e relatório importável.
2. **Primeira bateria pronta:** odor 0,10/0,20/0,30; controles vazio e sem conexões; remoção das saídas das três células candidatas, separadas e em conjunto; visão constante/rampa/pulso e contato. O exemplo contém 13 ensaios de 100 passos.
3. **Analisar após rodar:** comparar disparos, potenciais e tempos nas conexões seguintes. A primeira execução reproduziu sete disparos com odor 0,30; remover as saídas das três células não mudou esse total. Isso não prova ausência de efeito em potenciais ou outras condições e ainda não identifica um comando motor.
4. **Próxima interface:** configuração espacial com fonte, posição/orientação do NPC e obstáculos; codificação direcional fundamentada nos dados. Hoje as situações são perfis de corrente, não posições na sala; visão ainda não é uma retina espacial.
5. **Depois:** decodificador explícito de avanço/giro/parada e testes fechados comparando rede conectada, desconectada e piloto por regras. Definir critérios de sucesso antes da avaliação. Sem rota predefinida e sem entregar a posição do alvo ao decodificador.

Não é necessário consultar IA entre ensaios. Prepare uma configuração, rode até terminar, preserve a pasta e depois analise o relatório. A interpretação e a escolha da próxima bateria ficam separadas da execução automática.
