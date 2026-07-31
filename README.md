# Formulário de detalhamento de despesas TED

Aplicação web estática para cadastrar cursos, detalhar despesas de projetos, acompanhar valores planejados e exportar os dados em JSON e Excel.

O projeto usa apenas HTML, CSS e JavaScript, sem backend, gerenciador de pacotes ou etapa de compilação. Todos os caminhos são relativos, portanto a aplicação pode ser publicada em um subdiretório do GitHub Pages.

## Como executar

Não há dependências para instalar nem comando de build. Como o catálogo e o modelo Excel são carregados com `fetch`, abra o projeto por meio de um servidor HTTP em vez de abrir o arquivo HTML diretamente pelo sistema de arquivos.

Exemplo com Python:

```bash
python -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

No GitHub Pages basta publicar o conteúdo da raiz. O arquivo `.nojekyll` impede o processamento pelo Jekyll.

## Estrutura de arquivos

```text
.
├── assets/
│   └── vendor/
│       ├── exceljs.min.js
│       └── exceljs.LICENSE.txt
├── css/
│   └── app.css
├── data/
│   ├── catalogo.csv
│   └── mock-data.js
├── js/
│   ├── export/
│   │   ├── data.js
│   │   ├── excel.js
│   │   └── json.js
│   ├── catalog.js
│   ├── courses.js
│   ├── expenses.js
│   ├── finance.js
│   ├── mock.js
│   ├── state.js
│   ├── ui.js
│   ├── utils.js
│   └── validation.js
├── templates/
│   └── template_exportacao.xlsx
├── .nojekyll
├── index.html
└── README.md
```

### Página e aparência

- `index.html`: contém somente a estrutura semântica da página, as etapas fixas do formulário, os diálogos e a ordem de carregamento dos scripts.
- `css/app.css`: reúne todo o estilo visual, incluindo formulário, tabelas, painel financeiro, diálogos e regras responsivas.

### Dados e arquivos externos

- `data/catalogo.csv`: fonte dos itens de despesa, unidades, classificações financeiras e marcadores de obrigatoriedade.
- `data/mock-data.js`: dados demonstrativos dos cursos. Apenas declara `window.MOCK_COURSES`; não altera a tela por conta própria.
- `templates/template_exportacao.xlsx`: modelo que é carregado e preenchido durante a exportação para Excel.
- `assets/vendor/exceljs.min.js`: cópia local do ExcelJS 4.4.0, usada para ler e gerar a planilha sem depender de CDN.
- `assets/vendor/exceljs.LICENSE.txt`: licença da biblioteca ExcelJS.

### Código JavaScript

- `js/catalog.js`: carrega e valida o CSV, normaliza categorias e tipos, agrupa unidades e monta os catálogos usados pela interface.
- `js/state.js`: mantém a etapa atual, etapas concluídas, resultado JSON, contadores, referências dos diálogos e totais financeiros compartilhados.
- `js/utils.js`: formatação monetária, máscaras de mês/ano e elemento de despesa, conversões, escape de HTML e mensagens de status.
- `js/courses.js`: cria os cartões de curso, calcula duração, turmas, margem de reserva, alimentação e transporte, sincroniza itens obrigatórios e cria os componentes das tabelas.
- `js/expenses.js`: renderiza e altera tabelas de despesas, resolve dependências entre item e unidade, controla remoções justificadas e permite adicionar itens ao catálogo.
- `js/finance.js`: recalcula linhas, totaliza despesas por classificação e fonte, calcula percentuais, saldo e indicadores do painel.
- `js/validation.js`: valida campos, formatos, limites numéricos, períodos, etapas e o formulário completo.
- `js/export/data.js`: coleta o formulário e monta a representação canônica usada tanto pelo JSON quanto pelo Excel.
- `js/export/json.js`: abre a prévia e gera o download do arquivo JSON.
- `js/export/excel.js`: valida e carrega o template, preenche o resumo, cria abas detalhadas e inicia o download da planilha.
- `js/mock.js`: limpa o formulário e aplica os dados de `data/mock-data.js`, usando os mesmos eventos e cálculos da interface.
- `js/ui.js`: controla o wizard, seções opcionais, eventos do formulário e inicialização da aplicação.

## Organização e dependências

Os scripts são clássicos e carregados em ordem no fim de `index.html`. Eles compartilham o mesmo escopo global, preservando o funcionamento da implementação original sem exigir bundler ou servidor de módulos.

A ordem é relevante:

1. ExcelJS e dados mock;
2. catálogo, estado e utilitários;
3. cursos, despesas, finanças e validação;
4. montagem dos dados e exportadores;
5. aplicação do mock;
6. interface e inicialização.

`initializeApp()` carrega o catálogo antes de registrar os eventos, criar os cursos, renderizar as tabelas e exibir a primeira etapa. Se o CSV não puder ser carregado ou validado, a inicialização é interrompida e o erro aparece no formulário.

## Regras de negócio

As regras abaixo descrevem o comportamento atualmente implementado. Os limites financeiros do painel são alertas de acompanhamento; apenas as regras identificadas como validações bloqueantes impedem avançar ou exportar.

### Dados gerais do projeto

- O custo total informado é obrigatório e não aceita valor negativo. O valor zero é aceito quando informado.
- A quantidade de cursos é obrigatória, inteira e no mínimo `1`. Alterá-la cria ou remove cartões de curso para corresponder ao número informado.
- O objetivo geral é obrigatório e limitado a 1.000 caracteres.
- Os objetivos específicos 1 e 2 são obrigatórios.
- Os objetivos específicos 3 e 4 são opcionais e podem ser removidos ou restaurados.
- Assistência técnica/gerencial e evento final são etapas opcionais, controladas por caixas de seleção.
- Ao desmarcar uma etapa opcional, suas despesas e períodos são limpos, e a etapa é retirada da navegação e da exportação.

### Dados dos cursos

Todos os campos editáveis de cada curso são obrigatórios.

- Nome: até 255 caracteres.
- Início e fim: formato `MM/AAAA`; o fim não pode ser anterior ao início.
- Carga horária total: número inteiro, mínimo de 40 horas e múltiplo de 10.
- Participantes: número inteiro, mínimo de 1.
- Margem de reserva: percentual inteiro entre 5% e 10%, inclusive.
- Carga horária diária: número inteiro entre 2 e 8 horas, inclusive.
- Encontros semanais: número inteiro entre 1 e 5, inclusive.

#### Duração

```text
duração em dias = teto(carga horária total ÷ carga horária diária)
```

O resultado é somente leitura.

#### Quantidade e distribuição de turmas

Cada turma comporta no máximo 30 participantes:

```text
quantidade de turmas = teto(participantes ÷ 30)
```

Os participantes são distribuídos da forma mais equilibrada possível. Primeiro se calcula a parte inteira da divisão pelo número de turmas; o restante é distribuído, uma pessoa por turma, a partir da primeira turma.

Exemplo: 65 participantes resultam em três turmas, distribuídas como `22 + 22 + 21`.

#### Margem de reserva

```text
participantes com margem = teto(participantes × (100 + margem) ÷ 100)
```

Essa quantidade é aplicada automaticamente aos itens de `Kit participante` e `EPI`. O `Kit trabalho` e o certificado obrigatório usam a quantidade original de participantes, sem margem.

### Catálogo de despesas

O CSV usa `;` como separador e deve conter exatamente estas cinco colunas:

```text
categoria;unidade;tipo_despesa;descricao_item;obrigatorio
```

Também são aceitos os cabeçalhos legados `Categoria`, `Unidade`, `TIPO`, `Item de Despesa Padronizado` e `Obrigatório`.

- Linhas vazias são ignoradas.
- Cada linha deve ter exatamente a mesma quantidade de colunas do cabeçalho.
- `obrigatorio` aceita somente `true` ou `false`, sem distinção de maiúsculas e minúsculas.
- Itens com a mesma descrição normalizada são agrupados, combinando suas unidades sem repetição.
- Identificadores são derivados da descrição: sem acentos, em minúsculas e com sequências não alfanuméricas substituídas por `_`.
- Os tipos financeiros são normalizados para `Gestao`, `Finalistica`, `Estruturacao` e `Kit`.
- Os itens são ordenados alfabeticamente em português.

As categorias de curso são `kit_participante`, `insumo_gerais` (exposta no código como `insumos_gerais`), `epi`, `kit_trabalho`, `alimentacao`, `transporte` e `curso_outros`. As etapas usam `stage11`, `stage12`, `assistencia` e `event`.

É possível cadastrar itens pela interface somente nas categorias Kit Trabalho, EPI e Insumos Gerais. O nome e a unidade são obrigatórios, não podem conter ponto e vírgula nem quebra de linha, e o nome normalizado não pode repetir outro item da categoria. O novo item:

- é criado como não obrigatório;
- fica disponível imediatamente na sessão atual;
- provoca o download de um novo `catalogo.csv`;
- só persiste após o arquivo baixado substituir `data/catalogo.csv` no repositório.

### Linhas de despesas

Em todas as linhas, item, detalhamento, código do elemento, unidade, quantidade e valor unitário são obrigatórios. Nas despesas dos cursos, o tipo do item também é obrigatório; nas etapas, a fonte do recurso é obrigatória.

- Código do elemento de despesa: formato exato `XX.XX.XX`.
- Quantidade: número inteiro e no mínimo 1, exceto quando calculada automaticamente.
- Valor unitário: não pode ser negativo; zero é aceito.
- Valor total da linha: `quantidade × valor unitário`.
- Unidade e tipo financeiro vêm do item selecionado no catálogo.
- As fontes disponíveis são `SISEC` e `Contrapartida`.
- Toda despesa de curso é atribuída automaticamente ao SISEC.
- Nas etapas 1.1, 1.2, assistência e evento, a fonte é escolhida pelo usuário.

### Itens obrigatórios e remoção

Os itens marcados como obrigatórios no catálogo são sincronizados automaticamente nos cursos:

- todos os itens obrigatórios de `kit_participante`;
- certificado obrigatório em `curso_outros`;
- uma linha inicial de transporte quando houver transporte obrigatório no catálogo;
- alimentação obrigatória conforme a carga horária diária.

As regras atuais de remoção são:

- itens do Kit participante, exceto apostila, podem ser removidos sem justificativa e permanecem removidos durante a edição daquele curso;
- apostila, certificado obrigatório, transporte obrigatório e alimentação exigida só podem ser removidos com justificativa formal;
- a justificativa é obrigatória e limitada a 1.000 caracteres;
- selecionar novamente o item limpa a justificativa de remoção correspondente.

As justificativas são mantidas apenas em memória no cartão do curso durante a sessão atual. No comportamento existente, elas não são incluídas no JSON nem na planilha.

### Alimentação

A obrigatoriedade depende da carga horária diária e de o item estar marcado como obrigatório no catálogo:

- entre 2 e 4 horas por dia: exige lanche; almoço fica indisponível;
- acima de 4 e até 8 horas por dia: exige lanche e almoço;
- fora do intervalo válido: nenhum item de alimentação é sincronizado.

O número base de atendimentos é:

```text
dias de aula = carga horária total ÷ carga horária diária
quantidade base = dias de aula × participantes com margem
```

Para carga diária acima de 4 horas, o lanche usa multiplicador 2. Almoço e lanche em jornadas de até 4 horas usam multiplicador 1. O resultado é arredondado para cima quando não for inteiro.

```text
quantidade de alimentação = teto(quantidade base × multiplicador)
```

A quantidade calculada fica somente leitura; o detalhamento e o valor unitário continuam editáveis.

### Transporte

Para qualquer item selecionado na categoria Transporte:

```text
dias de aula = carga horária total ÷ carga horária diária
deslocamentos de participantes = dias de aula × participantes com margem
quantidade = teto(deslocamentos de participantes × 2)
```

O fator 2 representa ida e volta. Quantidade e memória de cálculo são preenchidas automaticamente e ficam somente leitura.

### Totais por curso

- Total de itens: quantidade de linhas de despesa, não a soma das quantidades.
- Valor total do curso: soma dos valores totais das linhas.
- Valor por aluno de uma categoria: total da categoria dividido pela quantidade original de participantes, sem margem.
- O valor de Kit participante por aluno é sempre exibido.
- EPI, Insumos Gerais e Kit Trabalho por aluno só aparecem quando houver ao menos uma linha da respectiva categoria.

### Classificações e total do projeto

As despesas são acumuladas conforme o `tipo_despesa` do catálogo:

```text
subtotal percentual = Gestão + Finalística
total calculado = Gestão + Finalística + Estruturação + Kit
```

Estruturação e Kit não entram na base usada para calcular os percentuais de Gestão e Finalística.

#### Percentual de Gestão

```text
percentual de Gestão = Gestão ÷ (Gestão + Finalística) × 100
```

- Limite monitorado: no máximo 40%.
- Até 40%, inclusive: indicador de conformidade.
- Acima de 40%: alerta visual.

#### Percentual de despesas Finalísticas

```text
percentual Finalístico = Finalística ÷ (Gestão + Finalística) × 100
```

- Limite monitorado: no mínimo 60%.
- A partir de 60%, inclusive: indicador de conformidade.
- Abaixo de 60%: alerta visual.

Como a base contém apenas Gestão e Finalística, os dois percentuais somam 100% quando o subtotal é maior que zero. Sem despesas nessa base, ambos ficam em 0% e o painel exibe que aguarda despesas.

Os limites de 40% e 60% são informativos: atualmente não bloqueiam navegação, finalização ou exportação.

#### Indicador chamado de custo unitário por participante

A interface e o JSON chamam o indicador de “custo unitário por participante”, enquanto a planilha usa “Custo participante/hora médio”. A fórmula atualmente implementada é:

```text
indicador = carga horária total de todos os cursos
            × total de participantes de todos os cursos
            ÷ (Gestão + Finalística)
