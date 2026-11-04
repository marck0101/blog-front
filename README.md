# blog-front

Site público do blog [marck0101](https://blog.marck0101.com.br) e o painel administrativo
(`/admin`). A API está no repositório **blog-backend**.

| | |
|---|---|
| Stack | React 19 · Vite 7 · Tailwind 3 · TipTap (editor) · React Router 7 |
| Produção | Vercel · `https://blog.marck0101.com.br` |
| Pré-renderização | `api/prerender.js` (função da Vercel): HTML com o conteúdo para buscadores e redes sociais |
| Análises | GA4, Microsoft Clarity, Meta Pixel (só no domínio de produção, fora do `/admin` e de `/cancelar-inscricao`) |

## Documentação

As regras de negócio, os dashboards, a segurança e as **convenções do código** estão no
blog-backend: **`docs/SISTEMA.md`** (convenções na seção 18) e **`docs/BACKLOG.md`**
(melhorias planejadas). Elas valem para os dois repositórios.

## Rodar localmente

Pré-requisitos: Node 22+ e o blog-backend rodando (`http://localhost:3333`).

```powershell
npm install
copy .env.example .env    # VITE_API_URL=http://localhost:3333/api
npm run dev               # http://localhost:5173 (painel em /admin)
```

## Testes e qualidade

```powershell
npm test              # Vitest + jsdom + Testing Library (o mesmo que a CI)
npm run test:watch    # roda de novo a cada alteração
npm run lint          # ESLint (ainda há erros antigos: ver CI-01 no BACKLOG)
npm run build         # build de produção em dist/
```

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `VITE_API_URL` | Endereço da API, com `/api` no final |
| `VITE_FIREBASE_*` | Firebase Storage (envio de imagens pelo painel) |
| `PRERENDER_API_URL` | Só na Vercel (opcional): API usada pela pré-renderização. Padrão: produção |
| `PRERENDER_SHELL_ORIGIN` | Só na Vercel (opcional): de onde a pré-renderização busca o `index.html`. Padrão: o próprio site |

Variáveis `VITE_*` entram no código que vai para o navegador: **nunca coloque segredo nelas**.

## Onde fica cada coisa

```
src/
  pages/Blog/       páginas públicas (home, post, seasons, favoritos, cancelar inscrição)
  pages/Admin/      telas do painel (posts, calendário, envios, assinantes, métricas…)
  components/       componentes (editor, ConfirmDialog, ToastProvider, SEO…)
  hooks/            useToast (aviso de resultado), useSEO, usePageSize, useViewMode
  context/          sessão do admin (AuthContext) e aviso (toastContext)
  services/         chamadas à API, uma por recurso (posts.service.js…)
  utils/            regras de tela: status do post, HTML seguro, erro da API, análises
  seo/              textos e dados estruturados do site
  routes/           rotas (páginas secundárias e o painel carregam sob demanda)
api/prerender.js    pré-renderização na Vercel
vercel.json         cabeçalhos de segurança, CSP, redirecionamentos e reescritas
```

### Padrões do código

- **Aviso de resultado** (salvou, excluiu, erro): `useToast()`. Nunca `alert()`.
- **Confirmação**: `<ConfirmDialog>`. Nunca `window.confirm()`.
- **Erro da API**: `errorText(err) || "texto padrão da tela"` (`src/utils/apiError.js`).
- **HTML de post/envio na tela**: sempre `safeHtml(...)` (`src/utils/safeHtml.js`).
- **Dados do prerender**: `readBlock(id)` / `prerendered(key)` (`src/utils/prerendered.js`).

## Deploy

Push na `main` → a Vercel publica. A CI (GitHub Actions) roda testes, build, lint e
auditoria de dependências em todo push e PR. Quando uma mudança depende de outra no
backend, a ordem de deploy vem anotada na tarefa do `docs/BACKLOG.md`.
