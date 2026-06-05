import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

/**
 * DateRangePicker — dropdown com calendário de 2 meses e atalhos.
 *
 * Props:
 *   from  — string "YYYY-MM-DD" ou ""
 *   to    — string "YYYY-MM-DD" ou ""
 *   onChange(from, to) — chamado com strings "YYYY-MM-DD" ao completar seleção,
 *                        ou ("", "") ao limpar
 */
export default function DateRangePicker({ from = "", to = "", onChange }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(from ? parseISO(from) : null);
  const [endDate, setEndDate] = useState(to ? parseISO(to) : null);
  const ref = useRef(null);

  // Sincroniza quando o pai limpa os filtros externamente
  useEffect(() => {
    setStartDate(from ? parseISO(from) : null);
    setEndDate(to ? parseISO(to) : null);
  }, [from, to]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleChange = ([start, end]) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const applyShortcut = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onChange("", "");
    setOpen(false);
  };

  const today = new Date();

  const label =
    startDate && endDate
      ? `${format(startDate, "dd/MM/yyyy")} → ${format(endDate, "dd/MM/yyyy")}`
      : startDate
      ? `${format(startDate, "dd/MM/yyyy")} → ...`
      : "Selecionar período";

  const hasValue = !!(startDate || endDate);

  const SHORTCUTS = [
    {
      label: "Esta semana",
      fn: () =>
        applyShortcut(
          startOfWeek(today, { weekStartsOn: 1 }),
          endOfWeek(today, { weekStartsOn: 1 })
        ),
    },
    {
      label: "Últimos 7 dias",
      fn: () => applyShortcut(subDays(today, 6), today),
    },
    {
      label: "Este mês",
      fn: () => applyShortcut(startOfMonth(today), endOfMonth(today)),
    },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`input py-1.5 text-sm flex items-center gap-2 whitespace-nowrap min-w-[180px]
          ${hasValue ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-400"}`}
      >
        <CalendarIcon />
        {label}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 drp-dropdown">
          {/* Atalhos */}
          <div className="flex flex-wrap gap-1.5">
            {SHORTCUTS.map(({ label: l, fn }) => (
              <button
                key={l}
                type="button"
                onClick={fn}
                className="px-2.5 py-1 rounded-full border text-xs font-medium
                  text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600
                  hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 rounded-full border text-xs font-medium
                text-gray-400 dark:text-gray-400 border-gray-200 dark:border-gray-700
                hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 transition"
            >
              Limpar
            </button>
          </div>

          {/* Calendário */}
          <DatePicker
            selected={startDate}
            onChange={handleChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
            monthsShown={2}
            locale={ptBR}
            calendarClassName="drp-cal"
          />
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
