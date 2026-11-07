# Operação — Front (painel e blog)

Regras que não aparecem no código e que, se esquecidas, quebram algo em
produção. Vale para quem mexe no projeto (pessoa ou agente de IA). As regras
da API ficam em `node-express-mongodb/docs/OPERACAO.md`.

## Deploy

- Push na `main` publica sozinho (Vercel, projeto `blog-front`, domínio
  `blog.marck0101.com.br`). Faça `git fetch` antes: o projeto também recebe
  commits de outro computador.
- **Se o front passa a usar uma rota nova da API, a API sobe primeiro** e o
  push do front só depois que a rota responder em produção.
- Tela branca logo depois de um deploy = navegador com arquivos antigos;
  recarregar uma vez resolve (o `lazyPage` já tenta sozinho).
- `.env.production` (fora do git) aponta para a API de produção. Para testar
  o build contra a API local: `npx vite build --mode development`.

## SEO e conteúdo para IA

- Páginas públicas chegam prontas para robôs pelo `api/prerender.js` (home,
  posts, `/seasons`, cada season). Página pública nova precisa entrar no
  prerender e no `vercel.json`; senão robôs sem JavaScript veem uma página
  vazia.
- Schema FAQPage: só com o mesmo conteúdo que aparece **visível** na página
  (regra do Google). Hoje: home, `/seasons`, cada season e cada post, todos
  montados em `src/seo/site.js`.
- `BLOG_FAQ` e `SEASONS_FAQ` (em `src/seo/site.js`) têm **cópia na API**
  (`app/config/siteFaq.js`) para o `/llms-full.txt`. Mudou aqui, mude lá.
- `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/rss.xml` e
  `/indexnow-key.txt` são gerados pela API; o `vercel.json` só reescreve o
  endereço. Essas regras precisam ficar **antes** da regra final que manda
  tudo para o `index.html`.

## Padrões de interface do painel

- **Tabelas ordenam pelos cabeçalhos** (`components/SortableTh`), sem seletor
  "Ordenar por" repetindo a mesma função. **Listas em cards** (Posts,
  Comentários, Públicos, Lixeira) usam `components/SortSelect`. A escolha
  fica salva por tela com `hooks/useSortPreference`.
- **Carregamento usa skeleton** com o formato do conteúdo final
  (`components/Skeleton`: `Skeleton`, `Loading`, `SkeletonRows`,
  `SkeletonCards`, `SkeletonForm`). Não usar texto "Carregando...".
  `Skeleton` dentro de `<p>`/`<h2>` precisa de `as="span"`; dentro de
  `<tbody>`, use `SkeletonRows`.
- Melhoria de lista ou filtro feita numa tela vira componente comum e é
  aplicada nas outras onde fizer sentido.
- Celular (390px): a página não pode rolar para o lado. Grid com tabela
  dentro precisa de `grid-cols-1`; contêiner `overflow-x-auto` com texto
  `sr-only` dentro precisa de `relative`.

## Qualidade antes do push

- `npx eslint src` sem erros e `npx vite build --mode development` passando.
- Console do navegador limpo (erros, avisos, falhas de rede) nas telas
  mexidas, em desktop e em 390px.
- Ambiente local: o `.env` fixa a API em `localhost:3333` (o `npm run dev` da
  API, que exige 2º fator). Para testes automatizados com login, ver
  "Ambiente local" em `node-express-mongodb/docs/OPERACAO.md`.
