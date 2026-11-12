# Primeiro piloto experimental de odor

## Resultado e interpretação

Analisamos a bateria publicada de 99 ensaios (22.940 passos). Oito células tiveram disparos posteriores à entrada; todos esses casos envolveram odor. Os 12 controles negativos não tiveram disparos posteriores. Visão e toque produziram potenciais, mas não disparos posteriores nas condições testadas: isso não demonstra ausência de resposta biológica.

Retirar as conexões de saída das três células selecionadas manteve 25 disparos no caso odor 0,3 / 180 passos, mas alterou os picos de potencial de 113 candidatos presentes em ambos os relatórios. Portanto, contar somente disparos escondia efeitos. Candidatos ausentes por limiar de registro não foram tratados como zero. Detalhes: `analysis-99.json`, gerado por `node analyze.cjs`.

## Como a mosca começa a andar

Duas antenas virtuais amostram um campo gaussiano de odor. A concentração vira corrente sintética de 0,055 a 0,1 nos ORNs com lado anatômico confirmado: 912 esquerdos e 925 direitos; 14 sem lado foram excluídos. O mapa preserva os root_ids e hashes das fontes originais.

O worker LIF original recebe essas correntes. Lemos os potenciais de duas células ALLN: índice 100133 / root_id 720575940632403986 (esquerda) e 99987 / 720575940623636701 (direita). São interneurônios olfativos; não foram identificados como neurônios motores. A calibração aplica corrente unilateral em duas condições de 400 passos; uma matriz 2x2 transforma os potenciais em estimativas dos sinais laterais. A diferença normalizada orienta o giro. A função motora recebe somente esses potenciais e a calibração, sem coordenadas do alvo.

**Este é um decodificador de engenharia de potenciais subthreshold, não uma função motora biológica comprovada.** O avanço tem velocidade fixa; reação às bordas e parada ao alcançar a fonte são regras do ambiente. O movimento muda o estímulo seguinte, sem rota pré-traçada. Não há obstáculos interiores nem tempo fisiológico calibrado.

## Comparação controlada

São 12 cenários determinísticos (seis poses iniciais × duas fontes), executados em quatro modos, com limite de 1.200 passos e raio de chegada 0,6. Mesmas condições de velocidade, arena e colisão em todos os modos. A calibração usa estímulos isolados, não trajetórias de navegação.

| Modo | Chegadas | Mediana de passos entre sucessos |
|---|---:|---:|
| Potenciais neurais controlam giro | 11/12 | 414 |
| Todas as conexões zeradas | 2/12 | 698,5 |
| Sem leitura neural, giro zero | 2/12 | 698,5 |
| Regra direta das antenas | 12/12 | 142 |

A falha neural foi da pose (-4,-3,0) à fonte (-2,-2): distância final 0,8856, acima de 0,6. Não ajustamos o parâmetro para ocultá-la. O controle por regras foi melhor e mais rápido. Os casos não são réplicas biológicas independentes e não sustentam generalização para mapas novos. Os controles desligados ainda podem chegar por coincidência e pela reação às bordas.

`evaluation.json` contém os 48 percursos completos, entradas, potenciais, comandos e hashes do código; `probe-results.json` contém as sondagens laterais conectadas e desconectadas. A conectividade influencia o comportamento neste simulador, mas ainda falta demonstrar causalidade seletiva das células e construir saídas de velocidade/parada.

## Executar localmente

Na pasta deste arquivo, com Node instalado:

```sh
node analyze.cjs
node probe.cjs
node evaluate.cjs
node check.cjs
```

Os três primeiros comandos substituem os respectivos JSONs de resultados e não chamam IA. `evaluate.cjs` executa os 48 casos completos. Para regenerar o mapa, `python build-sensory-map.py --data-dir CAMINHO_DOS_CSV_ORIGINAIS`; os hashes são conferidos antes da geração.

Abra `cerebro-mosca/pilot/` no site, clique **Iniciar** e toque na arena para mudar a fonte. Compare os quatro modos e use **Exportar trajetória** para guardar a experiência. O cérebro e o laboratório continuam acessíveis separadamente.

## Próximos testes

1. Ablação seletiva de cada célula de leitura, controles de recuperação e inversão lateral; medir mudança de giro.
2. Poses e fontes novas, campo ruidoso e fonte desligada; registrar fracassos e tempo antes de ajustar parâmetros.
3. Identificar saídas descendentes/motoras com evidência anatômica; substituir avanço fixo por controle explícito de velocidade e parada.
4. Só depois integrar visão de aproximação e obstáculos, comparando sempre com controles sem rede e por regras.
