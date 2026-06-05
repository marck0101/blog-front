import { useEffect, useState } from "react";
import SubscriberService from "../../services/subscriber.service";

export default function SubscribeForm() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [status, setStatus] = useState(null); // null | "success" | "duplicate" | "error"
  const [catError, setCatError] = useState(false);

  useEffect(() => {
    SubscriberService.getCategories()
      .then(setCategories)
      .catch(() => setCatError(true))
      .finally(() => setCatLoading(false));
  }, []);

  const allSelected =
    categories.length > 0 && selected.length === categories.length;

  const toggleAll = () =>
    allSelected
      ? setSelected([])
      : setSelected(categories.map((c) => c.slug));

  const toggleCategory = (slug) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) return;

    setLoading(true);
    setStatus(null);

    try {
      await SubscriberService.subscribe({
        email,
        name: name.trim() || undefined,
        categories: selected,
      });
      setStatus("success");
      setName("");
      setEmail("");
      setSelected([]);
    } catch (err) {
      if (err?.response?.status === 409) {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <section className="border rounded-xl p-8 bg-white dark:bg-gray-900 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          Inscrição realizada! Obrigado por assinar.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Você receberá os próximos artigos no seu email.
        </p>
      </section>
    );
  }

  return (
    <section className="border rounded-xl p-8 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Receba novidades no seu email
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Escolha os temas que te interessam e fique por dentro dos últimos artigos.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input
          type="text"
          placeholder="Seu nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />

        <input
          type="email"
          placeholder="seu@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />

        {/* Categorias */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Temas de interesse{" "}
            <span className="text-red-500" aria-hidden>*</span>
          </p>

          {catLoading && (
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          )}

          {!catLoading && !catError && (
            <div className="flex flex-wrap gap-2">
              <label
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition select-none
                  ${
                    allSelected
                      ? "bg-blue-800 text-white border-blue-800 ring-2 ring-blue-300 dark:ring-blue-500"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                Todos os temas
              </label>

              {categories.map((cat) => {
                const checked = selected.includes(cat.slug);
                return (
                  <label
                    key={cat.slug}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition select-none
                      ${
                        checked
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    {cat.label}
                  </label>
                );
              })}
            </div>
          )}

          {!catLoading && selected.length === 0 && (
            <p className="text-xs text-red-500 mt-1.5">
              Selecione pelo menos 1 tema.
            </p>
          )}
        </div>

        {/* Feedbacks */}
        {status === "duplicate" && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Você já está inscrito com este email.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Ocorreu um erro. Tente novamente mais tarde.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || selected.length === 0}
          className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Inscrevendo..." : "Assinar"}
        </button>
      </form>
    </section>
  );
}
