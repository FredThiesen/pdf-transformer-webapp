# Transforma PDF

## Resumo (para agentes)

- Objetivo: transformar um PDF de artes em folhas A4 prontas para impressão, replicando páginas em grade ou montando uma única A4 com 1 cópia de cada arte.
- Fluxo principal: upload do PDF → extração das páginas com `pdfjs-dist` → renderização em imagens → geração de PDFs A4 com `jsPDF` → preview e download.
- Opções do usuário: limitar número máximo de linhas por arte (`maxRows`) e modo “1 cópia de cada arte” (`tileAllPagesOnA4`).
- Saídas: PDF A4 combinado (todas as páginas) e PDFs individuais por página (desativados no modo “1 cópia”).

## Pontos de entrada e arquivos-chave

- UI principal: `src/App.tsx`
- Lógica de extração e layout: `src/hooks/usePdfPages.ts`
- Upload e progresso: `src/components/PdfUploader.tsx`
- Pré-visualização e download: `src/components/PdfActions.tsx`
- Configuração de linhas: `src/components/MaxRowsInput.tsx`

## Comandos úteis

- `npm run dev`: ambiente de desenvolvimento (Vite)
- `npm run build`: build de produção
- `npm run preview`: preview do build
- `npm run lint`: lint

## Deploy

- Publicado em `https://transformapdf.ricardothiesen.com.br`, no Coolify do homelab (`build_pack=dockerfile`, porta 80).
- O `Dockerfile` faz o build com Node e serve o `dist` com nginx (`nginx.conf`).
- O push na `main` não dispara deploy sozinho: dispare pelo painel do Coolify.
