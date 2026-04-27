import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  PageHeader, PageContent, Card, DataTable, Badge, FormField,
  Select, Button, Input, Modal, Alert,
} from "../../components/index";
import {
  lotesApi, proyectosApi, etapasApi, bloquesApi, clientesApi, ventasApi,
} from "../../services/api";
import { notify, useNotifyError } from "../../utils/notify";

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtLps = (v) =>
  v != null ? `L ${Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—";

const ESTADO_COLORS = {
  Disponible: "success", Vendido: "danger", Reservado: "warning", "En proceso": "info",
};

// ── PersonaCard ──────────────────────────────────────────────────────────────
// Renderiza la ficha de un cliente encontrado con acento visual por rol.
// accent: "amber" = comprador (protagonista), "blue" = aval, "purple" = beneficiario
function PersonaCard({ data, rol, accentColor }) {
  const palettes = {
    amber: { ring: "border-amber-400/50", bg: "bg-amber-400/5", icon: "bg-amber-400/15 text-amber-400", tag: "bg-amber-400/10 text-amber-400", label: "text-amber-400" },
    blue: { ring: "border-blue-400/40", bg: "bg-blue-400/5", icon: "bg-blue-400/15 text-blue-400", tag: "bg-blue-400/10 text-blue-400", label: "text-blue-400" },
    purple: { ring: "border-purple-400/40", bg: "bg-purple-400/5", icon: "bg-purple-400/15 text-purple-400", tag: "bg-purple-400/10 text-purple-400", label: "text-purple-400" },
  };
  const p = palettes[accentColor] ?? palettes.amber;

  const initials = (
    (data.nombreCompleto ?? data.NombreCompleto ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );

  const nombre = data.nombreCompleto ?? data.NombreCompleto ?? "—";
  const dni = data.dni ?? data.DNI ?? "—";
  const telefono = data.telefono ?? data.Telefono ?? "—";
  const empresa = data.nombreEmpresa ?? data.NombreEmpresa ?? null;
  const ocupacion = data.ocupacion ?? data.Ocupacion ?? null;
  const ingreso = data.ingresoMensual ?? data.IngresoMensual ?? null;
  const estado = data.estado ?? data.Estado ?? null;

  return (
    <div className={`rounded-xl border-2 ${p.ring} ${p.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${p.icon}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${p.tag}`}>
              {rol}
            </span>
            {estado && (
              <span className="text-[10px] text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
                {estado}
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold mt-0.5 truncate ${p.label}`}>{nombre}</p>
          <p className="text-xs text-stone-500 font-mono">{dni}</p>
        </div>
      </div>

      {/* Grid de datos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-stone-700/50 pt-3">
        {telefono !== "—" && (
          <>
            <span className="text-stone-500">Teléfono</span>
            <span className="text-stone-300">{telefono}</span>
          </>
        )}
        {empresa && (
          <>
            <span className="text-stone-500">Empresa</span>
            <span className="text-stone-300 truncate">{empresa}</span>
          </>
        )}
        {ocupacion && (
          <>
            <span className="text-stone-500">Ocupación</span>
            <span className="text-stone-300 truncate">{ocupacion}</span>
          </>
        )}
        {ingreso != null && (
          <>
            <span className="text-stone-500">Ingreso mensual</span>
            <span className={`font-semibold ${p.label}`}>{fmtLps(ingreso)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── BuscadorPersona ───────────────────────────────────────────────────────────
// Campo DNI + botón buscar + resultado como PersonaCard
function BuscadorPersona({ label, rol, accentColor, value, onChange, onBuscar, loading, data, onLimpiar }) {
  const palettes = {
    amber: { btn: "bg-amber-400 text-stone-950 hover:bg-amber-300", border: "border-amber-400/30" },
    blue: { btn: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20", border: "border-blue-400/30" },
    purple: { btn: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/20", border: "border-purple-400/30" },
  };
  const p = palettes[accentColor] ?? palettes.amber;

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
        {label}
      </label>

      {!data ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="Ingrese DNI..."
            onKeyDown={(e) => e.key === "Enter" && value.trim() && onBuscar()}
            className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-all"
          />
          <button
            type="button"
            onClick={onBuscar}
            disabled={loading || !value.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 ${p.btn}`}
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <PersonaCard data={data} rol={rol} accentColor={accentColor} />
          <button
            type="button"
            onClick={onLimpiar}
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
          >
            ✕ Cambiar {rol.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Stepper visual ────────────────────────────────────────────────────────────
function ModalStepper({ step }) {
  const steps = ["Comprador", "Tipo de venta", "Confirmar"];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 flex-1 ${i > 0 ? "" : ""}`}>
              {i > 0 && <div className={`h-px flex-1 transition-colors ${done || active ? "bg-amber-400/40" : "bg-stone-700"}`} />}
              <div className={`flex items-center gap-1.5 ${i > 0 ? "" : "flex-1 justify-start"}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${done ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/40" :
                      active ? "bg-amber-400 text-stone-950" :
                        "bg-stone-800 text-stone-600 border border-stone-700"
                    }`}
                >
                  {done ? "✓" : idx}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-amber-400" : done ? "text-stone-400" : "text-stone-600"
                  }`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 transition-colors ${done ? "bg-amber-400/40" : "bg-stone-700"}`} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function LotesDisponibles() {
  const [lotes, setLotes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [draftFiltros, setDraftFiltros] = useState({ proyectoId: "", etapaId: "", bloqueId: "", areaMin: "", areaMax: "" });
  const [filtros, setFiltros] = useState({ proyectoId: "", etapaId: "", bloqueId: "", areaMin: "", areaMax: "" });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [ventaModal, setVentaModal] = useState({ open: false, lote: null });
  const [modalStep, setModalStep] = useState(1); // 1: comprador, 2: tipo venta, 3: confirmar

  // Personas (los 3 vienen de la misma tabla clientes)
  const [compradorDni, setCompradorDni] = useState("");
  const [compradorData, setCompradorData] = useState(null);
  const [avalDni, setAvalDni] = useState("");
  const [avalData, setAvalData] = useState(null);
  const [beneficiarioDni, setBeneficiarioDni] = useState("");
  const [beneficiarioData, setBeneficiarioData] = useState(null);

  const [buscando, setBuscando] = useState({ comprador: false, aval: false, beneficiario: false });

  // Financiamiento
  const [ventaForm, setVentaForm] = useState({
    tipoVenta: "Contado",
    prima: "",
    aniosPlazo: 10,
    tasa_interes: 12.0,
  });

  const [creandoVenta, setCreandoVenta] = useState(false);

  useNotifyError(error);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([proyectosApi.list(), lotesApi.disponiblesVenta()])
      .then(([pl, ll]) => { setProyectos(pl); setLotes(ll); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draftFiltros.proyectoId) {
      setEtapas([]);
      setBloques([]);
      return;
    }
    etapasApi.list()
      .then((etapas) => {
        setEtapas(etapas.filter((e) => e.ProyectoID === Number(draftFiltros.proyectoId)));
      })
      .catch(() => setEtapas([]));
  }, [draftFiltros.proyectoId]);

  useEffect(() => {
    if (!draftFiltros.etapaId) {
      setBloques([]);
      return;
    }
    bloquesApi.list()
      .then((bloques) => {
        setBloques(bloques.filter((e) => e.EtapaID === Number(draftFiltros.etapaId)));
      })
      .catch(() => setBloques([]));
  }, [draftFiltros.etapaId]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setDraftFiltros((prev) => {
      if (key === "proyectoId") return { ...prev, proyectoId: val, etapaId: "", bloqueId: "" };
      if (key === "etapaId") return { ...prev, etapaId: val, bloqueId: "" };
      return { ...prev, [key]: val };
    });
  };

  const filteredLotes = useMemo(() => lotes.filter((item) => {
    const area = parseFloat(item.area_m2 ?? 0);
    return (
      (!filtros.proyectoId || item.proyectoId === Number(filtros.proyectoId)) &&
      (!filtros.etapaId || item.etapaId === Number(filtros.etapaId)) &&
      (!filtros.bloqueId || item.bloqueId === Number(filtros.bloqueId)) &&
      (!filtros.areaMin || area >= parseFloat(filtros.areaMin)) &&
      (!filtros.areaMax || area <= parseFloat(filtros.areaMax))
    );
  }), [lotes, filtros]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const abrirModal = (lote) => {
    setVentaModal({ open: true, lote });
    setModalStep(1);
    setCompradorDni(""); setCompradorData(null);
    setAvalDni(""); setAvalData(null);
    setBeneficiarioDni(""); setBeneficiarioData(null);
    setVentaForm({ tipoVenta: "Contado", prima: "", aniosPlazo: 10, tasa_interes: 12.0 });
  };

  const cerrarModal = () => setVentaModal({ open: false, lote: null });

  const buscarPersona = async (tipo) => {
    const dniMap = { comprador: compradorDni, aval: avalDni, beneficiario: beneficiarioDni };
    const dni = dniMap[tipo]?.trim();
    if (!dni) return;

    setBuscando((b) => ({ ...b, [tipo]: true }));
    try {
      const result = await clientesApi.getByDni(dni);
      if (tipo === "comprador") setCompradorData(result);
      if (tipo === "aval") setAvalData(result);
      if (tipo === "beneficiario") setBeneficiarioData(result);
    } catch {
      if (tipo === "comprador") { setCompradorData(null); notify.error("Comprador no encontrado"); }
      if (tipo === "aval") { setAvalData(null); notify.error("Aval no encontrado"); }
      if (tipo === "beneficiario") { setBeneficiarioData(null); notify.error("Beneficiario no encontrado"); }
    } finally {
      setBuscando((b) => ({ ...b, [tipo]: false }));
    }
  };

  // Avanzar paso con validación
  const avanzarPaso = () => {
    if (modalStep === 1 && !compradorData) {
      notify.error("Debe identificar al comprador antes de continuar.");
      return;
    }
    setModalStep((s) => s + 1);
  };

  // ── Crear venta ────────────────────────────────────────────────────────────
  const crearVenta = async () => {
    if (!compradorData) return;
    setCreandoVenta(true);
    try {
      const lote = ventaModal.lote;
      const montoTotal = parseFloat(lote.precio_final ?? lote.valor_total ?? 0);
      const prima = ventaForm.tipoVenta === "Credito" ? (parseFloat(ventaForm.prima) || 0) : 0;
      const financiado = ventaForm.tipoVenta === "Credito" ? montoTotal - prima : 0;

      if (compradorData.id === avalData?.id) {
        notify.error("El comprador no puede ser el mismo que el aval.");
        return;
      } else if (compradorData.id === beneficiarioData?.id) {
        notify.error("El comprador no puede ser el mismo que el beneficiario.");
        return;
      }

      await ventasApi.create({
        LoteID: lote.id,
        ClienteID: compradorData.id,
        BeneficiarioID: beneficiarioData?.id ?? null,
        AvalID: avalData?.id ?? null,
        UsuarioID: 1,
        TipoVenta: ventaForm.tipoVenta,
        MontoTotal: montoTotal,
        Prima: prima,
        MontoFinanciado: financiado,
        AniosPlazo: ventaForm.tipoVenta === "Credito" ? Number(ventaForm.aniosPlazo) : 0,
        TasaInteresAplicada: ventaModal.lote.tasa_interes,
        Estado: ventaForm.tipoVenta === "Contado" ? "Finalizada" : "En Proceso",
      });

      setLotes((prev) => prev.filter((l) => l.id !== lote.id));
      cerrarModal();
      notify.success("Venta creada exitosamente");
    } catch (err) {
      notify.error(err.message || "No se pudo crear la venta");
    } finally {
      setCreandoVenta(false);
    }
  };

  // Cálculos financieros para el resumen
  const lote = ventaModal.lote;
  const montoTotal = parseFloat(lote?.precio_final ?? lote?.valor_total ?? 0);
  const prima = ventaForm.tipoVenta === "Credito" ? (parseFloat(ventaForm.prima) || 0) : 0;
  const financiado = ventaForm.tipoVenta === "Credito" ? montoTotal - prima : 0;
  const cuotaEst = ventaForm.tipoVenta === "Credito" && ventaForm.aniosPlazo > 0 && lote?.tasa_interes
    ? (financiado * (lote.tasa_interes / 100 / 12)) /
    (1 - Math.pow(1 + lote.tasa_interes / 100 / 12, -(ventaForm.aniosPlazo * 12)))
    : 0;

  // ── Columnas tabla ─────────────────────────────────────────────────────────
  const columns = [
    { key: "codigo_lote", label: "Lote" },
    { key: "proyecto", label: "Proyecto" },
    { key: "etapa", label: "Etapa" },
    { key: "bloque", label: "Bloque" },
    {
      key: "area_m2", label: "Área (v²)",
      render: (v) => <span className="text-stone-300">{Number(v || 0).toLocaleString()}</span>
    },
    {
      key: "precio_final", label: "Precio",
      render: (v) => <span className="text-amber-400 font-medium">{fmtLps(v)}</span>
    },
    {
      key: "actions", label: "",
      render: (_, row) => (
        <Button size="sm" onClick={() => abrirModal(row)}>Vender</Button>
      )
    },
  ];

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <PageHeader
        title="Lotes Disponibles"
        subtitle="vw_lotes_disponibles — filtrado en tiempo real"
      />
      <PageContent>
        {/* ── Filtros ──────────────────────────────────────────────────── */}
        <Card className="p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
            Filtros de búsqueda
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField label="Proyecto">
              <Select value={draftFiltros.proyectoId} onChange={handleChange("proyectoId")}>
                <option value="">Todos</option>
                {proyectos.map((p) => <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Etapa">
              <Select value={draftFiltros.etapaId} onChange={handleChange("etapaId")}> {/*disabled={!draftFiltros.proyectoId}>*/}
                <option value="">Todas</option>
                {etapas.map((e) => <option key={e.EtapaID} value={e.EtapaID}>{e.Etapa}</option>)}
              </Select>
            </FormField>
            <FormField label="Bloque">
              <Select value={draftFiltros.bloqueId} onChange={handleChange("bloqueId")} disabled={!draftFiltros.etapaId}>
                <option value="">Todos</option>
                {bloques.map((b) => <option key={b.BloqueID} value={b.BloqueID}>{b.Bloque}</option>)}
              </Select>
            </FormField>
            <FormField label="Área mín (v²)">
              <Input type="number" placeholder="0" value={draftFiltros.areaMin} onChange={handleChange("areaMin")} />
            </FormField>
            <FormField label="Área máx (v²)">
              <Input type="number" placeholder="9999" value={draftFiltros.areaMax} onChange={handleChange("areaMax")} />
            </FormField>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setFiltros(draftFiltros)}>Buscar lotes</Button>
          </div>
        </Card>



        {/* ── Tabla ────────────────────────────────────────────────────── */}
        <p className="text-xs text-stone-500 mb-3">
          {filteredLotes.length > 0 ? `${filteredLotes.length} lote(s) disponible(s)` : "Sin resultados"}
        </p>
        <Card>
          <DataTable columns={columns} data={filteredLotes} loading={loading} />
        </Card>

        {/* ══════════════════════════════════════════════════════════════
            MODAL DE VENTA
        ══════════════════════════════════════════════════════════════ */}
        <Modal
          open={ventaModal.open}
          onClose={cerrarModal}
          title={`Vender lote ${lote?.codigo_lote ?? ""}`}
          width="max-w-2xl"
        >
          {lote && (
            <div className="space-y-5">

              {/* Stepper */}
              <ModalStepper step={modalStep} />

              {/* ── Info del lote (siempre visible) ─────────────────────── */}
              <div className="flex items-center gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center text-xl flex-shrink-0">
                  ▣
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-100">{lote.codigo_lote}</p>
                  <p className="text-xs text-stone-500 truncate">{lote.proyecto} · {lote.etapa} · Bloque {lote.bloque}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-stone-500">Precio</p>
                  <p className="text-base font-bold text-amber-400">{fmtLps(lote.precio_final)}</p>
                  {lote.area_m2 && <p className="text-[11px] text-stone-600">{Number(lote.area_m2).toLocaleString()} v²</p>}
                </div>
              </div>

              {/* ── PASO 1: Comprador ────────────────────────────────────── */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center">1</div>
                    <p className="text-sm font-semibold text-stone-200">Identificar al comprador</p>
                  </div>

                  <BuscadorPersona
                    label="DNI del comprador"
                    rol="Comprador"
                    accentColor="amber"
                    value={compradorDni}
                    onChange={(e) => setCompradorDni(e.target.value)}
                    onBuscar={() => buscarPersona("comprador")}
                    loading={buscando.comprador}
                    data={compradorData}
                    onLimpiar={() => { setCompradorData(null); setCompradorDni(""); }}
                  />

                  {!compradorData && compradorDni && !buscando.comprador && (
                    <Alert variant="warning">
                      No se encontró el cliente.{" "}
                      <Link to="/clientes/nuevo" className="underline font-medium">Registrar nuevo cliente</Link>
                    </Alert>
                  )}

                  <div className="flex justify-end pt-2 border-t border-stone-800">
                    <Button onClick={avanzarPaso} disabled={!compradorData}>
                      Continuar →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── PASO 2: Tipo de venta + Aval + Beneficiario ─────────── */}
              {modalStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center">2</div>
                    <p className="text-sm font-semibold text-stone-200">Tipo de venta y participantes</p>
                  </div>

                  {/* Selector tipo de venta */}
                  <div className="grid grid-cols-2 gap-3">
                    {["Contado", "Credito"].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setVentaForm((f) => ({ ...f, tipoVenta: tipo }))}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${ventaForm.tipoVenta === tipo
                            ? "border-amber-400 bg-amber-400/10 text-amber-400"
                            : "border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300"
                          }`}
                      >
                        {tipo === "Contado" ? "◎ Contado" : "◆ Crédito"}
                      </button>
                    ))}
                  </div>

                  {/* Campos de crédito */}
                  {ventaForm.tipoVenta === "Credito" && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-stone-800/40 rounded-xl border border-stone-700/50">
                      <FormField label="Prima (L)">
                        <Input
                          type="number"
                          value={ventaForm.prima}
                          onChange={(e) => setVentaForm((f) => ({ ...f, prima: e.target.value }))}
                          placeholder="0.00"
                          min={0}
                        />
                      </FormField>
                      <FormField label="Años de plazo">
                        <Input
                          type="number"
                          value={ventaForm.aniosPlazo}
                          onChange={(e) => setVentaForm((f) => ({ ...f, aniosPlazo: e.target.value }))}
                          min={1} max={30}
                        />
                      </FormField>
                      <FormField label="Tasa anual (%)">
                        <Input
                          type="number"
                          value={ventaModal.lote?.tasa_interes ?? ""}
                          disabled
                          min={0} step="0.1"
                        />
                      </FormField>
                    </div>
                  )}

                  {/* Separador */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-stone-800" />
                    <p className="text-[10px] text-stone-600 uppercase tracking-widest font-semibold">Participantes adicionales</p>
                    <div className="h-px flex-1 bg-stone-800" />
                  </div>

                  {/* Comprador (solo lectura — ya identificado) */}
                  <PersonaCard data={compradorData} rol="Comprador" accentColor="amber" />

                  {/* Beneficiario — siempre requerido */}
                  <BuscadorPersona
                    label="DNI del beneficiario en caso de fallecimiento"
                    rol="Beneficiario"
                    accentColor="purple"
                    value={beneficiarioDni}
                    onChange={(e) => setBeneficiarioDni(e.target.value)}
                    onBuscar={() => buscarPersona("beneficiario")}
                    loading={buscando.beneficiario}
                    data={beneficiarioData}
                    onLimpiar={() => { setBeneficiarioData(null); setBeneficiarioDni(""); }}
                  />

                  {/* Aval — solo crédito */}
                  {ventaForm.tipoVenta === "Credito" && (
                    <BuscadorPersona
                      label="DNI del aval"
                      rol="Aval"
                      accentColor="blue"
                      value={avalDni}
                      onChange={(e) => setAvalDni(e.target.value)}
                      onBuscar={() => buscarPersona("aval")}
                      loading={buscando.aval}
                      data={avalData}
                      onLimpiar={() => { setAvalData(null); setAvalDni(""); }}
                    />
                  )}

                  <div className="flex justify-between pt-2 border-t border-stone-800">
                    <Button variant="secondary" onClick={() => setModalStep(1)}>← Atrás</Button>
                    <Button
                      onClick={avanzarPaso}
                      disabled={!beneficiarioData || (ventaForm.tipoVenta === "Credito" && !avalData)}
                    >
                      Revisar y confirmar →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── PASO 3: Confirmación ─────────────────────────────────── */}
              {modalStep === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center">3</div>
                    <p className="text-sm font-semibold text-stone-200">Confirmar venta</p>
                  </div>

                  {/* Fichas de las 3 personas */}
                  <div className="space-y-3">
                    <PersonaCard data={compradorData} rol="Comprador" accentColor="amber" />
                    <PersonaCard data={beneficiarioData} rol="Beneficiario" accentColor="purple" />
                    {avalData && <PersonaCard data={avalData} rol="Aval" accentColor="blue" />}
                  </div>

                  {/* Resumen financiero */}
                  <div className="rounded-xl border border-stone-700 bg-stone-800/40 p-4 space-y-2.5 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Resumen financiero</p>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Valor del lote</span>
                      <span className="text-stone-200 font-medium">{fmtLps(montoTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Tipo de venta</span>
                      <Badge variant={ventaForm.tipoVenta === "Contado" ? "success" : "info"}>
                        {ventaForm.tipoVenta}
                      </Badge>
                    </div>
                    {ventaForm.tipoVenta === "Credito" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Prima</span>
                          <span className="text-stone-200">{fmtLps(prima)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Monto a financiar</span>
                          <span className="text-stone-200">{fmtLps(financiado)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Plazo</span>
                          <span className="text-stone-200">{ventaForm.aniosPlazo} años · {ventaForm.aniosPlazo * 12} cuotas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Tasa anual</span>
                          <span className="text-stone-200">{lote?.tasa_interes ?? "—"}%</span>
                        </div>
                        <div className="h-px bg-stone-700" />
                        <div className="flex justify-between font-semibold">
                          <span className="text-stone-300">Cuota mensual estimada</span>
                          <span className="text-amber-400 text-base">{fmtLps(cuotaEst)}</span>
                        </div>
                      </>
                    )}
                    {ventaForm.tipoVenta === "Contado" && (
                      <>
                        <div className="h-px bg-stone-700" />
                        <div className="flex justify-between font-semibold">
                          <span className="text-stone-300">Total a pagar</span>
                          <span className="text-amber-400 text-base">{fmtLps(montoTotal)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between pt-2 border-t border-stone-800">
                    <Button variant="secondary" onClick={() => setModalStep(2)}>← Atrás</Button>
                    <Button onClick={crearVenta} disabled={creandoVenta}>
                      {creandoVenta ? "Creando venta..." : "✓ Confirmar y crear venta"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </PageContent>
    </div>
  );
}