```

O resultado é arredondado para duas casas decimais. Essa fórmula é o inverso da fórmula monetária convencional de custo por participante/hora, que normalmente seria `(Gestão + Finalística) ÷ (carga horária × participantes)`. A documentação registra o cálculo existente sem corrigi-lo, pois esta reorganização não altera regras de negócio.

- Limite monitorado: no máximo R$ 25,00.
- Até R$ 25,00, inclusive: indicador de conformidade.
- Acima de R$ 25,00: alerta visual.
- Sem carga horária, participantes ou subtotal suficientes: resultado zero e estado “aguardando dados”.

Esse limite também é informativo e não bloqueia a exportação.

#### Saldo do orçamento

```text
saldo = custo total informado − total calculado
```

- Positivo: saldo disponível.
- Negativo: orçamento ultrapassado.
- Zero: projeto totalmente detalhado.
- Diferenças absolutas menores que R$ 0,005 são tratadas como zero para evitar ruído de ponto flutuante.

O orçamento ultrapassado gera alerta visual, mas atualmente não impede a finalização.

#### Fontes de recurso

Os totais de SISEC e Contrapartida são somados separadamente. Como as despesas de cursos são sempre SISEC, somente as despesas das demais etapas podem ser atribuídas à Contrapartida pela interface.

### Assistência técnica e evento final

- A assistência, quando habilitada, exige temática, início e fim no formato `MM/AAAA`; o fim não pode anteceder o início.
- A quantidade de participantes da assistência é a soma dos participantes de todos os cursos.
- O evento final, quando habilitado, exige período válido.
- As duas etapas aceitam despesas do catálogo próprio e fonte SISEC ou Contrapartida.

### Numeração das etapas

- Etapas iniciais: `1.1` e `1.2`.
- Cursos: começam em `1.3` e seguem sequencialmente.
- Assistência: recebe o número imediatamente posterior ao último curso.
- Evento: recebe o número posterior ao último curso ou à assistência, quando esta existir.

### Validação e navegação

- Só é possível avançar quando a etapa atual passa pelas validações bloqueantes.
- Ao tentar finalizar, todas as etapas visíveis são validadas na ordem.
- A primeira etapa inválida é aberta e o primeiro campo com erro recebe foco.
- Campos de etapas ocultas ou desabilitados são ignorados, salvo quando a validação interna da etapa solicita explicitamente considerar controles visualmente ocultos.
- Datas são comparadas por ano e mês.
- Campos numéricos aceitam somente inteiros e respeitam mínimo, máximo e múltiplo configurados.
- Comboboxes só são válidos quando o texto corresponde a uma opção real selecionada.

### Exportação JSON

O JSON contém:

- dados e totais gerais do projeto;
- resumo por classificação financeira e fonte;
- etapas 1.1, 1.2 e etapas opcionais;
- dados gerais de cada curso;
- despesas detalhadas;
- despesas resumidas por categoria.

As justificativas usadas para remover itens obrigatórios não fazem parte da exportação atual.

Kit participante, Insumos Gerais, EPI e Kit Trabalho são agrupados no resumo de cada curso. O total do grupo é preservado e o valor unitário resumido é `total do grupo ÷ quantidade resumida`. A quantidade resumida usa participantes com margem para Kit participante e EPI, participantes sem margem para Kit Trabalho e 1 para Insumos Gerais.

Valores monetários consolidados são arredondados para duas casas decimais.

### Exportação Excel

A exportação exige que `templates/template_exportacao.xlsx` contenha as abas `Resumo do projeto` e `_MODELOS`. O sistema valida essa estrutura antes do preenchimento.

O arquivo final inclui:

- resumo do projeto e das etapas;
- uma aba detalhada de despesas para cada curso;
- aba `Dados gerais cursos`;
- aba `Dados gerais do projeto`;
- aba `Objetivo geral e específicos`.

A aba `_MODELOS` serve como base interna para estilos e estruturas e é removida do arquivo final. O download recebe o nome `projeto_qualificacao.xlsx`.

## Dados demonstrativos

O botão **Gerar Mock** pede confirmação, limpa os dados editáveis e preenche o formulário a partir de `data/mock-data.js`. O preenchimento usa os mesmos eventos, sincronizações, cálculos e validações do uso manual. Ao terminar, informa se o conjunto demonstrativo passou por todas as validações.

## Manutenção

Ao alterar uma regra de negócio:

1. atualize o módulo responsável;
2. confira o painel financeiro e as validações;
3. gere JSON e Excel para verificar se os dois formatos continuam consistentes;
4. atualize a seção correspondente deste README.

Ao atualizar o ExcelJS, substitua o arquivo em `assets/vendor/` e mantenha a licença compatível. Ao alterar o modelo Excel, preserve as abas e marcadores esperados por `js/export/excel.js`.
