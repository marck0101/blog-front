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

## Cards e página do post

`GeneratedCover` (`src/components/GeneratedCover`) é a capa de reserva dos cards, listas, temas, seasons e da página do post:

- Com `post` (slug): `<img>` da capa automática (`autoCoverUrl(post, tema)` em `src/seo/site.js`, `?tema=claro|escuro` conforme a classe `dark`), 1200x630, `loading="lazy"` (eager na página do post), sem layout shift.
- Sem slug (cartão de season) ou se a imagem falhar (`onError`): bloco liso no padrão Relatório, papel `#F4F1EA`, traço tijolo `#D9542B`, rótulo IBM Plex Mono com a categoria, título em Fraunces. Sem degradê.
- Página do post: post sem capa própria mostra a capa automática (proporção 1200/630) acima da resposta direta. Post com capa própria não muda.
