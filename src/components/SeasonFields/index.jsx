import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SeasonsService from "../../services/seasons.service";

/**
 * SeasonFields — season (série) opcional do post + número do episódio.
 * Select (com busca por digitação) escala melhor que chips quando há muitas
 * seasons. Ao escolher uma season, sugere o próximo número de episódio.
 * "Sem season" grava null no backend.
 */
export default function SeasonFields({ season, seasonOrder, onChange }) {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    SeasonsService.getAdmin().then(setSeasons).catch(() => {});
  }, []);

  if (seasons.length === 0) return null;

  const pick = (slug) => {
    if (!slug) return onChange({ season: "", seasonOrder: "" });
    const total = seasons.find((s) => s.slug === slug)?.posts?.total ?? 0;
    onChange({ season: slug, seasonOrder: String(total + 1) });
  };

  return (
    <div className="space-y-2">
      <label htmlFor="season" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Season <span className="font-normal text-gray-400">(opcional)</span>
      </label>
      <select
        id="season"
        name="season"
        className="input w-full"
        value={season || ""}
        onChange={(e) => pick(e.target.value)}
      >
        <option value="">Sem season</option>
        {seasons.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.title}
          </option>
        ))}
      </select>
      {season && (
        <div>
          <label htmlFor="seasonOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nº do episódio
          </label>
          <input
            id="seasonOrder"
            name="seasonOrder"
            type="number"
            min="1"
            className="input w-24"
            value={seasonOrder ?? ""}
            onChange={(e) => onChange({ season, seasonOrder: e.target.value })}
          />
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Define a ordem de leitura na season.</p>
        </div>
      )}
      <Link to="/admin/seasons" className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline">
        Gerenciar seasons
      </Link>
    </div>
  );
}
