# Documentação do projeto: Transforma PDF

Última atualização: 18/11/2025

## Visão geral

"Transforma PDF" é um webapp single-page (React + Vite + TypeScript) cuja finalidade é permitir o upload de um arquivo PDF, extrair cada página como imagem, e gerar PDFs A4 prontos para impressão contendo réplicas das artes organizadas automaticamente em grids ou sequencialmente em folhas A4.

Público-alvo: artesãos, designers e pequenos produtores que precisam imprimir tags, cartões, etiquetas e outras artes em folhas A4 com múltiplas cópias por página.

Stack técnico:

- React 19 + TypeScript
- Vite (bundler/dev server)
- TailwindCSS para estilos
- pdfjs-dist para renderizar páginas PDF em canvas
- jsPDF para montar e gerar os PDFs finais (A4)

## Estrutura do projeto (principal)

- `src/`
  - `App.tsx` — Componente root da aplicação. Integra o hook `usePdfPages`, controla flags/inputs de configuração (ex.: `tileAllPagesOnA4`, `maxRows`) e monta a UI principal.
  - `main.tsx` — Entrypoint React que renderiza o `App` em `#root`.
  - `index.css` — Importa Tailwind e define variáveis de tema.
  - `vite-env.d.ts` — Tipos Vite para o TypeScript.
  - `assets/` — Recursos estáticos (ex.: `react.svg`, `favicon.png`).
  - `hooks/`
    - `usePdfPages.ts` — Hook central: extrai páginas, gera PDFs, mantém estados e URLs de blobs.
  - `components/`
    - `PdfUploader.tsx` — Input de arquivo + feedback de progresso.
    - `PdfActions.tsx` — Exibição de miniaturas, preview embutido e links de download para o PDF mesclado e PDFs individuais.
    - `GeneratePDF.tsx` — Botão simples para acionar geração (reutilizável).
    - `MaxRowsInput.tsx` — Campo numérico para limitar o número de linhas por A4.
    - `ArteConfig.tsx` — Pequeno controle para configurar tamanho da arte (cm) — não ligado diretamente ao fluxo atual do `App`.

## Fluxo da aplicação

1. Usuário envia um PDF pelo `PdfUploader`.
2. `usePdfPages.extractPages` carrega o PDF usando `pdfjs-dist`, renderiza cada página em um canvas (scale 6) e converte a imagem em DataURL (JPEG).
3. O hook armazena as imagens (tipo `PageData`) e chama `generateAllPDFs` para criar:
   - Um PDF mesclado (`mergedPdfUrl`) contendo, para cada página de origem, o grid replicado (ou um A4 com uma réplica de cada página, dependendo da opção).
   - PDFs individuais por página (quando aplicável) com as réplicas da arte.
4. `PdfActions` mostra miniaturas das páginas extraídas, botão para abrir preview/baixar o PDF mesclado e botões para visualizar/baixar PDFs individuais.

## Hooks — `usePdfPages` (detalhado)

Exportações principais:

- `pages: PageData[]` — array contendo as páginas extraídas; cada `PageData` tem:
  - `imgDataUrl: string` (dataURL JPEG)
  - `width: number` e `height: number` (obtidos de `page.view` do pdfjs)
- `loading: boolean` — indica se a extração está em andamento.
- `progress: { current:number, total:number }` — progresso da extração.
- `mergedPdfUrl: string | null` — URL de objeto (blob) para download/preview do PDF mesclado.
- `individualPdfUrls: string[]` — URLs blob para PDFs individuais (um por página).
- `originalFileName: string | null` — nome do arquivo enviado.

Funções exportadas:

- `extractPages(file: File, maxRows?: number, tileAllPagesOnA4?: boolean): Promise<void>`

  - Lê o PDF como ArrayBuffer e usa `pdfjs-dist` para obter cada página.
  - Renderiza cada página em um canvas com escala fixa (`scale: 6`) e gera DataURL JPEG.
  - Atualiza `pages` e `progress`, e chama `generateAllPDFs`.
  - Parâmetros:
    - `maxRows` (opcional): limita o número de linhas do grid por A4.
    - `tileAllPagesOnA4` (opcional): quando `true`, gera um A4 com UMA réplica de cada página (distribuídas sequencialmente com wrap).

