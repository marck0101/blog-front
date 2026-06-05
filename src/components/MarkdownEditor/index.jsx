import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Columns2, PanelLeft, Eye } from "lucide-react";

const MODES = [
  { key: "split",   label: "Split",   Icon: Columns2   },
  { key: "editor",  label: "Editor",  Icon: PanelLeft  },
  { key: "preview", label: "Preview", Icon: Eye        },
];

export default function MarkdownEditor({ value, onChange }) {
  const [mode, setMode] = useState("split");

  const showEditor  = mode === "split" || mode === "editor";
  const showPreview = mode === "split" || mode === "preview";

  return (
    <div className="mt-6 space-y-2">
      {/* Barra de controle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Conteúdo
        </span>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
          {MODES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition
                ${mode === key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Área de edição */}
      <div className={`grid gap-4 ${mode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        {showEditor && (
          <div className="flex flex-col">
            {mode === "split" && (
              <span className="text-xs text-gray-500 mb-1">Markdown</span>
            )}
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`# Título do post\n\nIntrodução aqui.\n\n## Subtítulo\n\n- Item 1\n- Item 2\n\n![Imagem](https://link-da-imagem.com)\n`}
              className="
                w-full h-[500px] p-4 rounded-md resize-y
                font-mono text-sm
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                border border-gray-300 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="flex flex-col">
            {mode === "split" && (
              <span className="text-xs text-gray-500 mb-1">Preview</span>
            )}
            <div
              className="
                h-[500px] overflow-y-auto rounded-md p-4
                bg-white dark:bg-gray-900
                border border-gray-300 dark:border-gray-700
              "
            >
              {value ? (
                <article className="prose prose-slate dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {value}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-gray-400 dark:text-gray-300 text-sm">
                  A pré-visualização aparecerá aqui enquanto você escreve.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
