import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

const MENU_WIDTH = 192;

/**
 * Menu "⋯" de uma linha: guarda ações menos usadas ou destrutivas, longe dos
 * botões do dia a dia. items: [{ label, onClick, danger?, disabled? }]
 * O menu é fixed (ancorado no botão) para não ser cortado por tabelas com
 * overflow; rolar a página fecha.
 */
export default function RowMenu({ items, label = "Mais ações" }) {
  const [pos, setPos] = useState(null); // { top, left } quando aberto
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const open = pos !== null;

  const toggle = () => {
    if (open) return setPos(null);
    const r = buttonRef.current.getBoundingClientRect();
    const estimatedHeight = items.length * 36 + 8;
    const below = r.bottom + 4 + estimatedHeight <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : r.top - 4 - estimatedHeight,
      left: Math.max(8, r.right - MENU_WIDTH),
    });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-50 rounded-lg border bg-white dark:bg-gray-900 shadow-lg py-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setPos(null);
                item.onClick();
              }}
              className={`block w-full text-left px-3 py-2 text-sm disabled:opacity-40 ${
                item.danger
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
