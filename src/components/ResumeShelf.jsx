import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import PostCard from "./PostCard";
import { splitHistory, useReadingHistory } from "../utils/readingHistory";
import { useFeatures } from "../utils/features";

// Home: posts que o leitor começou e não terminou (neste navegador), os mais
// recentes primeiro. Some quando não há nenhum ou o recurso está desligado.
export default function ResumeShelf({ categories = [], limit = 3 }) {
  const history = useReadingHistory();
  const { readingHistory } = useFeatures();
  const reading = splitHistory(history).reading.slice(0, limit);
  if (!readingHistory || reading.length === 0) return null;

  return (
    <section aria-labelledby="retome-leitura" className="max-w-5xl mx-auto px-6 pt-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 id="retome-leitura" className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <BookOpen size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" /> Retome a leitura
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Posts que você começou e ainda não terminou.</p>
        </div>
        <Link to="/favoritos" className="shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Minhas leituras →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {reading.map((post) => (
          <PostCard key={post.slug} post={post} categoryLabel={categories.find((c) => c.slug === post.category)?.label} />
        ))}
      </div>
    </section>
  );
}
