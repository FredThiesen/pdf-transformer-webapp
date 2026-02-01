# src/utils/artUtils.ts

## Propósito
Concentrar cálculos de layout das artes (fit e grid) para reutilização no hook.

## Funções

- `getFittedSize(artW, artH, pageW, pageH, gap)`
  - Calcula o scale necessário para a arte caber na página mantendo proporção.
  - Retorna `{ w, h, scale }` e registra logs de layout.

- `computeGridLayout({ tileW, tileH, pageW, pageH, gap, epsilon })`
  - Calcula `cols` e `rowsAvailable` para o grid.
  - Aplica micro scale down quando falta até `epsilon` pt para caber mais colunas/linhas.
  - Retorna `{ tileW, tileH, cols, rowsAvailable, microScale }`.

## Notas para agentes
- `epsilon` está configurado como 10 pt nas chamadas atuais.
- Os logs ajudam a diagnosticar casos em que quase cabem mais cópias por A4.
