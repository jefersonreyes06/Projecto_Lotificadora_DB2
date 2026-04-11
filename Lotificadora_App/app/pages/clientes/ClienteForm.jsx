import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";

import { clientesApi } from "../../services/api.js";

import {
  PageHeader,
  PageContent,
  Button,
  FormField,
  Input,
  Select,
  Card,
  Alert,
  Badge,
} from "../../components/index";


const EMPTY = {
  nombre: "",
  apellido: "",
  dni: "",
  rtn: "", // Campo agregado
  fecha_nacimiento: "",
  genero: "",
  estado_civil: "",
  correo: "",
  telefono: "",
  telefono_alt: "",
  departamento: "",
  municipio: "",
  direccion: "",
  empresa: "",
  cargo: "",
  telefono_trabajo: "",
  ingreso_mensual: "",
  anios_laborando: "",
  tipo_empleo: "Dependiente",
  estado: "Activo",
};
 
const STEPS = [
  { id: 1, label: "Datos personales", icon: "◌" },
  { id: 2, label: "Dirección",        icon: "◍" },
  { id: 3, label: "Datos laborales",  icon: "◎" },
  { id: 4, label: "Confirmación",     icon: "◆" },
];
 
const GENEROS         = ["Masculino", "Femenino", "Otro", "Prefiero no indicar"];
const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"];
const TIPOS_EMPLEO    = ["Dependiente", "Independiente", "Empresario", "Jubilado", "Otro"];
const DEPARTAMENTOS   = [
  "Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés",
  "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá",
  "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho",
  "Santa Bárbara", "Valle", "Yoro",
];
 
