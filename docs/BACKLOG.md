# Backlog — Front (painel e blog)

Pendências conhecidas do front, com o contexto de cada uma. O backlog da API
fica em `node-express-mongodb/docs/BACKLOG.md`; o de SEO/GEO editorial, na
planilha "Plano ICE - SEO e GEO blog.marck0101.com.br" (Google Drive).

Ao resolver um item, apague-o daqui no mesmo commit da correção.

Prioridade: **alta** (afeta usuário ou dado agora) · **média** (melhora real,
sem urgência) · **baixa** (higiene, monitorar).

---

## Média — Pré-render da página `/privacidade`

**O que é:** a Política de Privacidade não passa pelo `api/prerender.js`.
Quem não executa JavaScript (a maioria dos robôs de IA: GPTBot, ClaudeBot,
PerplexityBot) recebe uma página sem título e com ~60 caracteres de texto.

**Por que importa:** a página é citada no `/llms.txt` e é onde a IA
responderia "o blog coleta meus dados?". Hoje ela não consegue ler nada.

**Caminho sugerido:** mover o texto da política para um módulo compartilhado
(como `src/seo/site.js` faz com o FAQ), renderizar no prerender com
`robots: "noindex"` (a página continua fora das buscas, de propósito) e
adicionar no `vercel.json`:
`{ "source": "/privacidade", "destination": "/api/prerender?page=privacidade" }`
antes da regra que manda tudo para o `index.html`.

**Decisão já tomada:** a página **não** ganha FAQ/FAQPage. Ela é `noindex`, e
o Google ignora dados estruturados de página que pediu para não ser indexada.

## Baixa — `noindex` também para quem não executa JavaScript

**O que é:** `/favoritos` e `/privacidade` são `noindex`, mas só pela tag que o
React coloca depois de carregar (`<SEO robots="noindex">`). O HTML inicial não
tem nada, nem cabeçalho `X-Robots-Tag`.

**Por que importa:** robô que não roda JavaScript não vê o `noindex` e pode
indexar uma página vazia (Favoritos é uma lista pessoal, salva no navegador).

**Caminho sugerido:** no `vercel.json`, em `headers`, adicionar
`X-Robots-Tag: noindex` para `/favoritos` e `/privacidade`, como já existe
para `/admin(.*)`.

## Baixa — Padronizar os selects de "Desempenho por conteúdo"

**O que é:** em Métricas › Desempenho por conteúdo, os seletores de período,
métrica, categoria e season usam um estilo próprio (`selectClass`, borda
`rounded-lg`) diferente do resto do painel (classe `.input`, `rounded`).

**Por que importa:** é a última linha de filtros fora do padrão visual (o
restante foi padronizado em 2026-11-05).

**Caminho sugerido:** trocar `selectClass` por `.input` em
`src/components/ContentPerformance/index.jsx` e conferir a altura junto do
campo de busca, em 390px e em 1280px.

## Média — Uma fonte só para o FAQ do blog

Ver `node-express-mongodb/docs/BACKLOG.md`. Resumo: `BLOG_FAQ` e
`SEASONS_FAQ` (em `src/seo/site.js`) têm uma cópia na API para o
`/llms-full.txt`; o ideal é um lugar só.
