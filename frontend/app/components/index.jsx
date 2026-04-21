// ──────────────────────────────────────────────
// PageHeader
// ──────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-stone-800">
      <div>
        <h1 className="text-2xl font-semibold text-stone-100 tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3 mt-1">{actions}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────
// Button
// ──────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  const base =
    "inline-flex items-center gap-2 font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-amber-400 text-stone-950 hover:bg-amber-300 active:bg-amber-500",
    secondary:
      "bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    ghost: "text-stone-400 hover:text-stone-200 hover:bg-stone-800",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────
// Badge
// ──────────────────────────────────────────────
export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-stone-800 text-stone-300",
    success: "bg-emerald-400/10 text-emerald-400",
    warning: "bg-amber-400/10 text-amber-400",
    danger: "bg-red-400/10 text-red-400",
    info: "bg-blue-400/10 text-blue-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────
export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-stone-900 border border-stone-800 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = false }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p
        className={`text-2xl font-semibold ${
          accent ? "text-amber-400" : "text-stone-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-stone-600 mt-1">{sub}</p>}
    </Card>
  );
}

// ──────────────────────────────────────────────
// DataTable
// ──────────────────────────────────────────────
export function DataTable({ columns, data, onRowClick, loading = false }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-stone-600 text-sm">
        <span className="animate-pulse">Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-stone-600">
        <span className="text-3xl mb-2">◻</span>
        <p className="text-sm">Sin registros</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-stone-800/50 transition-colors ${
                onRowClick
                  ? "cursor-pointer hover:bg-stone-800/50"
                  : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-stone-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────
// FormField
// ──────────────────────────────────────────────
export function FormField({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────
// Input
// ──────────────────────────────────────────────
export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 transition-all ${className}`}
      {...props}
    />
  );
}

// ──────────────────────────────────────────────
// Select
// ──────────────────────────────────────────────
export function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ──────────────────────────────────────────────
// Alert
// ──────────────────────────────────────────────
export function Alert({ children, variant = "info" }) {
  const variants = {
    info: "bg-blue-400/10 border-blue-400/20 text-blue-300",
    success: "bg-emerald-400/10 border-emerald-400/20 text-emerald-300",
    warning: "bg-amber-400/10 border-amber-400/20 text-amber-300",
    danger: "bg-red-400/10 border-red-400/20 text-red-300",
  };
  return (
    <div
      className={`border rounded-md px-4 py-3 text-sm ${variants[variant]}`}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// Modal
// ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full ${width} flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-base font-semibold text-stone-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Section container
// ──────────────────────────────────────────────
export function PageContent({ children }) {
  return <div className="px-8 py-6">{children}</div>;
}