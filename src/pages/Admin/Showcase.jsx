import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowDown, ArrowUp, ExternalLink, Flame, Info, Pin, PinOff, Search } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostsService from "../../services/posts.service";
import { normalizeImageUrl } from "../../utils/imageUrl";

const HIGHLIGHT_OPTIONS = [
  { value: "auto", label: "Auto", title: "Entra se estiver entre os mais lidos da semana" },
  { value: "force", label: "Sempre", title: "Aparece nos destaques mesmo sem leituras" },
  { value: "hide", label: "Nunca", title: "Nunca aparece nos destaques" },
];

const num = (n) => (n || 0).toLocaleString("pt-BR");

function Thumb({ post }) {
  const src = normalizeImageUrl(post.coverImage);
  return (
    <div className="w-16 shrink-0 aspect-video rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
      {src && <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />}
    </div>
  );
}

function Card({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            {Icon && <Icon size={18} />} {title}
          </h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Busca de posts publicados para fixar
function PinPicker({ pinnedIds, onPick, disabled }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);

  // Busca só a partir de 2 letras; abaixo disso a lista fica vazia
  const searching = term.trim().length >= 2;
  const visible = searching ? results : [];

  useEffect(() => {
    if (!searching) return;
    let active = true;
    const t = setTimeout(() => {
      PostsService.getAll(1, 8, { status: "published", search: term.trim() })
        .then((d) => active && setResults(d.posts || []))
        .catch(() => active && setResults([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term, searching]);

  return (
    <div className="relative">
      <label htmlFor="pinSearch" className="sr-only">Buscar post para fixar</label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="pinSearch"
          name="pinSearch"
          className="input !pl-9"
          placeholder={disabled ? "Limite de fixados atingido" : "Buscar post publicado para fixar..."}
          value={term}
          disabled={disabled}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
        />
      </div>
      {visible.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border bg-white dark:bg-gray-900 shadow-lg py-1 max-h-72 overflow-y-auto">
          {visible.map((post) => {
            const already = pinnedIds.includes(post._id);
            return (
              <li key={post._id}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => {
                    onPick(post);
                    setTerm("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <Thumb post={post} />
                  <span className="flex-1 min-w-0 truncate">{post.title}</span>
                  {already && <span className="text-xs text-gray-500">já fixado</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function HighlightToggle({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Destaque da semana" className="inline-flex rounded-lg border overflow-hidden text-xs">
      {HIGHLIGHT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          title={opt.title}
          disabled={disabled}
          onClick={() => value !== opt.value && onChange(opt.value)}
          className={`px-2.5 py-1 font-medium transition border-l first:border-l-0 ${
            value === opt.value
              ? opt.value === "hide"
                ? "bg-gray-700 text-white dark:bg-gray-600"
                : "bg-blue-600 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Vitrine da home: posts fixados (até 3, em ordem) e destaques da semana
 * (mais lidos dos últimos 7 dias, com regra manual por post).
 */
export default function Showcase() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    return PostsService.getShowcase()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(() => setError("Erro ao carregar a vitrine."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePinned = async (ids, message) => {
    setSaving(true);
    try {
      await PostsService.setPinned(ids);
      await load();
      showToast(message);
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao salvar os fixados", "error");
    } finally {
      setSaving(false);
    }
  };

  const pinnedIds = data?.pinned.map((p) => p._id) || [];

  const move = (index, delta) => {
    const ids = [...pinnedIds];
    const [item] = ids.splice(index, 1);
    ids.splice(index + delta, 0, item);
    savePinned(ids, "Ordem atualizada");
  };

  const changeHighlight = async (post, highlight) => {
    setSaving(true);
    try {
      await PostsService.setHighlight(post._id, highlight);
      await load();
      showToast("Destaque atualizado");
    } catch {
      showToast("Erro ao atualizar o destaque", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Vitrine</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              O que aparece no topo da home do blog: fixados e destaques da semana.
            </p>
          </div>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ExternalLink size={16} /> Ver no blog
          </a>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && <p className="text-gray-400">Carregando...</p>}

        {data && (
          <>
            {/* FIXADOS */}
            <Card
              icon={Pin}
              title={`Fixados (${data.pinned.length}/${data.maxPinned})`}
              subtitle='Seção "Comece por aqui", na 1ª página da home sem filtro. Fixados não se repetem na lista de posts nem nos destaques.'
            >
              {data.pinned.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-300">Nenhum post fixado. Busque abaixo para fixar.</p>
              ) : (
                <ol className="divide-y divide-gray-100 dark:divide-gray-800 border rounded-lg">
                  {data.pinned.map((post, i) => (
                    <li key={post._id} className="flex items-center gap-3 px-3 py-2">
                      <span className="w-5 text-sm font-semibold text-gray-400 tabular-nums">{i + 1}</span>
                      <Thumb post={post} />
                      <div className="flex-1 min-w-0">
                        <Link to={`/admin/posts/${post._id}`} className="block truncate text-sm font-medium hover:underline">
                          {post.title}
                        </Link>
                        {!post.published && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Não publicado: não aparece no blog até publicar.</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Subir"
                          title="Subir"
                          disabled={saving || i === 0}
                          onClick={() => move(i, -1)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Descer"
                          title="Descer"
                          disabled={saving || i === data.pinned.length - 1}
                          onClick={() => move(i, 1)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Desafixar"
                          title="Desafixar"
                          disabled={saving}
                          onClick={() => savePinned(pinnedIds.filter((id) => id !== post._id), "Post desafixado")}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                        >
                          <PinOff size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <PinPicker
                pinnedIds={pinnedIds}
                disabled={saving || data.pinned.length >= data.maxPinned}
                onPick={(post) => savePinned([...pinnedIds, post._id], "Post fixado")}
              />
            </Card>

            {/* DESTAQUES */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card
                icon={Flame}
                title="Destaques da semana"
                subtitle="Como está agora na home (até 4)."
              >
                {data.highlights.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Nenhum destaque ainda: a seção fica escondida no blog até haver leituras na semana ou um post marcado como "Sempre".
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {data.highlights.map((post, i) => (
                      <li key={post._id} className="flex items-center gap-3">
                        <span className="w-5 text-lg font-bold text-gray-300 dark:text-gray-600 tabular-nums">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{post.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {post.reason === "force" ? "Marcado como Sempre" : `${num(post.views7d)} leitura(s) em 7 dias`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              <section className="lg:col-span-2 rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Mais lidos da semana</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                    Últimos {data.highlightDays} dias, mais os posts com regra manual. Auto = entra pelo ranking · Sempre = entra
                    primeiro · Nunca = fica de fora.
                  </p>
                </div>

                {data.ranking.length === 0 ? (
                  <p className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    Sem leituras registradas na semana. A contagem diária começou com esta versão; o ranking se forma conforme os
                    posts são lidos.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                          <th className="px-5 py-2 font-semibold">Post</th>
                          <th className="px-3 py-2 font-semibold text-right" title="Leituras nos últimos 7 dias">7 dias</th>
                          <th className="px-3 py-2 font-semibold text-right" title="Favoritos (total)">Fav.</th>
                          <th className="px-3 py-2 font-semibold text-right" title="Compartilhamentos (total)">Comp.</th>
                          <th className="px-5 py-2 font-semibold">Destaque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ranking.map((post) => (
                          <tr key={post._id} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-5 py-2">
                              <Link to={`/admin/posts/${post._id}`} className="hover:underline">
                                {post.title}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-300">
                                {post.inHighlights && <span className="text-orange-600 dark:text-orange-400 font-medium">Nos destaques · </span>}
                                {post.pinnedOrder ? "Fixado (fora dos destaques) · " : ""}
                                {!post.published ? "Não publicado · " : ""}
                                {num(post.views)} leitura(s) no total
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{num(post.views7d)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{num(post.favorites)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{num(post.shares)}</td>
                            <td className="px-5 py-2">
                              <HighlightToggle
                                value={post.highlight}
                                disabled={saving}
                                onChange={(value) => changeHighlight(post, value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-300">
              A home guarda a vitrine em cache por até 5 minutos: uma mudança aqui pode levar esse tempo para aparecer no blog.
              Favoritos, compartilhamentos e comentários por período ficam em{" "}
              <Link to="/admin/metrics" className="underline">Métricas</Link>.
            </p>
          </>
        )}
      </main>
    </>
  );
}
