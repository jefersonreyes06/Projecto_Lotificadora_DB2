import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ventasApi, pagosApi } from "../../services/api";
import { notify, useNotifyError } from "../../utils/notify";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, Alert, StatCard,
} from "../../components/index";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtLps = (v) =>
  v != null && v !== ""
    ? `L ${Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
    : "—";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const initials = (nombre, apellido) =>
  ((nombre?.[0] ?? "") + (apellido?.[0] ?? "")).toUpperCase() || "?";

// ── Sub-componentes ────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-3">
      {children}
    </p>
  );
}

function InfoRow({ label, value, accent, mono }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-stone-800/50 last:border-0 gap-4">
      <span className="text-sm text-stone-500 flex-shrink-0">{label}</span>
      <span
        className={`text-sm text-right break-all ${
          accent ? "font-semibold text-amber-400" : mono ? "font-mono text-stone-300" : "font-medium text-stone-200"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function AvatarCircle({ nombre, apellido, size = "md" }) {
  const sz = size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sz} rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-bold text-amber-400">{initials(nombre, apellido)}</span>
    </div>
  );
}

function ProgressBar({ pct, colorClass = "bg-amber-400" }) {
  return (
    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function SkeletonCard({ rows = 4 }) {
  return (
    <Card className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-stone-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
      ))}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function VentaDetalle() {
  const { id } = useParams();

  const [venta,   setVenta]   = useState(null);
  const [pagos,   setPagos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useNotifyError(error);

  useEffect(() => {
    Promise.all([ventasApi.get(id), pagosApi.list(id)])
      .then(([v, p]) => { setVenta(v); setPagos(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader title="Detalle de venta" subtitle="Cargando..." />
        <PageContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-stone-900 border border-stone-800 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4"><SkeletonCard rows={5} /><SkeletonCard rows={6} /></div>
            <div className="space-y-4"><SkeletonCard rows={6} /><SkeletonCard rows={4} /></div>
            <div className="space-y-4"><SkeletonCard rows={3} /><SkeletonCard rows={3} /></div>
          </div>
        </PageContent>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !venta) {
    return (
      <div>
        <PageHeader title="Detalle de venta" actions={<Link to="/ventas"><Button variant="ghost">← Volver</Button></Link>} />
        <PageContent>
          <Alert variant="danger">{error ?? "Venta no encontrada."}</Alert>
        </PageContent>
      </div>
    );
  }

  // ── Cálculos derivados ───────────────────────────────────────────────────
  const montoTotal    = Number(venta.MontoTotal    ?? venta.monto_total    ?? 0);
  const montoPagado   = venta.TipoVenta == "Contado" ? montoTotal : Number(venta.MontoPagado   ?? venta.monto_pagado   ?? 0);
  const saldoPendiente = montoTotal - montoPagado;
  const pctPagado     = montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0;

  const esCredito     = (venta.TipoVenta ?? venta.tipo_venta) === "Credito";
  const estado        = venta.Estado       ?? venta.estado        ?? "—";
  const estadoCuenta  = venta.EstadoCuenta ?? venta.estado_cuenta ?? "—";
  const cuotasVencidas = Number(venta.CuotasVencidas ?? venta.cuotas_vencidas ?? 0);

  // Campos del lote (SP puede devolver PascalCase o snake_case)
  const lote = {
    codigo:       venta.NumeroLote   ?? venta.lote_codigo    ?? venta.Lote    ?? "—",
    bloque:       venta.Bloque        ?? venta.bloque         ?? "—",
    etapa:        venta.Etapa         ?? venta.etapa          ?? "—",
    proyecto:     venta.Proyecto      ?? venta.proyecto       ?? "—",
    areaVaras:    venta.AreaVaras     ?? venta.area_m2        ?? venta.areaVaras ?? null,
    valorBase:    venta.PrecioBase    ?? venta.valor_base     ?? null,
    valorLote:    venta.PrecioFinal     ?? venta.valor_lote     ?? null,
    esEsquina:    venta.EsEsquina     ?? venta.es_esquina     ?? false,
    cercaParque:  venta.CercaParque   ?? venta.cerca_parque   ?? false,
    calleCerrada: venta.CalleCerrada  ?? venta.calle_cerrada  ?? false,
    frenteAvenida:venta.FrenteAvenida ?? venta.frente_avenida ?? false,
    precioVara:   venta.PrecioVaraCuadrada    ?? venta.precio_vara    ?? null,
  };

  // Campos del cliente
  const cliente = {
    id:        venta.ClienteID     ?? venta.cliente_id       ?? null,
    nombre:    venta.ClienteNombre ?? venta.cliente_nombre   ?? "—",
    apellido:  venta.ClienteApellido ?? venta.cliente_apellido ?? "",
    dni:       venta.ClienteDNI    ?? venta.cliente_dni      ?? "—",
    telefono:  venta.ClienteTelefono ?? venta.cliente_telefono ?? null,
    correo:    venta.ClienteCorreo ?? venta.cliente_correo   ?? null,
    empresa:   venta.ClienteEmpresa ?? venta.cliente_empresa ?? null,
    ingreso:   venta.ClienteIngreso ?? venta.cliente_ingreso ?? null,
    departamento: venta.ClienteDepartamento ?? venta.cliente_departamento ?? null,
    municipio:    venta.ClienteMunicipio    ?? venta.cliente_municipio    ?? null,
  };

  // Campos del aval (solo crédito)
  const aval = {
    nombre:   venta.AvalNombre   ?? venta.aval_nombre   ?? null,
    apellido: venta.AvalApellido ?? venta.aval_apellido ?? "",
    dni:      venta.AvalDNI      ?? venta.aval_dni      ?? null,
    telefono: venta.AvalTelefono ?? venta.aval_telefono ?? null,
  };

  // Campos del beneficiario (solo crédito)
  const beneficiario = {
    nombre:   venta.BeneficiarioNombre   ?? venta.beneficiario_nombre   ?? null,
    dni:      venta.BeneficiarioDNI      ?? venta.beneficiario_dni      ?? null,
    relacion: venta.BeneficiarioRelacion ?? venta.beneficiario_relacion ?? null,
  };

  // Financiamiento (solo crédito)
  const credito = {
    prima:       venta.Prima             ?? venta.prima              ?? 0,
    financiado:  venta.MontoFinanciado   ?? venta.monto_financiado   ?? 0,
    tasa:        venta.TasaInteres       ?? venta.tasa_interes       ?? 0,
    anios:       venta.AniosFinanciamiento ?? venta.anios_financiamiento ?? 0,
    cuotaMensual:venta.CuotaMensual      ?? venta.cuota_mensual      ?? 0,
    cuotasPagadas: Number(venta.CuotasPagadas ?? venta.cuotas_pagadas ?? 0),
    cuotasTotales: Number(venta.CuotasTotales ?? venta.cuotas_totales ?? 0),
  };
  console.log(venta)

  // Cuenta bancaria
  const cuenta = {
    banco:   venta.CuentaBanco   ?? venta.cuenta_banco   ?? null,
    numero:  venta.CuentaNumero  ?? venta.cuenta_numero  ?? null,
    titular: venta.CuentaTitular ?? venta.cuenta_titular ?? null,
  };

  // Columnas del historial de pagos
  const pagosCols = [
    { key: "PagoID",      label: "#",       width: 56,
      render: (v, r) => <span className="font-mono text-xs text-stone-500">{v ?? r.id}</span> },
    { key: "FechaPago",   label: "Fecha",
      render: (v, r) => fmtDate(v ?? r.fecha_pago) },
    { key: "TipoPago",    label: "Tipo",
      render: (v, r) => {
        const t = v ?? r.tipo_pago ?? "—";
        return <Badge variant={t === "Efectivo" ? "success" : "info"}>{t}</Badge>;
      }},
    { key: "MontoPagado", label: "Total",
      render: (v, r) => <span className="text-emerald-400 font-medium">{fmtLps(v ?? r.monto_pagado)}</span> },
    { key: "Capital",     label: "Capital",
      render: (v, r) => <span className="text-blue-400">{fmtLps(v ?? r.capital)}</span> },
    { key: "Interes",     label: "Interés",
      render: (v, r) => <span className="text-amber-400">{fmtLps(v ?? r.interes)}</span> },
    { key: "NumeroCuota", label: "Cuota #",
      render: (v, r) => <span className="text-stone-400">{v ?? r.numero_cuota ?? "—"}</span> },
    { key: "FacturaID",   label: "Factura",
      render: (v, r) => {
        const fid = v ?? r.factura_id;
        return fid
          ? <Link to={`/pagos/${fid}/factura`} onClick={(e) => e.stopPropagation()}>
              <Badge variant="default">#{fid}</Badge>
            </Link>
          : <span className="text-stone-600">—</span>;
      }},
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title={`Venta #${id}`}
        subtitle={`${cliente.nombre} ${cliente.apellido} · ${lote.proyecto} · sp_ventas_obtener`}
        actions={
          <div className="flex gap-2">
            {esCredito && (
              <Link to={`/ventas/${id}/plan-pagos`}>
                <Button variant="secondary">Plan de pagos</Button>
              </Link>
            )}
            <Link to={`/pagos/nuevo?ventaId=${id}`}>
              <Button>+ Registrar pago</Button>
            </Link>
            <Link to="/ventas"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Monto total"
            value={fmtLps(montoTotal)}
            accent
          />
          <StatCard
            label="Pagado"
            value={fmtLps(montoPagado)}
            sub={`${pctPagado.toFixed(1)}% completado`}
          />
          <StatCard
            label="Saldo pendiente"
            value={fmtLps(saldoPendiente)}
            sub={saldoPendiente <= 0 ? "Crédito liquidado" : ""}
          />
          <StatCard
            label={cuotasVencidas > 0 ? "Cuotas en mora" : "Estado de cuenta"}
            value={cuotasVencidas > 0 ? cuotasVencidas : estadoCuenta}
            sub={cuotasVencidas > 0 ? "Requiere atención" : ""}
          />
        </div>

        {/* ── Barra de progreso (crédito) ─────────────────────────────── */}
        {esCredito && (
          <Card className="px-5 py-4 mb-6">
            <div className="flex justify-between text-xs text-stone-500 mb-2">
              <span className="font-medium text-stone-400">Progreso del crédito</span>
              <span>
                {credito.cuotasPagadas > 0 && credito.cuotasTotales > 0
                  ? `${credito.cuotasPagadas} de ${credito.cuotasTotales} cuotas`
                  : `${pctPagado.toFixed(1)}%`}
              </span>
            </div>
            <ProgressBar pct={pctPagado} />
            <div className="flex justify-between text-xs text-stone-600 mt-2">
              <span>{fmtLps(montoPagado)} pagado</span>
              <span className={saldoPendiente > 0 ? "text-amber-400/70" : "text-emerald-400/70"}>
                {fmtLps(saldoPendiente)} pendiente
              </span>
            </div>
          </Card>
        )}

        {/* ── Grid de 3 columnas ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna 1: Venta + Lote ─────────────────────────────── */}
          <div className="space-y-5">

            {/* Info de la venta */}
            <Card className="p-5">
              <SectionTitle>Venta</SectionTitle>
              <InfoRow label="Número"       value={`#${id}`} mono />
              <InfoRow label="Fecha"        value={fmtDate(venta.FechaVenta ?? venta.fecha_venta)} />
              <InfoRow
                label="Tipo"
                value={
                  <Badge variant={esCredito ? "info" : "success"}>
                    {venta.TipoVenta ?? venta.tipo_venta}
                  </Badge>
                }
              />
              <InfoRow
                label="Estado"
                value={
                  <Badge variant={estado === "Activo" ? "success" : estado === "Cancelado" ? "danger" : "default"}>
                    {estado}
                  </Badge>
                }
              />
              <InfoRow
                label="Cuenta"
                value={
                  <Badge variant={estadoCuenta === "Al día" ? "success" : estadoCuenta === "En mora" ? "danger" : "default"}>
                    {estadoCuenta}
                  </Badge>
                }
              />
            </Card>

            {/* Lote */}
            <Card className="p-5">
              <SectionTitle>Lote</SectionTitle>
              <InfoRow label="Código"      value={lote.codigo} mono />
              <InfoRow label="Bloque"      value={lote.bloque} />
              <InfoRow label="Etapa"       value={lote.etapa} />
              <InfoRow label="Proyecto"    value={lote.proyecto} />
              <InfoRow label="Área"        value={lote.areaVaras != null ? `${Number(lote.areaVaras).toLocaleString("es-HN")} v²` : null} />
              <InfoRow label="Precio / v²" value={fmtLps(lote.precioVara)} />
              <InfoRow label="Valor base"  value={fmtLps(lote.valorBase)} />
              <InfoRow label="Valor total" value={fmtLps(lote.valorLote)} accent />

              {/* Características del lote */}
              {(lote.esEsquina || lote.cercaParque || lote.calleCerrada || lote.frenteAvenida) && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stone-800">
                  {lote.esEsquina     && <Badge variant="warning">Esquina</Badge>}
                  {lote.cercaParque   && <Badge variant="info">Cerca de parque</Badge>}
                  {lote.calleCerrada  && <Badge variant="success">Calle cerrada</Badge>}
                  {lote.frenteAvenida && <Badge>Frente a avenida</Badge>}
                </div>
              )}
            </Card>

            {/* Cuenta bancaria asignada */}
            {cuenta.banco && (
              <Card className="p-5">
                <SectionTitle>Cuenta bancaria de la etapa</SectionTitle>
                <InfoRow label="Banco"   value={cuenta.banco} />
                <InfoRow label="Número"  value={cuenta.numero} mono />
                <InfoRow label="Titular" value={cuenta.titular} />
              </Card>
            )}
          </div>

          {/* ── Columna 2: Cliente + Financiamiento + Aval ──────────── */}
          <div className="space-y-5">

            {/* Cliente */}
            <Card className="p-5">
              <SectionTitle>Cliente</SectionTitle>

              {/* Avatar header */}
              <div className="flex items-center gap-3 pb-4 mb-1 border-b border-stone-800">
                <AvatarCircle nombre={cliente.nombre} apellido={cliente.apellido} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-100 truncate">
                    {cliente.nombre} {cliente.apellido}
                  </p>
                  <p className="text-xs text-stone-500 font-mono">{cliente.dni}</p>
                </div>
              </div>

              <InfoRow label="Teléfono"     value={cliente.telefono} />
              <InfoRow label="Correo"       value={cliente.correo} />
              <InfoRow label="Empresa"      value={cliente.empresa} />
              <InfoRow label="Ingreso mensual" value={fmtLps(cliente.ingreso)} />
              {cliente.departamento && (
                <InfoRow
                  label="Residencia"
                  value={`${cliente.municipio ?? ""}, ${cliente.departamento}`}
                />
              )}

              <div className="mt-3 pt-3 border-t border-stone-800 flex gap-2">
                <Link to={`/clientes/${cliente.id}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full justify-center">
                    Ver perfil
                  </Button>
                </Link>
                <Link to={`/clientes/${cliente.id}/editar`} className="flex-1">
                  <Button size="sm" variant="ghost" className="w-full justify-center">
                    Editar
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Financiamiento — solo crédito */}
            {esCredito && (
              <Card className="p-5">
                <SectionTitle>Financiamiento</SectionTitle>
                <InfoRow label="Monto financiado" value={fmtLps(credito.financiado)} accent />
                <InfoRow label="Prima"            value={fmtLps(credito.prima)} />
                <InfoRow label="Tasa de interés"  value={`${credito.tasa}% anual`} />
                <InfoRow label="Plazo"            value={`${credito.anios} años · ${credito.anios * 12} cuotas`} />
                <InfoRow label="Cuota mensual"    value={fmtLps(credito.cuotaMensual)} accent />
                {credito.cuotasTotales > 0 && (
                  <InfoRow
                    label="Avance cuotas"
                    value={`${credito.cuotasPagadas} / ${credito.cuotasTotales}`}
                  />
                )}
                <div className="pt-3 mt-1">
                  <ProgressBar
                    pct={credito.cuotasTotales > 0 ? (credito.cuotasPagadas / credito.cuotasTotales) * 100 : pctPagado}
                    colorClass="bg-blue-400"
                  />
                  <p className="text-[11px] text-stone-600 mt-1 text-right">
                    {credito.cuotasTotales > 0
                      ? `${credito.cuotasTotales - credito.cuotasPagadas} cuotas restantes`
                      : ""}
                  </p>
                </div>
              </Card>
            )}

            {/* Aval y beneficiario — solo crédito */}
            {esCredito && (aval.nombre || beneficiario.nombre) && (
              <Card className="p-5">
                {aval.nombre && (
                  <>
                    <SectionTitle>Aval</SectionTitle>
                    <div className="flex items-center gap-3 pb-3 mb-1 border-b border-stone-800">
                      <AvatarCircle nombre={aval.nombre} apellido={aval.apellido} />
                      <div>
                        <p className="text-sm font-medium text-stone-200">
                          {aval.nombre} {aval.apellido}
                        </p>
                        <p className="text-xs text-stone-500 font-mono">{aval.dni ?? "—"}</p>
                      </div>
                    </div>
                    <InfoRow label="Teléfono" value={aval.telefono} />
                  </>
                )}

                {beneficiario.nombre && (
                  <>
                    <SectionTitle className="mt-4">Beneficiario en caso de fallecimiento</SectionTitle>
                    <div className="mt-3">
                      <InfoRow label="Nombre"   value={beneficiario.nombre} />
                      <InfoRow label="DNI"      value={beneficiario.dni} mono />
                      <InfoRow label="Relación" value={beneficiario.relacion} />
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>

          {/* ── Columna 3: Resumen financiero + Acciones ──────────────── */}
          <div className="space-y-4">

            {/* Resumen financiero */}
            <Card className="p-5">
              <SectionTitle>Resumen financiero</SectionTitle>
              <div className="space-y-0">
                <InfoRow label="Valor del lote"   value={fmtLps(lote.valorLote)} />
                {esCredito && <InfoRow label="Prima"          value={fmtLps(credito.prima)} />}
                {esCredito && <InfoRow label="Monto financiado" value={fmtLps(credito.financiado)} />}
                <div className="h-px bg-stone-700 my-1" />
                <InfoRow label="Total de la venta" value={fmtLps(montoTotal)} accent />
                <InfoRow label="Pagado a la fecha" value={fmtLps(montoPagado)} />
                <div className="h-px bg-stone-700 my-1" />
                <InfoRow
                  label="Saldo pendiente"
                  value={
                    <span className={saldoPendiente > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {fmtLps(saldoPendiente)}
                    </span>
                  }
                />
              </div>

              {/* Mini barra */}
              <div className="mt-4">
                <ProgressBar pct={pctPagado} />
                <p className="text-[11px] text-stone-600 mt-1.5 text-center">
                  {pctPagado.toFixed(1)}% liquidado
                </p>
              </div>
            </Card>

            {/* Cuotas vencidas — alerta visible */}
            {cuotasVencidas > 0 && (
              <Card className="p-5 border-red-500/30 bg-red-500/5">
                <SectionTitle>Mora</SectionTitle>
                <div className="flex items-center gap-3">
                  <span className="text-3xl text-red-400">◎</span>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{cuotasVencidas}</p>
                    <p className="text-xs text-stone-500">
                      cuota{cuotasVencidas !== 1 ? "s" : ""} vencida{cuotasVencidas !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Link to={`/pagos/nuevo?ventaId=${id}`} className="block mt-3">
                  <Button variant="danger" className="w-full justify-center">
                    Registrar pago urgente
                  </Button>
                </Link>
              </Card>
            )}

            {/* Acciones */}
            <Card className="p-5">
              <SectionTitle>Acciones</SectionTitle>
              <div className="space-y-2">
                <Link to={`/pagos/nuevo?ventaId=${id}`} className="block">
                  <Button className="w-full justify-center">Registrar pago</Button>
                </Link>
                {esCredito && (
                  <Link to={`/ventas/${id}/plan-pagos`} className="block">
                    <Button variant="secondary" className="w-full justify-center">
                      Ver tabla de amortización
                    </Button>
                  </Link>
                )}
                <Link to={`/pagos?ventaId=${id}`} className="block">
                  <Button variant="ghost" className="w-full justify-center">
                    Historial de pagos
                  </Button>
                </Link>
                <Link to={`/lotes/${venta.LoteID ?? venta.lote_id}`} className="block">
                  <Button variant="ghost" className="w-full justify-center">
                    Ver lote
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Historial de pagos ─────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-stone-300">
              Historial de pagos
              {pagos.length > 0 && (
                <span className="ml-2 text-xs font-normal text-stone-500">
                  ({pagos.length} registro{pagos.length !== 1 ? "s" : ""})
                </span>
              )}
            </p>
            <Link to={`/pagos/nuevo?ventaId=${id}`}>
              <Button size="sm">+ Nuevo pago</Button>
            </Link>
          </div>

          <Card>
            {pagos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-stone-600">
                <span className="text-3xl mb-2">◎</span>
                <p className="text-sm">Sin pagos registrados aún</p>
                <Link to={`/pagos/nuevo?ventaId=${id}`} className="mt-3">
                  <Button size="sm" variant="secondary">Registrar primer pago</Button>
                </Link>
              </div>
            ) : (
              <DataTable columns={pagosCols} data={pagos} />
            )}
          </Card>
        </div>

      </PageContent>
    </div>
  );
}