# Capa automática no front (Sprint R6)

A capa é desenhada pela API (decisões, layout e temas em `blog-backend/docs/CAPAS.md`). O front só escolhe a URL.

## Regra

`postImage(post)` (`src/seo/site.js`):

1. `post.coverImage` existe: usa ela. Nunca é sobrescrita.
2. Senão, com `slug`: `https://api.blog.marck0101.com.br/api/posts/slug/<slug>/cover.png?v=<updatedAt em ms>`.
3. Sem slug: `DEFAULT_IMAGE` (`/og-default.png`).

`?v=` não muda a imagem: só renova o cache da CDN e das redes sociais quando o post é editado.

## Onde é usada

- `api/prerender.js`: `og:image` e `twitter:image` do HTML que crawlers e redes sociais leem.
- `src/seo/site.js` (`postSchema`): imagem do JSON-LD `BlogPosting`.
- `src/pages/Blog/Post.jsx`: `<SEO image=...>` (Helmet) depois que o React assume.

## Como conferir

- Abra `/blog/<slug-de-um-post-sem-capa>`, veja o código-fonte e confira `og:image`; abra a URL e veja o PNG.
- Teste de compartilhamento: LinkedIn Post Inspector ou Facebook Sharing Debugger (precisa do backend com o endpoint em produção).
- Testes: `src/seo/site.test.js` e o bloco "og:image do post no prerender" em `api/prerender.test.js`.

## Fora do escopo desta entrega

Os cards (`GeneratedCover`) ainda usam o fallback em CSS com degradê por categoria, que contraria o padrão Relatório. Trocar por um cartão plano nos tokens do tema é um próximo passo (ver `docs/BACKLOG.md`).
