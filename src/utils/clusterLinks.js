// Links de tema dentro de um post (R-CLU-03 no backend), iguais no React e no
// api/prerender.js. Regra do plano de clusters: o pilar linka todos os posts do
// tema; um post comum linka o pilar e até 3 vizinhos do mesmo tema.
export const CLUSTER_NEIGHBORS = 3;

// data = resposta de /api/clusters/:slug ({ cluster, pillar, posts }) ou null
export function clusterLinks(post, data) {
  if (!post?.cluster || !data?.cluster || data.cluster.slug !== post.cluster) return null;
  const others = (data.posts || []).filter((p) => p.slug !== post.slug);
  const isPillar = data.pillar?.slug === post.slug;
  const pillar = isPillar ? null : data.pillar || null;
  const items = isPillar ? others : others.slice(0, CLUSTER_NEIGHBORS);
  if (!pillar && items.length === 0) return null;
  return { cluster: data.cluster, isPillar, pillar, items, url: `/temas/${data.cluster.slug}` };
}
