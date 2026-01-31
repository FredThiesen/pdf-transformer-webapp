# src/hooks/usePdfPages.ts

## Propósito
Lógica central de PDF: extrair páginas, montar layouts A4 e expor URLs para preview/download.

## Responsabilidades principais
- Extrair cada página do PDF como imagem usando pdfjs-dist.
- Gerar PDF A4 combinado (mergedPdfUrl) com jsPDF.
- Gerar PDFs A4 por página (individualPdfUrls), exceto no modo tileAllPagesOnA4.
- Limpar object URLs para evitar vazamentos de memória.

## Entradas/Saídas
- extractPages(file, maxRows?, tileAllPagesOnA4?, gap?): preenche pages, progress e URLs.
- generateAllPDFs(pages, maxRows?, tileAllPagesOnA4?, gap?): recria URLs a partir das páginas em cache.
- Exposição: pages, loading, progress, mergedPdfUrl, individualPdfUrls, originalFileName.

## Comportamentos importantes
- As páginas são renderizadas com scale 6 em canvas e salvas como JPEG data URL.
- A4 fixo: 595.28 x 841.89 pt; gap constante = 10.
- Modo A (tileAllPagesOnA4 = true):
  - Coloca 1 cópia de cada página no A4, com wrap horizontal e vertical.
  - Escala dinâmica com altura máxima de 35% do A4.
- Modo B (tileAllPagesOnA4 = false):
  - Replica cada arte em grid, empilhando linhas na mesma folha até acabar o espaço.
  - Respeita maxRows (máximo de linhas por arte).
  - Cria PDFs individuais usando getReplicatedPositionsInA4Grid.
  - gap controla o espaçamento entre as artes.
  - Aplica um micro scale down (tolerância de 10 pt) quando falta pouco para caber mais colunas/linhas.

## Notas para agentes
- cleanupObjectUrls() deve ser chamado sempre que URLs forem substituídas.
- Se alterar tamanhos/gaps, atualize os helpers e os loops de layout.
