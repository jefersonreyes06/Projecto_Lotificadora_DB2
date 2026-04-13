import { Outlet, NavLink, useLocation } from "react-router";
import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";

const navGroups = [
  {
    label: "Principal",
    items: [
      { to: "/", label: "Panel General", icon: "⬡", exact: true },
    ],
  },
  {
    label: "Lotificación",
    items: [
      { to: "/proyectos", label: "Proyectos", icon: "◈" },
      { to: "/etapas", label: "Etapas", icon: "◫" },
      { to: "/bloques", label: "Bloques", icon: "▦" },
      { to: "/lotes", label: "Lotes", icon: "▣" },
      { to: "/lotes/disponibles", label: "Lotes Disponibles", icon: "◉" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/clientes", label: "Clientes", icon: "◌" },
      { to: "/ventas", label: "Ventas", icon: "◆" },
      { to: "/pagos", label: "Pagos & Caja", icon: "◎" },
      { to: "/cuentas", label: "Cuentas Bancarias", icon: "◍" },
    ],
  },
  {
    label: "Consultas",
    items: [
      { to: "/vistas", label: "Vistas SQL", icon: "◐" },
      { to: "/procedimientos", label: "Procedimientos", icon: "◑" },
      { to: "/funciones", label: "Funciones", icon: "◒" },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("dark");
  const location = useLocation();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("lotificadora-theme");
    const initialTheme = storedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("lotificadora-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100 font-['Space_Grotesk',sans-serif] overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-stone-800 bg-stone-950 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
        style={{ flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-800">
          <div className="w-8 h-8 bg-amber-400 rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-stone-950 font-bold text-sm">PH</span>
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-sm leading-tight text-stone-100">
                Proyectos
              </p>
              <p className="text-xs text-stone-500">Habitacionales</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d={collapsed ? "M5 2l6 6-6 6" : "M11 2L5 8l6 6"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest text-stone-600 uppercase px-2 mb-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to) &&
                      !(item.to === "/" && location.pathname !== "/");

                  const activeClasses = theme === "light"
                    ? "bg-amber-200/60 text-amber-700 font-medium"
                    : "bg-amber-400/10 text-amber-400 font-medium";

                  const normalClasses = theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800";

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.exact}
                        className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all ${
                          isActive ? activeClasses : normalClasses
                        }`}
                      >
                        <span className="text-base w-5 text-center flex-shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-5 py-4 border-t border-stone-800">
            <p className="text-[10px] text-stone-600">
              Sistema v1.0 · UNAH BD2
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 shadow-lg ${
          theme === "dark"
            ? "bg-stone-900 text-stone-100 border-stone-700 hover:bg-stone-800"
            : "bg-white/95 text-slate-900 border-slate-300 hover:bg-white"
        }`}
      >
        <span>{theme === "dark" ? "" : ""}</span>
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
