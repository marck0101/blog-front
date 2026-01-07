import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function MarkdownEditor({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Editor */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Conteúdo (Markdown)
        </label>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`# Título do post

Introdução aqui.

## Subtítulo

- Item 1
- Item 2

![Imagem](https://link-da-imagem.com)
`}
          className="
            w-full h-[500px] p-4 rounded-md resize-none
            font-mono text-sm
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          "
        />
      </div>

      {/* Preview */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Pré-visualização
        </label>

        <div
          className="
            h-[500px] overflow-y-auto rounded-md p-4
            bg-white dark:bg-gray-900
            border border-gray-300 dark:border-gray-700
          "
        >
          {value ? (
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {value}
              </ReactMarkdown>
            </article>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">
              A pré-visualização do conteúdo aparecerá aqui.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
