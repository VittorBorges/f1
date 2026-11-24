# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Fãs entusiastas de Fórmula 1 que já conhecem o desporto e querem uma referência fiável e bem feita da grelha de 2026.

## Product Purpose
Consulta rápida da grelha F1 2026: ver de relance que piloto corre por que equipa, encontrar um piloto ou equipa e abrir o seu detalhe. Sucesso = a resposta aparece em segundos, sem navegação desnecessária.

## Operating Context
Site estático em português (pt), aberto em desktop e telemóvel. Cada piloto tem uma página de detalhe por hash (`#/piloto/<code>`).

## Capabilities and Constraints
- React + Vite, animações com `motion`; dados em `site/src/data/teams.json` e `drivers.json`.
- 11 equipas (nome, cor, motor, carro, sede, nota opcional) e 22 pilotos (número, código, nome, país, ano de nascimento, estreia, títulos).
- Sem backend; sem resultados, pontos ou calendário nos dados.

## Brand Commitments
Nome "Grelha F1 2026". Cores oficiais das equipas são dado, não decoração livre.

## Evidence on Hand
Apenas os dados JSON acima. Não existem fotos de pilotos/carros, estatísticas de corrida nem logótipos oficiais; não inventar.

## Product Principles
- Densidade com clareza: entusiastas aguentam informação, desde que se leia de relance.
- Dados primeiro: tudo o que se mostra vem do JSON.
- Rápido de encontrar: qualquer piloto a um clique.
