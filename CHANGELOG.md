# Changelog

Formato livre, mais recente primeiro.

## 27/11/2026 · Sprint R4 · Placar do conteúdo

- Pré-diagnóstico: o cartão em post/home leva `?de=/blog/<slug>`; a página mostra um campo editável de referência e a mensagem (WhatsApp e e-mail) termina com `[ref: blog-<slug>]`. O evento GA4 `pre_diagnostico_cta` (e `pre_diagnostico_card_click`) ganha `origin_path`. Só slug de página do blog: sem query string, sem dado pessoal, até 70 caracteres; origem inválida é ignorada. Registrar `origin_path` como dimensão de evento no GA4.
- Placar (admin): aviso "Search Console: aguardando acesso" (sem número) e nota sobre a origem dos pedidos; números de e-mail aparecem sozinhos. **Depende do backend (R4) para as linhas de aberturas e cliques.**
- Não guarda pedido em lugar nenhum: o pedido sai por WhatsApp/e-mail.

## 27/11/2026 · Sprint R5 · Experimentos no site

- Novo: `useExperiment(alvo)` sorteia a variante de texto do botão do pré-diagnóstico, só com consentimento de cookies; escolha guardada por experimento; revogar apaga e volta ao texto padrão.
- GA4: `experiment_impression` e `experiment_id`/`variant_id` no clique (registrar as duas dimensões de evento no GA4; ver README).
- Admin Experimentos: campos "Espaço do site", chave e 2 a 4 textos. **Depende do backend (R5) já publicado.**

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
