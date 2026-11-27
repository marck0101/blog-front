# Changelog

Formato livre, mais recente primeiro.

## 27/11/2026 · Sprints C5 e C3 · Automações e Placar

- Novo: `/admin/cockpit/automacoes` (estado, última execução, 10 últimas execuções e duração de cada rotina; texto e símbolo, sem semáforo).
- Novo: `/admin/cockpit/placar` (10 números da semana, meta semanal editável, 13 semanas, "abaixo/na meta/acima" em texto).
- Sub-navegação do Cockpit: Hoje | Placar | Automações | Experimentos | Links. **Backend antes do front.**

## 27/11/2026 · Sprint R6 · Capa automática nos cards

- `GeneratedCover` troca o degradê por categoria pela capa automática da API (`<img>` 1200x630, tema claro/escuro). Se falhar, bloco liso no padrão Relatório (papel, traço tijolo, Plex Mono, Fraunces).
- Página do post mostra a capa automática quando não há capa própria.
- Novo `autoCoverUrl(post, tema)` em `src/seo/site.js`; `postImage` usa ele. Detalhes: `docs/CAPAS.md`.

## 27/11/2026 · Sprint R6 · Capa automática

- Novo: `postImage(post)` em `src/seo/site.js`. Capa própria sempre vale; sem capa, og:image, twitter:image e JSON-LD apontam para a capa automática 1200x630 da API (`/api/posts/slug/:slug/cover.png`).
- Usado no prerender (`api/prerender.js`) e na página do post (`Post.jsx`, via `SEO`).
- Texto alternativo (`og:image:alt`) só é enviado quando existe capa própria.
- Depende do PR do backend com o endpoint. Decisões e uso: `docs/CAPAS.md`.
