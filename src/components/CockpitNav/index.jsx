import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/admin/cockpit", label: "Hoje", end: true },
  { to: "/admin/cockpit/placar", label: "Placar" },
  { to: "/admin/cockpit/automacoes", label: "Automações" },
  { to: "/admin/cockpit/experimentos", label: "Experimentos" },
  { to: "/admin/cockpit/links", label: "Links" },
];

// Sub-navegação do Cockpit (Hoje | Placar | Automações | Experimentos | Links). A aba atual leva aria-current="page".
export default function CockpitNav() {
  return (
    <nav aria-label="Cockpit" className="flex gap-1 border-b dark:border-gray-800 overflow-x-auto">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              isActive
                ? "border-blue-600 text-blue-700 dark:text-blue-300 dark:border-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