// ── Helpers ────────────────────────────────────────────────────────────────
const initials = (n, a) =>
  `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
 
const capacidadPago = (ingreso) => {
  const n = parseFloat(ingreso);
  return n ? n * 0.3 : null;
};
 
const fmtLps = (v) =>
  Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 });
 
// ── Paso 1 — Datos personales ──────────────────────────────────────────────
function StepPersonal({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <SectionLabel>Identificación</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre(s)" required error={errors.nombre}>
          <Input value={form.nombre} onChange={set("nombre")} placeholder="Juan Carlos" />
        </FormField>
        <FormField label="Apellido(s)" required error={errors.apellido}>
          <Input value={form.apellido} onChange={set("apellido")} placeholder="Martínez López" />
        </FormField>
        <FormField label="DNI / Identidad" required error={errors.dni}>
          <Input value={form.dni} onChange={set("dni")} placeholder="0801-1990-12345" maxLength={15} />
        </FormField>
        <FormField label="RTN">
          <Input value={form.rtn} onChange={set("rtn")} placeholder="0801-1990-123456-1" maxLength={17} />
        </FormField>
        <FormField label="Género">
          <Select value={form.genero} onChange={set("genero")}>
            <option value="">Seleccione...</option>
            {GENEROS.map((g) => <option key={g}>{g}</option>)}
          </Select>
        </FormField>
        <FormField label="Estado civil">
          <Select value={form.estado_civil} onChange={set("estado_civil")}>
            <option value="">Seleccione...</option>
            {ESTADOS_CIVILES.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </FormField>
      </div>
 
      <SectionLabel>Contacto</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Correo electrónico" error={errors.correo}>
          <Input type="email" value={form.correo} onChange={set("correo")} placeholder="juan@ejemplo.com" />
        </FormField>
        <FormField label="Teléfono principal" required error={errors.telefono}>
          <Input value={form.telefono} onChange={set("telefono")} placeholder="9999-9999" maxLength={9} />
        </FormField>
        <FormField label="Teléfono alternativo">
          <Input value={form.telefono_alt} onChange={set("telefono_alt")} placeholder="2222-2222" maxLength={9} />
        </FormField>
      </div>
    </div>
  );
}
 
// ── Paso 2 — Dirección ────────────────────────────────────────────────────
function StepDireccion({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <SectionLabel>Lugar de residencia</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Departamento" required error={errors.departamento}>
          <Select value={form.departamento} onChange={set("departamento")}>
            <option value="">Seleccione...</option>
            {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </FormField>
        <FormField label="Municipio" required error={errors.municipio}>
          <Input value={form.municipio} onChange={set("municipio")} placeholder="Municipio" />
        </FormField>
        <div className="col-span-2">
          <FormField label="Dirección completa" required error={errors.direccion}>
            <textarea
              value={form.direccion}
              onChange={set("direccion")}
              rows={3}
              placeholder="Colonia, calle, número de casa..."
              className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 transition-all resize-none"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
 
// ── Paso 3 — Datos laborales ──────────────────────────────────────────────
function StepLaboral({ form, set, errors }) {
  const cuota = capacidadPago(form.ingreso_mensual);
  return (
    <div className="space-y-5">
      <SectionLabel>Información laboral</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo de empleo" required>
          <Select value={form.tipo_empleo} onChange={set("tipo_empleo")}>
            {TIPOS_EMPLEO.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </FormField>
        <FormField label="Empresa / Empleador" required error={errors.empresa}>
          <Input value={form.empresa} onChange={set("empresa")} placeholder="Empresa S.A." />
        </FormField>
        <FormField label="Cargo / Puesto">
          <Input value={form.cargo} onChange={set("cargo")} placeholder="Analista, Gerente..." />
        </FormField>
        <FormField label="Teléfono del trabajo">
          <Input value={form.telefono_trabajo} onChange={set("telefono_trabajo")} placeholder="2234-5678" />
        </FormField>
        <FormField label="Ingreso mensual (L)" required error={errors.ingreso_mensual}>
          <Input type="number" value={form.ingreso_mensual} onChange={set("ingreso_mensual")} placeholder="0.00" min={0} />
        </FormField>
        <FormField label="Años laborando">
          <Input type="number" value={form.anios_laborando} onChange={set("anios_laborando")} placeholder="0" min={0} />
        </FormField>
      </div>
 
      {cuota && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-md p-4 mt-2">
          <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-wider mb-1">
            Capacidad de pago estimada (30% del ingreso)
          </p>
          <p className="text-2xl font-semibold text-amber-400">
            L {fmtLps(cuota)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Cuota mensual máxima recomendada</p>
        </div>
      )}
    </div>
  );
}
 
// ── Paso 4 — Confirmación ────────────────────────────────────────────────
function StepConfirmacion({ form }) {
  const cuota = capacidadPago(form.ingreso_mensual);
  const initStr = initials(form.nombre, form.apellido);
 
  const rows = [
    ["Correo",      form.correo],
    ["Teléfono",    form.telefono],
    ["Teléf. alt.", form.telefono_alt],
    ["Estado civil",form.estado_civil],
    ["Género",      form.genero],
    ["Nacimiento",  form.fecha_nacimiento],
    ["Departamento",form.departamento],
    ["Municipio",   form.municipio],
    ["Empresa",     form.empresa],
    ["Cargo",       form.cargo],
    ["Años lab.",   form.anios_laborando ? `${form.anios_laborando} años` : null],
    ["Ingreso",     form.ingreso_mensual ? `L ${fmtLps(form.ingreso_mensual)}` : null],
    ["Cap. pago",   cuota ? `L ${fmtLps(cuota)}` : null],
  ];
 
  return (
    <div className="space-y-5">
      <SectionLabel>Resumen del cliente</SectionLabel>
 
      {/* Avatar + nombre */}
      <div className="flex items-center gap-4 pb-5 border-b border-stone-800">
        <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-amber-400">{initStr || "?"}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-stone-100">
            {form.nombre} {form.apellido}
          </p>
          <p className="text-sm text-stone-400">{form.dni || "Sin DNI"}</p>
          <div className="flex gap-2 mt-1.5">
            <Badge variant="success">{form.estado}</Badge>
            {form.tipo_empleo && <Badge variant="info">{form.tipo_empleo}</Badge>}
          </div>
        </div>
      </div>
 
      {/* Grid de datos */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
        {rows.map(([label, value]) =>
          value ? (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-stone-500">{label}</span>
              <span className="text-stone-200 truncate">{value}</span>
            </div>
          ) : null
        )}
      </div>
 
      {form.direccion && (
        <div className="pt-4 border-t border-stone-800 text-sm">
          <span className="text-xs text-stone-500 block mb-1">Dirección completa</span>
          <span className="text-stone-300">{form.direccion}</span>
        </div>
      )}
    </div>
  );
}
 
// ── Tiny helper ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 pt-1">
      {children}
    </p>
  );
}
 
// ── Componente principal ──────────────────────────────────────────────────
export default function ClienteForm() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);
 
  const [form,    setForm]    = useState(EMPTY);
  const [step,    setStep]    = useState(1);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
 
  // Cargar en modo edición
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    clientesApi
      .get(id)
      .then((d) => setForm({ ...EMPTY, ...d }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
 
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
 
  // Validación por paso
  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.nombre.trim())   errs.nombre   = "El nombre es requerido";
      if (!form.apellido.trim()) errs.apellido = "El apellido es requerido";
      if (!form.dni.trim())      errs.dni      = "El DNI es requerido";
      if (!form.telefono.trim()) errs.telefono = "El teléfono es requerido";
      if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
        errs.correo = "Correo electrónico inválido";
    }
    if (s === 2) {
      if (!form.departamento)    errs.departamento = "Seleccione un departamento";
      if (!form.municipio.trim())errs.municipio    = "El municipio es requerido";
      if (!form.direccion.trim())errs.direccion    = "La dirección es requerida";
    }
    if (s === 3) {
      if (!form.empresa.trim())      errs.empresa       = "La empresa es requerida";
      if (!form.ingreso_mensual)     errs.ingreso_mensual = "Ingrese el ingreso mensual";
    }
    return errs;
  };
 
  const next = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };
 
  const prev = () => setStep((s) => Math.max(s - 1, 1));
 
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      isEdit
        ? await clientesApi.update(id, form)
        : await clientesApi.create(form);
      navigate("/clientes");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
 
  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Cliente" : "Nuevo Cliente"}
        subtitle={isEdit ? `sp_clientes_actualizar @id=${id}` : "sp_clientes_registrar"}
        actions={
          <Link to="/clientes">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
 
      <PageContent>
        {loading ? (
          <p className="text-sm text-stone-500 animate-pulse">Cargando cliente...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
            {/* ── Columna principal ──────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}
 
              {/* Stepper tabs */}
              <div className="grid grid-cols-4 gap-1">
                {STEPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { if (s.id < step) setStep(s.id); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all border ${
                      step === s.id
                        ? "bg-amber-400/10 border-amber-400/40 text-amber-400"
                        : step > s.id
                        ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200 cursor-pointer"
                        : "bg-stone-900 border-stone-800 text-stone-600 cursor-default"
                    }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="hidden sm:block leading-tight text-center">{s.label}</span>
                  </button>
                ))}
              </div>
 
              {/* Barra de progreso */}
              <div className="h-0.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
 
              {/* Contenido del paso */}
              <Card className="p-6">
                {step === 1 && <StepPersonal  form={form} set={set} errors={errors} />}
                {step === 2 && <StepDireccion form={form} set={set} errors={errors} />}
                {step === 3 && <StepLaboral   form={form} set={set} errors={errors} />}
                {step === 4 && <StepConfirmacion form={form} />}
 
                {/* Botones de navegación */}
                <div className="flex justify-between items-center mt-8 pt-5 border-t border-stone-800">
                  <div>
                    {step > 1 && (
                      <Button variant="secondary" onClick={prev}>
                        ← Anterior
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Link to="/clientes">
                      <Button variant="ghost">Cancelar</Button>
                    </Link>
                    {step < 4 ? (
                      <Button onClick={next}>Siguiente →</Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={saving}>
                        {saving
                          ? "Guardando..."
                          : isEdit
                          ? "Actualizar cliente"
                          : "Registrar cliente"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
 
            {/* ── Panel lateral ──────────────────────────────────────── */}
            <div className="space-y-4">
 
              {/* Avatar en tiempo real */}
              <Card className="p-5 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-400">
                    {initials(form.nombre, form.apellido) || "?"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-stone-100 leading-snug">
                    {form.nombre || "Nombre"} {form.apellido || "Apellido"}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{form.dni || "Sin DNI"}</p>
                </div>
                <Badge variant={form.estado === "Activo" ? "success" : "default"}>
                  {form.estado}
                </Badge>
              </Card>
 
              {/* Vista previa */}
              <Card className="p-4 space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Vista previa
                </p>
                {[
                  ["Teléfono",    form.telefono],
                  ["Correo",      form.correo],
                  ["Departamento",form.departamento],
                  ["Empresa",     form.empresa],
                  ["Ingreso",     form.ingreso_mensual ? `L ${fmtLps(form.ingreso_mensual)}` : null],
                ].map(([label, val]) =>
                  val ? (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="text-stone-500 flex-shrink-0">{label}</span>
                      <span className="text-stone-300 text-right truncate max-w-[140px]">{val}</span>
                    </div>
                  ) : null
                )}
              </Card>
 
              {/* Capacidad de pago */}
              {capacidadPago(form.ingreso_mensual) && (
                <Card className="p-4 bg-amber-400/5 border-amber-400/20">
                  <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-wider mb-1">
                    Cap. de pago (30%)
                  </p>
                  <p className="text-xl font-semibold text-amber-400">
                    L {fmtLps(capacidadPago(form.ingreso_mensual))}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">Cuota mensual máxima</p>
                </Card>
              )}
 
              {/* Indicador de pasos */}
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                  Progreso
                </p>
                <div className="space-y-2.5">
                  {STEPS.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 ${
                          step > s.id
                            ? "bg-emerald-400/20 text-emerald-400"
                            : step === s.id
                            ? "bg-amber-400/20 text-amber-400"
                            : "bg-stone-800 text-stone-600"
                        }`}
                      >
                        {step > s.id ? "✓" : s.id}
                      </span>
                      <span
                        className={
                          step === s.id
                            ? "text-stone-200 font-medium"
                            : step > s.id
                            ? "text-stone-400"
                            : "text-stone-600"
                        }
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </PageContent>
    </div>
  );
}