- `generateAllPDFs(pages: PageData[], maxRows?: number, tileAllPagesOnA4?: boolean): void`
  - Gera o PDF mesclado e PDFs individuais no formato A4 (pontos/pt).
  - Estratégias:
    1. `tileAllPagesOnA4 === true`: coloca as artes sequencialmente numa folha A4, empacotando horizontalmente e fazendo wrap para a próxima linha; adiciona novas páginas A4 quando necessário.
    2. Caso contrário: para cada página de origem, calcula um grid replicado (com `getReplicatedPositionsInA4Grid`) e preenche a página A4 com múltiplas réplicas da mesma arte.
  - Cria blobs via `jsPDF.output("blob")` e armazena URLs via `URL.createObjectURL`.

Helpers internos importantes:

- `cleanupObjectUrls()` — revoga URLs de blob previamente criadas para evitar memory leaks.
- `getFittedSize(artW, artH, pageW, pageH, gap)` — redimensiona (somente redução) a arte para caber dentro do A4 com gaps.
- `getReplicatedPositionsInA4Grid(...)` — calcula posições x/y/w/h para o grid replicado, centralizando horizontalmente e respeitando `maxRows`.

Constantes relevantes:

- A4 em pontos: `a4Width = 595.28`, `a4Height = 841.89`.

Observações sobre robustez:

- O hook já faz revogação de URLs quando gera novos PDFs.
- Não há currently tratamento de erro explícito (try/catch) em todos os pontos críticos — seria interessante adicionar mensagens de erro e UX adequada.

## Componentes (detalhado)

- `PdfUploader.tsx`

  - Props: `onFileSelected(file: File)`, `loading`, `progress`.
  - Comportamento: input HTML tipo `file` com `accept="application/pdf"`. Quando selecionado, chama `onFileSelected`. Quando `loading=true`, exibe um loader e o texto de progresso (e.g., "Extraindo página X de Y...").

- `PdfActions.tsx`

  - Props: `pages`, `mergedPdfUrl`, `individualPdfUrls`, `originalFileName?`.
  - Comportamento:
    - Mostra botão para visualizar/baixar o PDF mesclado (quando `mergedPdfUrl` existe).
    - Renderiza miniaturas (`page.imgDataUrl`) para cada página extraída.
    - Se `individualPdfUrls[index]` existir, exibe botão para visualizar/baixar o PDF individual daquela página.
    - Gerencia modal de preview que usa `<object data={previewUrl} type="application/pdf">` para embutir o PDF no modal.

- `GeneratePDF.tsx`

  - Props: `onGenerate()`, `disabled?`.
  - Botão simples e reutilizável (não fortemente integrado no `App` atual, mas pronto para uso).

- `MaxRowsInput.tsx`

  - Props: `value: number | undefined`, `onChange: (value: number | undefined) => void`.
  - Transforma a entrada de texto em número ou `undefined` (campo vazio) e passa ao pai.

- `ArteConfig.tsx`
  - Props: `sizeCm`, `setSizeCm`.
  - Pequeno controle para ajustar o tamanho da arte em centímetros. No fluxo atual não está ligado, mas é útil para futuras features (por ex., ajustar escala baseada em dimensão física).

## Como rodar (local)

Pré-requisitos: Node.js ou Bun (o projeto funciona com gerenciadores comuns). As instruções abaixo usam npm e Bun como alternativa.

Instalar dependências (npm):

```bash
npm install
```

Iniciar em modo desenvolvimento (Vite):

```bash
npm run dev
```

Ou com Bun (se preferir):

```bash
bun install
bun run dev
```

Build para produção:

```bash
npm run build
```

Preview do build:

```bash
npm run preview
```
