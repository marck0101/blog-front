# Changelog

Formato livre, mais recente primeiro.

## 27/11/2026 · Sprint R6 · Capa automática

- Novo: `postImage(post)` em `src/seo/site.js`. Capa própria sempre vale; sem capa, og:image, twitter:image e JSON-LD apontam para a capa automática 1200x630 da API (`/api/posts/slug/:slug/cover.png`).
- Usado no prerender (`api/prerender.js`) e na página do post (`Post.jsx`, via `SEO`).
- Texto alternativo (`og:image:alt`) só é enviado quando existe capa própria.
- Depende do PR do backend com o endpoint. Decisões e uso: `docs/CAPAS.md`.
