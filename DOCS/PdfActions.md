# src/components/PdfActions.tsx

## Propósito
UI de preview e download dos PDFs gerados e miniaturas por página.

## Responsabilidades principais
- Exibir botão de preview do PDF mesclado quando mergedPdfUrl existir.
- Renderizar miniaturas das páginas extraídas.
- Abrir modal com preview embutido e link de download.

## Entradas/Saídas
- Props: pages, mergedPdfUrl, individualPdfUrls, originalFileName.
- Saída: controla previewUrl e previewTitle no modal.

## Comportamentos importantes
- Botões de preview individual aparecem apenas quando pages.length > 1 e URL existe.
- Nome do download usa `formatado - ${originalFileName}` quando disponível.

## Notas para agentes
- Se adicionar novas variações de download, inclua aqui e em usePdfPages.
