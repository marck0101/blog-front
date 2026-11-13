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

## Média — Estilos de época: Jornal e Terminal (fase 4)

**O que é:** o leitor escolhe o estilo do blog no ícone ao lado do tema:
**Visual atual**, **Jornal / máquina de escrever** (sempre papel claro) ou
**Terminal BBS** (sempre escuro). Fiéis à época: com um deles ligado o botão de
tema some e o tema escuro não vale; o tema salvo volta no visual atual
(decisão de 13/11/2026, substitui o Jornal noturno). Post de Tecnologia
convida para o Terminal uma vez só; aceitando, o blog todo fica no Terminal até
ele trocar. Desenhos no canvas "Modo raiz do blog" (claude.ai, privado).

**Feito (fases 1 a 3):**
- `src/utils/skin.js`: estilo salvo no navegador (`skin` = jornal|terminal;
  o "raiz" da fase 1 vira jornal), classes `raiz` + `jornal`/`terminal` no
  `<html>`, aplicadas antes de pintar pelo `public/theme-init.js`; o painel
  não tem estilo de época.
- `SkinToggle` (seletor com os 3 estilos) e `TerminalOffer` (faixa fixa no
  rodapé de post de tecnologia; espera o banner de cookies; resposta em
  `skin-offer`). Eventos GA4 `skin_toggle` e `terminal_offer`.
- Ganchos `skin-*` no React e no `api/prerender.js`; `public/skins/raiz.css`
  (~16 KB) com as paletas, o Jornal e o Terminal.
- Fontes no próprio site em `public/skins/fonts` (só o subconjunto latin,
  licenças em `LICENSES.txt`, cache de 1 ano no `vercel.json`); o navegador
  só baixa as do estilo em uso: Jornal ~190 KB, Terminal ~50 KB, visual atual
  nada.
- Imagens (capas, fotos e as do texto) com as cores originais em todos os
  estilos, sem filtro (decisão de 13/11/2026).

- Sumário e barra de leitura (13/11/2026, valem para todos os estilos):
  `src/utils/headings.js` põe id nos h2/h3 a partir do texto, igual no React e
  no prerender (link `/blog/post#secao` funciona); `PostToc` ("Neste post",
  só h2, a partir de 3 seções, evento `toc_click`) e `ReadingProgress` (barra
  fina no topo, cor da paleta de cada estilo).

- Liga/desliga no painel (13/11/2026): **Painel → Recursos** (`/admin/recursos`)
  tem um cartão com miniatura e interruptor para cada recurso: estilos de
  época, convite do Terminal, sumário e barra de leitura. Cada mudança pede
  "Tem certeza?" com o antes → depois (sem código do app: decisão de 13/11/2026). Backend `GET/PATCH /api/settings/features`
  (cache de 30 s); o front guarda a última resposta em `site-features`, que o
  `theme-init.js` lê antes de pintar. API fora do ar = tudo ligado.

**Fase 4 — Detalhes com dados reais:** coluna lateral do post com o sumário fixo,
"Tiragem"/estatísticas (leituras e favoritos reais do `PostDailyStat`) e
comentários como "Cartas do leitor"/"Mural".

**Pronto quando (cada fase):** ligar e desligar sem recarregar; visita nova
abre no estilo salvo sem piscar o atual; texto do post com contraste AA;
Lighthouse de quem nunca liga igual ao de antes; celular de 390px sem rolagem
lateral.
