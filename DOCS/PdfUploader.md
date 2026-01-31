# src/components/PdfUploader.tsx

## Propósito
Controle de upload e exibição de progresso da extração.

## Responsabilidades principais
- Input de arquivo restrito a application/pdf.
- Chama onFileSelected com o primeiro arquivo selecionado.
- Exibe loader e progresso durante a extração.

## Entradas/Saídas
- Props: onFileSelected(file), loading, progress { current, total }.

## Notas para agentes
- Validação é mínima; adicione guardas de tamanho/tipo se necessário.
