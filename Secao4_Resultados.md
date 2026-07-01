# 4. RESULTADOS

## 4.1. Desenvolvimento/Prototipação

O protótipo do sistema SIF-Cargas (API WIM-RS) foi desenvolvido em duas camadas principais: um back-end responsável pela lógica de negócio e simulação dos dados de pesagem, e um front-end responsável pela visualização das informações em forma de painel.

### Back-End

O back-end foi implementado em **Python**, utilizando o framework **FastAPI**. Ele expõe uma API REST responsável por:

- Receber leituras simuladas de sensores de pesagem em movimento (HS-WIM — High-Speed Weigh-in-Motion);
- Cadastrar e consultar veículos;
- Calcular o peso estático estimado a partir do peso dinâmico medido;
- Classificar o veículo conforme a tabela do CONTRAN;
- Decidir a ação a ser tomada (liberar, autuar ou reter o veículo);
- Registrar o histórico de passagens e gerar estatísticas agregadas.

Os dados são persistidos em um arquivo `banco_dados_wim.json`, que funciona como um banco de dados simplificado, armazenando três coleções: `veiculos` (cadastro de veículos), `historico_wim` (histórico de passagens analisadas) e `solicitacoes_desbloqueio` (pedidos de liberação de bloqueio fiscal).

### Front-End

O front-end foi desenvolvido em **React** (projeto `painel-rodovia`), consumindo os dados expostos pela API para exibir o painel de monitoramento das rodovias, com indicadores de fluxo, status das passagens e alertas gerados pelo sistema.

### Principais etapas de desenvolvimento

1. **Definição das regras de pesagem**: criação da tabela `TABELA_CONTRAN`, contendo a quantidade de eixos e o Peso Bruto Total (PBT) legal para cada classe de veículo (ex.: 2C, 3C, 4C, 2S3, 3S3, 3S2S2, 3S3S3).
2. **Simulação do sensor HS-WIM**: criação da rota `/api/analisar_hswim`, que recebe placa, velocidade, peso dinâmico, número de eixos lidos e condição do pavimento.
3. **Cadastro automático de veículos**: quando uma placa nova é identificada, o sistema gera um veículo fictício compatível com o número de eixos detectado, simulando a existência de um cadastro/nota fiscal por trás da placa.
4. **Cálculo do peso estático estimado**: aplicação de um fator de erro dinâmico (DIF), calculado a partir da velocidade do veículo e da condição do pavimento, para converter o peso dinâmico medido em uma estimativa de peso estático.
5. **Distribuição de carga por eixo**: simulação da distribuição do peso total entre os eixos do veículo, permitindo identificar sobrecargas localizadas em eixos específicos.
6. **Lógica de decisão**: comparação do peso estimado com o peso declarado, com o limite legal (PBT) e com o limite por eixo, definindo a ação final do sistema.
7. **Painel de visualização**: integração do front-end React com as rotas de histórico e estatísticas da API, para apresentação gráfica dos resultados.

### Condições de análise definidas no projeto

Os parâmetros utilizados para a tomada de decisão foram centralizados na configuração `HSWIM_CONFIG`:

| Parâmetro | Valor | Descrição |
|---|---|---|
| Faixa de velocidade operacional | 60 a 120 km/h | Faixa em que a leitura do sensor é considerada válida |
| Fator de erro base (DIF) | 4% | Erro mínimo de medição dinâmica |
| Incremento de erro por km/h | 0,08% | Erro adicional por km/h acima de 60 km/h |
| Erro por condição de pavimento | 0% (bom) / 2% (regular) / 5% (ruim) | Erro adicional conforme o estado da via |
| Margem de incerteza | 5% | Faixa de confiança do peso estimado |
| Fator de triagem | 1,03 | Multiplicador do PBT legal usado para decidir retenção |
| Tolerância fiscal | 5% | Margem aceitável entre peso declarado e peso estimado |
| Fator de limite por eixo | 1,125 | Multiplicador usado para definir o limite máximo de carga por eixo |

Com base nesses parâmetros, o sistema classifica cada passagem em três ações possíveis:

- **TRÂNSITO LIBERADO** — quando o peso estimado está dentro dos limites legais e fiscais;
- **AUTUAÇÃO – NOTIFICAR SEFAZ/DAER** — quando há excesso fiscal ou de trânsito, mas sem necessidade de retenção imediata;
- **RETER PARA PESAGEM ESTÁTICA** — quando o excesso é grave, há divergência na quantidade de eixos, ou um eixo específico está sobrecarregado.

## 4.2. Apresentação e Análise dos Resultados Obtidos

*(Seção a ser preenchida após a execução de uma amostra de simulações via API. Estrutura recomendada abaixo.)*

### Amostra analisada

- Quantidade total de passagens simuladas no período de teste;
- Distribuição das passagens por classe de veículo (QFV): 2C, 3C, 4C, 2S3, 3S3, 3S2S2, 3S3S3.

### Veículos com excesso de carga

- Quantidade e percentual de veículos que apresentaram `alerta_fiscal` e/ou `alerta_transito` igual a verdadeiro, em relação ao total da amostra.

### Tipos de sobrecarga identificados

- **Sobrepeso total (PBT)**: veículos cujo peso estático estimado superou o PBT legal da classe;
- **Divergência de eixos**: veículos em que o número de eixos lido pelo sensor não coincidiu com o número de eixos oficial do cadastro;
- **Sobrepeso por eixo**: veículos em que um ou mais eixos individuais superaram o limite calculado (`limite_por_eixo_kg`), indicando quais eixos especificamente estavam sobrecarregados.

### Níveis de sobrecarga detectados

- Classificação das ocorrências por faixas de excesso (ex.: 0–10%, 10–20%, acima de 20% em relação ao limite legal), com base no campo `diferenca_kg` de cada registro.

### Análise numérica e gráfica

- Distribuição das ações tomadas pelo sistema (liberado, autuado, retido), obtida pela rota `/api/estatisticas`;
- Velocidade média das passagens registradas;
- Fluxo de passagens por horário, indicando os períodos de maior movimento;
- Recomenda-se apresentar essas informações em gráficos de barras/pizza extraídos do painel `painel-rodovia`, complementados por tabelas com os valores numéricos.

### Síntese dos resultados

- Resumo conclusivo indicando o percentual de veículos dentro da conformidade legal, o percentual com irregularidades, as causas mais frequentes de sobrepeso (por classe, por carga transportada ou por rodovia) e a efetividade da lógica de triagem implementada no protótipo.

### Demais dados e análises

- Quaisquer métricas adicionais relevantes para a proposta específica do projeto, como correlação entre tipo de carga e ocorrência de sobrepeso, ou rodovia com maior incidência de irregularidades.
