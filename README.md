# SIPROQUIM Comparador

Aplicacao local em Node.js para comparar uma lista de produtos quimicos controlados em PDF com um arquivo mensal de movimentacao em PDF, XLS, XLSX ou CSV.

## Arquitetura escolhida

Foi adotada uma arquitetura simples de camadas:

- `src/services/fileReaders`: leitura de PDF e planilhas.
- `src/services/normalizationService.js`: normalizacao dos dados para comparacao.
- `src/services/matchService.js`: correspondencia exata e aproximada por nomenclatura.
- `src/services/reportService.js`: consolidacao do relatorio.
- `src/services/exportService.js`: exportacao em JSON, CSV e Excel.
- `public/`: interface web local minimalista, sem build.

Essa abordagem reduz acoplamento e facilita ajustar regras de leitura, nomes de colunas e criterio de comparacao sem alterar a interface.

## Bibliotecas escolhidas

- `express`: servidor HTTP local leve e direto para uma aplicacao interna.
- `multer`: upload dos dois arquivos pela interface web.
- `xlsx`: leitura de `XLS`, `XLSX`, `CSV` e geracao do relatorio em Excel.
- `pdf-parse`: tentativa principal de extracao de texto do PDF.
- `pdfjs-dist`: fallback para PDFs que falham no parser principal.
- `fastest-levenshtein`: comparacao aproximada entre nomes de produtos.
- `pdfkit`: geracao dos arquivos ficticios de exemplo.

As escolhas priorizam poucas dependencias, boa compatibilidade com Node.js e capacidade de cobrir leitura, comparacao e exportacao sem etapa de build.

## Requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado

## Instalacao

```bash
npm install
```

## Execucao

```bash
npm start
```

Depois acesse `http://localhost:3000`.

## Publicacao na Netlify

Este projeto nao deve ser publicado arrastando a pasta inteira no painel da Netlify. A interface e estatica, mas o processamento dos arquivos depende das rotas `/api/process` e `/api/export`, que agora foram adaptadas para Netlify Functions.

O arquivo `netlify.toml` ja define:

- comando de build: `npm run build`
- pasta publicada: `public`
- pasta de funcoes: `netlify/functions`
- Node.js 22 para compatibilidade com as dependencias de PDF

### Opcao recomendada: GitHub/Git

1. Envie o projeto para um repositorio Git.
2. Na Netlify, escolha `Add new site` > `Import an existing project`.
3. Selecione o repositorio.
4. Mantenha as configuracoes lidas do `netlify.toml`.
5. Publique o site.

### Opcao manual com Netlify CLI

```bash
npm install
npx netlify login
npx netlify deploy --build
npx netlify deploy --build --prod
```

O primeiro deploy cria uma previa. O comando com `--prod` publica no link principal do site.

Se for necessario conferir o pacote estatico antes de publicar:

```bash
npm run build
```

Esse comando copia `images/` e `font/` para dentro de `public/`, pois somente os arquivos dentro da pasta publicada entram no deploy estatico.

## Como usar

1. Envie o PDF com a lista de produtos controlados.
2. Envie a movimentacao mensal em `PDF`, `XLS`, `XLSX` ou `CSV`.
3. Escolha o modo de comparacao:
   - `Exata + aproximada`: busca nome igual e tambem similaridade por nomenclatura.
   - `Somente exata`: exige igualdade apos normalizacao.
4. Ajuste o limite de aproximacao, se necessario.
5. Clique em `Processar arquivos`.
6. Revise o resumo e as movimentacoes encontradas.
7. Exporte o relatorio pela propria interface em `JSON`, `CSV` ou `Excel`.

## Logica de comparacao

1. O sistema extrai os nomes dos produtos controlados do PDF.
2. O arquivo de movimentacao e lido e o sistema exige que a busca do item ocorra na coluna `PN` ou `NOMENCLATURA`.
3. Os nomes dos produtos sao normalizados com remocao de acentos, minusculas, limpeza de espacos extras e reducao de caracteres especiais.
4. A correspondencia e calculada por comparacao exata do nome normalizado e por comparacao aproximada usando distancia textual, cobertura de tokens e verificacao de contencao parcial do nome.
5. Cada linha encontrada na movimentacao conta como um unico movimento.
6. O resultado final agrupa apenas as movimentacoes encontradas.

## Configuracao de colunas

Os nomes esperados das colunas ficam centralizados em `src/config/columnMappings.js`.

Na movimentacao mensal, a aplicacao usa a coluna de produto apenas se o cabecalho contiver:

- `PN`
- `NOMENCLATURA`

As demais colunas continuam sendo identificadas automaticamente quando existirem, como:

- data
- tipo de movimentacao, incluindo `TP`
- motivo/razao, incluindo `RAZAO`
- documento
- quantidade
- unidade, incluindo `UE`
- setor
- responsavel
- observacoes

Na lista em PDF, a aplicacao identifica nomes de produtos a partir das linhas de texto extraidas e ignora linhas comuns de cabecalho, titulo e paginacao.

## Arquivos de exemplo

Para gerar arquivos ficticios:

```bash
npm run generate:examples
```

Isso cria:

- `examples/lista-controlados-exemplo.pdf`
- `examples/movimentacao-exemplo.xlsx`
- `examples/movimentacao-exemplo.pdf`

Use esses arquivos diretamente na interface para validar o fluxo.

## Tratamento de erros

A aplicacao retorna mensagens claras para:

- arquivo ausente
- formato invalido
- PDF sem texto extraivel
- planilha vazia
- coluna `PN` ou `NOMENCLATURA` nao encontrada
- falha de leitura ou exportacao

## Estrutura do projeto

```text
.
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- scripts/
|   `-- generate-example-files.js
|-- src/
|   |-- config/
|   |   `-- columnMappings.js
|   |-- services/
|   |   |-- fileReaders/
|   |   |   |-- index.js
|   |   |   |-- movementPdfReader.js
|   |   |   |-- pdfReader.js
|   |   |   |-- pdfTextExtractor.js
|   |   |   `-- spreadsheetReader.js
|   |   |-- comparisonService.js
|   |   |-- exportService.js
|   |   |-- matchService.js
|   |   |-- normalizationService.js
|   |   `-- reportService.js
|   |-- utils/
|   |   |-- errors.js
|   |   `-- text.js
|   `-- server.js
`-- README.md
```

## Melhorias futuras

- permitir revisar o mapeamento de colunas pela interface antes de processar
- suportar OCR para PDFs escaneados sem texto selecionavel
- incluir filtros por periodo, tipo de movimentacao e setor
- cadastrar apelidos ou sinonimos internos de produtos
- salvar historico de processamentos
- adicionar testes automatizados para regras de leitura e matching
