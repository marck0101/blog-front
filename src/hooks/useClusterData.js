import { useEffect, useState } from "react";
import ClustersService from "../services/clusters.service";
import { prerendered } from "../utils/prerendered";

// Tema do post aberto, injetado pelo prerender (sem busca no primeiro render)
function prerenderedCluster(slug) {
  const data = prerendered("clusterPosts");
  return slug && data?.cluster?.slug === slug ? data : null;
}

/** Dados do tema do post: { cluster, pillar, posts } ou null (post sem tema) */
export default function useClusterData(post) {
  const slug = post?.cluster || null;
  const [result, setResult] = useState(() => ({ slug, data: prerenderedCluster(slug) }));

  useEffect(() => {
    if (!slug || (result.slug === slug && result.data)) return;
    let cancelled = false;
    ClustersService.getPublicOne(slug)
      .then((data) => { if (!cancelled) setResult({ slug, data }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return result.slug === slug ? result.data : null;
}

