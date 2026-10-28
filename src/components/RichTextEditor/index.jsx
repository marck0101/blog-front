import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";
import PostsService from "../../services/posts.service";
import { uploadImage } from "../../services/uploadImage";
import AltTextInput from "../AltTextInput";

// Imagens do texto com a posição no documento (para editar o alt de cada uma)
function contentImages(editor) {
  const images = [];
  editor?.state.doc.descendants((node, pos) => {
    if (node.type.name === "image") images.push({ pos, src: node.attrs.src, alt: node.attrs.alt || "" });
  });
  return images;
}

// Estende Image para suportar atributo `width`
// width = largura exibida (style, ex.: "50%"); naturalWidth + height = tamanho real
// em pixels (atributos width/height do <img>): o navegador reserva o espaço da
// imagem antes de ela carregar e o texto não "pula" (CLS)
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}; height: auto; display: block;` };
        },
        parseHTML: (element) => element.style.width || null,
      },
      naturalWidth: {
        default: null,
        renderHTML: (attributes) => (attributes.naturalWidth ? { width: attributes.naturalWidth } : {}),
        parseHTML: (element) => element.getAttribute("width"),
      },
    };
  },
});

// Tamanho real da imagem (já está no cache do navegador: aparece na galeria)
function imageSize(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ naturalWidth: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = src;
  });
}

const WIDTH_OPTIONS = ["25%", "50%", "75%", "100%"];

function Btn({ onClick, active, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded transition select-none ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5 shrink-0" />;
}

export default function RichTextEditor({ value, onChange }) {
  const [showModal, setShowModal] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [selectedWidth, setSelectedWidth] = useState("100%");
  const [selectedAlt, setSelectedAlt] = useState("");
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // Cria o editor depois do render: criado durante o render, o Tiptap dispara
    // onUpdate → onChange → setState do pai ("Cannot update a component while rendering")
    immediatelyRender: false,
    extensions: [
      // StarterKit 3 já traz Link e Underline; registrar de novo duplica as extensões
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Comece a escrever o conteúdo do post..." }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Sincroniza value externo (ex: EditPost carregando post)
  // O Tiptap 3 descarta e recria a instância (StrictMode); a descartada não tem schema
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = useEditorState({ editor, selector: ({ editor: e }) => contentImages(e) }) || [];
  const missingAlt = images.filter((img) => !img.alt.trim()).length;

  // Só muda o atributo: o tamanho do documento não muda, as posições continuam valendo
  const setImageAlt = (pos, alt) => {
    const node = editor.state.doc.nodeAt(pos);
    if (node?.type.name !== "image") return;
    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, alt }));
  };

  const openModal = useCallback(async () => {
    setShowModal(true);
    setSelectedUrl(null);
    setSelectedWidth("100%");
    setSelectedAlt("");
    setGalleryLoading(true);
    try {
      const { posts } = await PostsService.getAll(1, 100);
      const seen = new Set();
      posts.forEach((p) => {
        if (p.coverImage) seen.add(p.coverImage);
        (p.gallery || []).forEach((g) => g.url && seen.add(g.url));
      });
      setGalleryUrls([...seen]);
    } catch {
      setGalleryUrls([]);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const handleInsert = async () => {
    if (!selectedUrl || !editor) return;
    const size = await imageSize(selectedUrl);
    editor.chain().focus().setImage({ src: selectedUrl, alt: selectedAlt.trim(), width: selectedWidth, ...size }).run();
    setShowModal(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file);
      setGalleryUrls((prev) => [url, ...prev]);
      setSelectedUrl(url);
    } catch {
      // silent — uploadImage já valida o arquivo
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleLink = () => {
    const url = window.prompt("URL do link:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="mt-6 space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Conteúdo
      </span>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 rounded-t-md border border-b-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">

        {/* Texto */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito"><Bold size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico"><Italic size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado"><UnderlineIcon size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado"><Strikethrough size={14} /></Btn>

        <Sep />

        {/* Headings */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1"><Heading1 size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2"><Heading2 size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3"><Heading3 size={14} /></Btn>

        <Sep />

        {/* Alinhamento */}
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Alinhar esquerda"><AlignLeft size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centralizar"><AlignCenter size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Alinhar direita"><AlignRight size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justificado"><AlignJustify size={14} /></Btn>

        <Sep />

        {/* Listas */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista com marcadores"><List size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada"><ListOrdered size={14} /></Btn>

        <Sep />

        {/* Mídia */}
        <Btn onClick={handleLink} active={editor.isActive("link")} title="Inserir link"><LinkIcon size={14} /></Btn>
        <Btn onClick={openModal} title="Inserir imagem da galeria"><ImageIcon size={14} /></Btn>

        <Sep />

        {/* Blocos */}
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação"><Quote size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Bloco de código"><Code size={14} /></Btn>

        <Sep />

        {/* Histórico */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer"><Undo size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer"><Redo size={14} /></Btn>
      </div>

      {/* ── Área de edição ── */}
      <EditorContent
        editor={editor}
        className="
          rounded-b-md border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-900
          focus-within:ring-2 focus-within:ring-blue-500
          [&_.tiptap]:outline-none
          [&_.tiptap]:min-h-[300px]
          [&_.tiptap]:p-4
          [&_.tiptap]:prose
          [&_.tiptap]:prose-sm
          [&_.tiptap]:max-w-none
          dark:[&_.tiptap]:prose-invert
          [&_.tiptap_p.is-editor-empty:first-child_::before]:content-[attr(data-placeholder)]
          [&_.tiptap_p.is-editor-empty:first-child_::before]:text-gray-400
          dark:[&_.tiptap_p.is-editor-empty:first-child_::before]:text-gray-500
          [&_.tiptap_p.is-editor-empty:first-child_::before]:float-left
          [&_.tiptap_p.is-editor-empty:first-child_::before]:pointer-events-none
          [&_.tiptap_p.is-editor-empty:first-child_::before]:h-0
        "
      />

      {/* ── Alt das imagens do texto ── */}
      {images.length > 0 && (
        <details className="rounded-md border border-gray-300 dark:border-gray-700 p-3" open={missingAlt > 0}>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
            Texto alternativo das imagens{" "}
            <span className={missingAlt ? "text-amber-600" : "text-green-600"}>
              ({missingAlt ? `${missingAlt} de ${images.length} sem descrição` : "todas descritas"})
            </span>
          </summary>
          <ul className="mt-3 space-y-3">
            {images.map((img, i) => (
              <li key={img.pos} className="flex gap-3 items-start">
                <img src={img.src} alt="" className="w-20 h-14 object-cover rounded border shrink-0" />
                <AltTextInput
                  id={`content-image-alt-${i}`}
                  label={`Imagem ${i + 1}`}
                  value={img.alt}
                  onChange={(alt) => setImageAlt(img.pos, alt)}
                  className="flex-1 min-w-0"
                />
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ── Modal de galeria ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800 shrink-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Inserir imagem</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none p-1"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">

              {/* Upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fazer upload de nova imagem
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 transition">
                  {uploading ? "Enviando..." : "Escolher arquivo"}
                  <input name="editorImage" type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>

              {/* Galeria */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ou selecione da galeria de posts
                </p>
                {galleryLoading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : galleryUrls.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhuma imagem encontrada. Faça upload acima.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {galleryUrls.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedUrl(url)}
                        className={`relative rounded-lg overflow-hidden border-2 transition ${
                          selectedUrl === url ? "border-blue-600" : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-20 object-cover" />
                        {selectedUrl === url && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Largura */}
              {selectedUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Largura</p>
                  <div className="flex gap-2 flex-wrap">
                    {WIDTH_OPTIONS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWidth(w)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          selectedWidth === w
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedUrl && (
                <AltTextInput id="newImageAlt" value={selectedAlt} onChange={setSelectedAlt} />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t dark:border-gray-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsert}
                disabled={!selectedUrl}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Inserir imagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
