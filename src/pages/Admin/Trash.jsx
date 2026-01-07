import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import PostsService from "../../services/posts.service";
import Header from "../../components/Header";
import PostSkeleton from "../../components/PostSkeleton";

export default function Trash() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState(null);

  useEffect(() => {
    PostsService.listDeleted()
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!previewPost) return;
    const onKeyDown = (e) => e.key === "Escape" && setPreviewPost(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewPost]);

  const restore = async (post, close = false) => {
    if (!confirm(`Restaurar "${post.title}"?`)) return;
    await PostsService.restore(post._id);
    setPosts((p) => p.filter((x) => x._id !== post._id));
    if (close) setPreviewPost(null);
  };

  const remove = async (post, close = false) => {
    if (!confirm(`Excluir definitivamente "${post.title}"?`)) return;
    await PostsService.deletePermanent(post._id);
    setPosts((p) => p.filter((x) => x._id !== post._id));
    if (close) setPreviewPost(null);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Posts
          </h1>

          {Array.from({ length: 5 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">Lixeira</h1>

        {posts.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">Lixeira vazia.</p>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex gap-4 items-center p-4 rounded-lg border
                bg-gray-50 dark:bg-gray-900
                border-gray-200 dark:border-gray-800"
            >
              <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
              </div>

              <div className="flex-1">
                <h2 className="font-semibold flex gap-2 items-center">
                  {post.title}
                  <span
                    className="text-xs bg-red-100 dark:bg-red-900/40
                    text-red-700 dark:text-red-300 px-2 rounded"
                  >
                    EXCLUÍDO
                  </span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.category} •{" "}
                  {new Date(post.deletedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-4 text-lg">
                <button onClick={() => setPreviewPost(post)}>👁</button>
                <button onClick={() => restore(post)}>↩️</button>
                <button onClick={() => remove(post)}>❗</button>
              </div>
            </div>
          ))}
        </div>

        {previewPost && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 max-w-4xl w-full rounded-lg flex flex-col max-h-[90vh]">
              <div className="p-4 border-b dark:border-gray-800 flex justify-between">
                <h2 className="font-bold">{previewPost.title}</h2>
                <button onClick={() => setPreviewPost(null)}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <article className="prose prose-lg dark:prose-invert">
                  <ReactMarkdown>{previewPost.content}</ReactMarkdown>
                </article>
              </div>

              <div className="border-t dark:border-gray-800 p-4 flex justify-between">
                <button onClick={() => setPreviewPost(null)}>Fechar</button>
                <div className="flex gap-2">
                  <button onClick={() => restore(previewPost, true)}>
                    Restaurar
                  </button>
                  <button onClick={() => remove(previewPost, true)}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// import { useEffect, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import PostsService from "../../services/posts.service";
// import Header from "../../components/Header";

// export default function Trash() {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [previewPost, setPreviewPost] = useState(null);

//   useEffect(() => {
//     PostsService.listDeleted()
//       .then((res) => setPosts(res.data))
//       .finally(() => setLoading(false));
//   }, []);

//   /* 🔑 FECHAR COM ESC */
//   useEffect(() => {
//     if (!previewPost) return;

//     const onKeyDown = (e) => {
//       if (e.key === "Escape") {
//         setPreviewPost(null);
//       }
//     };

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [previewPost]);

//   const restore = async (post, fromPreview = false) => {
//     const ok = window.confirm(
//       `Deseja restaurar o post:\n\n"${post.title}"?`
//     );
//     if (!ok) return;

//     await PostsService.restore(post._id);
//     setPosts((prev) => prev.filter((p) => p._id !== post._id));
//     if (fromPreview) setPreviewPost(null);
//   };

//   const deletePermanent = async (post, fromPreview = false) => {
//     const ok = window.confirm(
//       `⚠️ ATENÇÃO\n\nEssa ação é irreversível.\nDeseja excluir definitivamente:\n\n"${post.title}"?`
//     );
//     if (!ok) return;

//     await PostsService.deletePermanent(post._id);
//     setPosts((prev) => prev.filter((p) => p._id !== post._id));
//     if (fromPreview) setPreviewPost(null);
//   };

//   if (loading) return <p className="p-6">Carregando...</p>;

//   return (
//     <>
//       <Header />

//       <main className="max-w-6xl mx-auto px-6 py-10">
//         <h1 className="text-2xl font-bold mb-6">Lixeira</h1>

//         {posts.length === 0 && (
//           <p className="text-gray-500">Lixeira vazia.</p>
//         )}

//         <div className="space-y-4">
//           {posts.map((post) => (
//             <div
//               key={post._id}
//               className="flex gap-4 items-center border rounded-lg p-4 bg-gray-50"
//             >
//               {/* Imagem */}
//               <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden">
//                 {post.coverImage && (
//                   <img
//                     src={post.coverImage}
//                     alt={post.title}
//                     className="w-full h-full object-cover opacity-70"
//                   />
//                 )}
//               </div>

//               {/* Conteúdo */}
//               <div className="flex-1">
//                 <h2 className="font-semibold flex items-center gap-2">
//                   {post.title}
//                   <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
//                     EXCLUÍDO
//                   </span>
//                 </h2>
//                 <p className="text-sm text-gray-500 capitalize">
//                   {post.category} • Excluído em{" "}
//                   {new Date(post.deletedAt).toLocaleDateString()}
//                 </p>
//               </div>

//               {/* Ações rápidas */}
//               <div className="flex gap-4 text-lg">
//                 <button
//                   title="Visualizar como usuário"
//                   onClick={() => setPreviewPost(post)}
//                   className="text-gray-600 hover:text-gray-800"
//                 >
//                   👁
//                 </button>

//                 <button
//                   title="Restaurar post"
//                   onClick={() => restore(post)}
//                   className="text-blue-600 hover:text-blue-800"
//                 >
//                   ↩️
//                 </button>

//                 <button
//                   title="Excluir definitivamente"
//                   onClick={() => deletePermanent(post)}
//                   className="text-red-600 hover:text-red-800"
//                 >
//                   ❗
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </main>

//       {/* MODAL – PREVIEW */}
//       {previewPost && (
//         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
//           <div className="bg-white max-w-4xl w-full rounded-lg max-h-[90vh] flex flex-col">
//             {/* HEADER */}
//             <div className="flex justify-between items-center px-6 py-4 border-b">
//               <div>
//                 <h2 className="text-xl font-bold">{previewPost.title}</h2>
//                 <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
//                   EXCLUÍDO
//                 </span>
//               </div>

//               <button
//                 onClick={() => setPreviewPost(null)}
//                 title="Fechar (Esc)"
//                 className="text-gray-500 hover:text-gray-800 text-xl"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* CONTEÚDO */}
//             <div className="flex-1 overflow-y-auto px-6 py-6">
//               {previewPost.coverImage && (
//                 <img
//                   src={previewPost.coverImage}
//                   alt={previewPost.title}
//                   className="w-full rounded-xl mb-6"
//                 />
//               )}

//               <p className="text-gray-500 mb-6 capitalize">
//                 {previewPost.category} • Criado em{" "}
//                 {new Date(previewPost.createdAt).toLocaleDateString()}
//               </p>

//               {previewPost.excerpt && (
//                 <p className="text-lg text-gray-700 mb-8">
//                   {previewPost.excerpt}
//                 </p>
//               )}

//               <article className="prose prose-lg max-w-none">
//                 <ReactMarkdown>{previewPost.content}</ReactMarkdown>
//               </article>
//             </div>

//             {/* FOOTER FIXO */}
//             <div className="border-t px-6 py-4 flex justify-between items-center bg-white sticky bottom-0">
//               <button
//                 onClick={() => setPreviewPost(null)}
//                 className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
//               >
//                 Fechar
//               </button>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => restore(previewPost, true)}
//                   className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//                 >
//                   Restaurar post
//                 </button>

//                 <button
//                   onClick={() => deletePermanent(previewPost, true)}
//                   className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
//                 >
//                   Excluir definitivamente
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
