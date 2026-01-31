# src/App.tsx

## Propósito
Composição principal da interface e estado do app para transformação de PDFs.

## Responsabilidades principais
- Configurar o worker do pdfjs.
- Gerenciar estado de UI: maxRows, tileAllPagesOnA4 e gap.
- Disparar extração e regeneração quando as opções mudam.
- Orquestrar os componentes: uploader, opções e ações.

## Entradas/Saídas
- Entrada: arquivo PDF selecionado no PdfUploader.
- Saída: repassa páginas e URLs geradas para o PdfActions.

## Comportamentos importantes
- Ao selecionar arquivo, chama extractPages(file, maxRows, tileAllPagesOnA4).
- Quando maxRows ou tileAllPagesOnA4 muda e há páginas, chama generateAllPDFs.
- Exibe a descrição somente quando nenhum arquivo está carregado.

## Notas para agentes
- O worker está fixado em pdfjs-dist 3.11.174 via CDN; ajuste aqui se atualizar a versão.
- Este arquivo é o melhor lugar para adicionar novas opções globais.
