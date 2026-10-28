import { useState } from "react";
import { coverSrcSet } from "../../utils/coverSrcSet";

// Capa com srcset: o navegador baixa a versão do tamanho exibido.
// priority: imagem visível ao abrir a página (candidata a LCP) — carrega já, com
// prioridade alta; as demais esperam chegar perto da tela.
// Se uma variante não existir (upload antigo sem backfill), cai na principal.
export default function CoverImage({ src, alt = "", sizes, width, height, priority = false, className }) {
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? coverSrcSet(src) : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      onError={srcSet ? () => setUseSrcSet(false) : undefined}
      className={className}
    />
  );
}
