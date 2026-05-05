import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor ingresa email y contraseña");
      return;
    }

    try {
      setIsLoading(true);
      console.log(email, password);
      const res = await authApi.login({ email, password });

      // La API retorna { token, user: { id, email, ... } }
      if (res.token && res.user) {
        login(res.token, res.user);
        toast.success(`Bienvenido, ${res.user.email.split('@')[0]}!`);
        navigate("/", { replace: true });
      } else {
        toast.error("Respuesta inválida del servidor");
      }
    } catch (error) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-stone-950 text-stone-100 font-['Space_Grotesk',sans-serif]">

      {/* Left side: Image and Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 overflow-hidden items-center justify-center">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 hover:scale-100"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
        <div className="absolute inset-0 bg-amber-900/10 mix-blend-overlay" />

        {/* Content */}
        <div className="relative z-10 p-12 w-full max-w-lg mt-auto mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-400 rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <span className="text-stone-950 font-bold text-xl tracking-tighter">LT</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Proyectos Habitacionales</h1>
          </div>
          <p className="text-stone-300 text-lg max-w-md leading-relaxed border-l-2 border-amber-400 pl-4 py-1">
            Plataforma de gestión inmobiliaria de alto rendimiento. Acceda para administrar lotificaciones, clientes y ventas con precisión milimétrica.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-stone-950 relative">
        {/* Abstract glowing orb in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 backdrop-blur-sm bg-stone-900/50 p-10 rounded-2xl border border-stone-800 shadow-2xl">

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
            <p className="text-stone-400">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-stone-300 group-focus-within:text-amber-400 transition-colors">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded-lg px-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all duration-300"
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-stone-300 group-focus-within:text-amber-400 transition-colors">
                  Contraseña
                </label>
                <a href="#" className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded-lg px-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] mt-4"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-stone-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-stone-500">
              © {new Date().getFullYear()} Sistema Lotificadora v1.0. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
