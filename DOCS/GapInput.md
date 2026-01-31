# src/components/GapInput.tsx

## Propósito
Input numérico para controlar o espaçamento (gap) entre as artes em pontos (pt).

## Responsabilidades principais
- Converter a entrada para número e manter no mínimo 0.
- Disparar onChange com o valor atualizado.

## Entradas/Saídas
- Props: value (number), onChange(value).

## Notas para agentes
- O valor é usado em usePdfPages para espaçamento entre artes e cálculo de wrap.
