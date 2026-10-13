import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FilterChips from "../FilterChips";
import PostsService from "../../services/posts.service";

/**
 * SeasonFields — season (série) opcional do post + número do episódio.
 * "Sem season" grava null no backend.
 */
export default function SeasonFields({ season, seasonOrder, onChange }) {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    PostsService.getSeasons().then(setSeasons).catch(() => {});
  }, []);

  if (seasons.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">
        Season <span className="text-gray-400">(opcional: só para posts que fazem parte de uma série)</span>
        {" · "}
        <Link to="/admin/seasons" className="text-blue-600 dark:text-blue-400 hover:underline">Gerenciar seasons</Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          options={seasons}
          selected={season || ""}
          onChange={(val) => onChange({ season: val === "all" ? "" : val, seasonOrder })}
          allLabel="Sem season"
          multiSelect={false}
        />
        {season && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            Episódio
            <input name="seasonOrder"
              type="number"
              min="0"
              className="input !w-20"
              value={seasonOrder ?? ""}
              onChange={(e) => onChange({ season, seasonOrder: e.target.value })}
            />
          </label>
        )}
      </div>
    </div>
  );
}
