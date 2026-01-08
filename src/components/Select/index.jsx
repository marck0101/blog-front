export default function Select({
  label,
  options = [],
  value,
  onChange,
  className = "",
  ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          {...props}
          className={`
            w-full
            appearance-none
            px-3 py-2 pr-10
            rounded-lg
            text-sm
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-700
            focus:outline-none
            focus:ring-2 focus:ring-blue-500
            focus:border-blue-500
            transition
            ${className}
          `}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* Ícone custom (evita caret feio no mobile) */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          ▾
        </span>
      </div>
    </div>
  );
}
