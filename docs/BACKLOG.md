# Backlog — Front (painel e blog)

Pendências conhecidas do front, com o contexto de cada uma. O backlog da API
fica em `node-express-mongodb/docs/BACKLOG.md`; o de SEO/GEO editorial, na
planilha "Plano ICE - SEO e GEO blog.marck0101.com.br" (Google Drive).

Ao resolver um item, apague-o daqui no mesmo commit da correção.

Prioridade: **alta** (afeta usuário ou dado agora) · **média** (melhora real,
sem urgência) · **baixa** (higiene, monitorar).

---

## Baixa — `/sugestoes` fora do sitemap e sem pré-render

A página da caixinha de sugestões é um formulário que só existe no navegador
(`vercel.json` manda para o `index.html`). Enquanto a vitrine "Vocês pediram,
saiu" tiver poucos itens, não vale entrar no sitemap. Quando passar de ~5
sugestões atendidas, pré-renderizar (como `/seasons`) e incluir no sitemap e
no `llms.txt`.

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

- Posts lidos e % de leitura (13/11/2026): `src/utils/readingHistory.js` guarda
  no navegador (`reading-history`, até 200 posts) o máximo lido e onde parou,
  com a régua da barra de leitura; lido = 75% (como nas seasons). Cartões com
  "✓ Lido"/"42% lido" e barra na capa, "Retome a leitura" na home,
  "Continuar de onde parou" no post e /favoritos virou **Minhas leituras**
  (resumo "você leu X de Y", Lendo agora, Favoritos, Já lidos, apagar
  histórico). Recurso `readingHistory` no painel; Política de Privacidade
  atualizada. Eventos GA4 `resume_reading` e `reading_history_clear`.

**Fase 4 — Detalhes com dados reais:** coluna lateral do post com o sumário fixo,
"Tiragem"/estatísticas (leituras e favoritos reais do `PostDailyStat`) e
comentários como "Cartas do leitor"/"Mural".

**Pronto quando (cada fase):** ligar e desligar sem recarregar; visita nova
abre no estilo salvo sem piscar o atual; texto do post com contraste AA;
Lighthouse de quem nunca liga igual ao de antes; celular de 390px sem rolagem
lateral.

## Média — O que o PageSpeed ainda aponta em `/blog` (relatório de 2026-11-09)

**O que é:** celular 94 e computador 99, mas sobram: bloqueio da renderização
(390 ms no celular, era 350; o único arquivo bloqueante é o CSS principal, ~15 KB),
JavaScript não usado (224 KiB, era 216; numa execução local: pacote do site 74,
GA4 72, Pixel 66 KiB), Speed Index de 4,3 s no celular e descoberta da imagem de
LCP sinalizada no computador. A foto do autor (`author-*.webp`, 22 KB) é servida
maior do que o tamanho exibido (~18 KiB de sobra). **Feito em 26/11/2026:** foto do
autor em 96/256 px com srcset (22 KB → 3,5 KB na home) e comentários em chunk
próprio (JS inicial do leitor de ~181 para ~176 KB gzip); falta medir no PageSpeed.

**Por que importa:** o LCP no celular está em 2,4 s, só 0,1 s dentro da meta, e
sem dados de campo (Chrome UX Report sem volume). Qualquer regressão pequena estoura.

**Caminho sugerido:** CSS crítico inline
para tirar o bloqueio; investigar o LCP no computador. Renderização completa no
servidor é a mudança grande que atacaria Speed Index e JavaScript; medir antes de
decidir. Comparar sempre pela mediana de 3 execuções.

## Média — Cockpit: editar meta e rotinas pelo painel

**O que é:** a C0 entregou a página Hoje (só leitura). A API já tem `GET/PUT /api/cockpit/meta`
e `GET/POST/PUT /api/cockpit/jobs`, mas o painel ainda não tem tela para mudar a meta mensal
nem a agenda esperada de cada rotina (hoje só por chamada direta à API).

**Caminho sugerido:** seção "Configurar" no próprio `/admin/cockpit`, no padrão de
`Features.jsx` (confirmação + aviso de resultado).
