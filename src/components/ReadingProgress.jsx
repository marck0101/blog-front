import { useEffect, useRef } from "react";
import { readingProgress } from "../utils/headings";

// Barra fina no topo da tela que acompanha a leitura do texto do post.
// Decorativa (aria-hidden): a posição já está na rolagem. Atualiza pelo style,
// sem novo render a cada rolagem.
export default function ReadingProgress({ targetRef, watch }) {
  const barRef = useRef(null);

  useEffect(() => {
    const el = targetRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const p = readingProgress(el.getBoundingClientRect(), window.innerHeight);
      bar.style.transform = `scaleX(${p})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetRef, watch]);

  return (
    <div aria-hidden="true" className="skin-progress fixed top-0 inset-x-0 z-[60] h-1 pointer-events-none">
      <div
        ref={barRef}
        className="skin-progress-bar h-full origin-left bg-blue-600 dark:bg-blue-400"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
