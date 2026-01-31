# src/components/MaxRowsInput.tsx

## Propósito
Input numérico opcional para limitar o número de linhas por arte no A4.

## Responsabilidades principais
- Converte a entrada para número e envia undefined quando vazio.

## Entradas/Saídas
- Props: value (number | undefined), onChange(value).

## Notas para agentes
- min=1; campo vazio significa sem limite de linhas.
