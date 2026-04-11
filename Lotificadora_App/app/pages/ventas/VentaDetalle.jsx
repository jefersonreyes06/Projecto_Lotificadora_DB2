import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ventasApi, pagosApi } from "../../services/api";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, Alert, StatCard,
} from "../../components/index";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN") : "—";

function InfoRow({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-stone-800/60 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className={`text-sm font-medium ${accent ? "text-amber-400" : "text-stone-200"}`}>{value ?? "—"}</span>
    </div>
  );
}

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta,   setVenta]   = useState(null);
  const [pagos,   setPagos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      ventasApi.get(id),
      pagosApi.list(id),
    ])
      .then(([v, p]) => { setVenta(v); setPagos(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const pagosCols = [
    { key: "id",          label: "#", width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
    { key: "fecha_pago",  label: "Fecha",   render: fmtDate },
    { key: "tipo_pago",   label: "Tipo",    render: (v) => <Badge variant={v === "Efectivo" ? "success" : "info"}>{v}</Badge> },
    { key: "monto_pagado",label: "Monto",   render: (v) => <span className="text-emerald-400">{fmtLps(v)}</span> },
    { key: "capital",     label: "Capital", render: (v) => <span className="text-blue-400">{fmtLps(v)}</span> },
    { key: "interes",     label: "Interés", render: (v) => <span className="text-amber-400">{fmtLps(v)}</span> },
    { key: "factura_id",  label: "Factura", render: (v) => v ? <Badge variant="default">#{v}</Badge> : "—" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Detalle de venta" />
        <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando...</p></PageContent>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div>
        <PageHeader title="Detalle de venta" />
        <PageContent><Alert variant="danger">{error ?? "Venta no encontrada"}</Alert></PageContent>
      </div>
    );
  }

  const pctPagado = venta.monto_total
    ? Math.min(100, ((venta.monto_pagado ?? 0) / venta.monto_total) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Venta #${id}`}
        subtitle={`sp_ventas_obtener @id=${id}`}
        actions={
          <div className="flex gap-2">
            {venta.tipo_venta === "Credito" && (
              <Link to={`/ventas/${id}/plan-pagos`}>
                <Button variant="secondary">Ver plan de pagos</Button>
              </Link>
            )}
            <Link to="/ventas"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>
        {/* Stats superiores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Monto total"    value={fmtLps(venta.monto_total)} accent />
          <StatCard label="Monto pagado"   value={fmtLps(venta.monto_pagado)} sub={`${pctPagado.toFixed(1)}% completado`} />
          <StatCard label="Saldo pendiente" value={fmtLps((venta.monto_total ?? 0) - (venta.monto_pagado ?? 0))} />
          <StatCard label="Cuotas vencidas" value={venta.cuotas_vencidas ?? 0} sub={venta.cuotas_vencidas > 0 ? "En mora" : "Al día"} />
        </div>

        {/* Barra de progreso del crédito */}
        {venta.tipo_venta === "Credito" && (
          <Card className="px-5 py-4 mb-6">
            <div className="flex justify-between text-xs text-stone-500 mb-2">
              <span>Progreso del crédito</span>
              <span>{pctPagado.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${pctPagado}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-600 mt-1.5">
              <span>{fmtLps(venta.monto_pagado)} pagado</span>
              <span>{fmtLps((venta.monto_total ?? 0) - (venta.monto_pagado ?? 0))} pendiente</span>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-5">
            {/* Info de la venta */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Información de la venta
              </p>
              <InfoRow label="Fecha de venta"   value={fmtDate(venta.fecha_venta)} />
              <InfoRow label="Tipo de venta"    value={<Badge variant={venta.tipo_venta === "Contado" ? "success" : "info"}>{venta.tipo_venta}</Badge>} />
              <InfoRow label="Estado"           value={<Badge variant={venta.estado === "Activo" ? "success" : "danger"}>{venta.estado}</Badge>} />
              {venta.tipo_venta === "Credito" && <>
                <InfoRow label="Prima pagada"   value={fmtLps(venta.prima)} />
                <InfoRow label="Monto financiado" value={fmtLps(venta.monto_financiado)} accent />
                <InfoRow label="Tasa de interés"  value={`${venta.tasa_interes ?? 0}% anual`} />
                <InfoRow label="Plazo"            value={`${venta.anios_financiamiento ?? 0} años`} />
                <InfoRow label="Cuota mensual"    value={fmtLps(venta.cuota_mensual)} accent />
              </>}
            </Card>

            {/* Info del lote */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Lote
              </p>
              <InfoRow label="Código"    value={venta.lote_codigo} />
              <InfoRow label="Bloque"    value={venta.bloque} />
              <InfoRow label="Etapa"     value={venta.etapa} />
              <InfoRow label="Proyecto"  value={venta.proyecto} />
              <InfoRow label="Área"      value={venta.area_m2 ? `${venta.area_m2} v²` : "—"} />
              <InfoRow label="Valor lote" value={fmtLps(venta.valor_lote)} accent />
              <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-stone-800">
                {venta.es_esquina    && <Badge variant="warning">Esquina</Badge>}
                {venta.cerca_parque  && <Badge variant="info">Cerca de parque</Badge>}
                {venta.calle_cerrada && <Badge variant="success">Calle cerrada</Badge>}
              </div>
            </Card>
          </div>

          {/* Columna centro */}
          <div className="space-y-5">
            {/* Info del cliente */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Cliente
              </p>
              <div className="flex items-center gap-3 pb-4 mb-3 border-b border-stone-800">
                <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-400">
                    {(venta.cliente_nombre?.[0] ?? "") + (venta.cliente_apellido?.[0] ?? "")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-200">
                    {venta.cliente_nombre} {venta.cliente_apellido}
                  </p>
                  <p className="text-xs text-stone-500">{venta.cliente_dni}</p>
                </div>
              </div>
              <InfoRow label="Teléfono"  value={venta.cliente_telefono} />
              <InfoRow label="Correo"    value={venta.cliente_correo} />
              <InfoRow label="Empresa"   value={venta.cliente_empresa} />
              <InfoRow label="Ingreso"   value={venta.cliente_ingreso ? fmtLps(venta.cliente_ingreso) : "—"} />
              <div className="mt-3 pt-3 border-t border-stone-800">
                <Link to={`/clientes/${venta.cliente_id}/editar`}>
                  <Button size="sm" variant="secondary" className="w-full justify-center">
                    Ver perfil completo
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Aval y beneficiario — solo crédito */}
            {venta.tipo_venta === "Credito" && (
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                  Aval
                </p>
                <InfoRow label="Nombre"   value={`${venta.aval_nombre ?? "—"} ${venta.aval_apellido ?? ""}`} />
                <InfoRow label="DNI"      value={venta.aval_dni} />
                <InfoRow label="Teléfono" value={venta.aval_telefono} />

                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mt-4 mb-3">
                  Beneficiario
                </p>
                <InfoRow label="Nombre"    value={venta.beneficiario_nombre} />
                <InfoRow label="DNI"       value={venta.beneficiario_dni} />
                <InfoRow label="Relación"  value={venta.beneficiario_relacion} />
              </Card>
            )}
          </div>

          {/* Columna derecha — acciones */}
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
                Acciones rápidas
              </p>
              <div className="space-y-2">
                <Link to={`/pagos/nuevo?ventaId=${id}`} className="block">
                  <Button className="w-full justify-center">Registrar pago</Button>
                </Link>
                {venta.tipo_venta === "Credito" && (
                  <Link to={`/ventas/${id}/plan-pagos`} className="block">
                    <Button variant="secondary" className="w-full justify-center">
                      Ver amortización
                    </Button>
                  </Link>
                )}
                <Link to={`/pagos?ventaId=${id}`} className="block">
                  <Button variant="ghost" className="w-full justify-center">
                    Historial de pagos
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Cuenta bancaria asignada */}
            {venta.cuenta_banco && (
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                  Cuenta bancaria de etapa
                </p>
                <InfoRow label="Banco"   value={venta.cuenta_banco} />
                <InfoRow label="Número"  value={venta.cuenta_numero} />
                <InfoRow label="Titular" value={venta.cuenta_titular} />
              </Card>
            )}
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-stone-300 mb-3">
            Historial de pagos recibidos
          </p>
          <Card>
            <DataTable columns={pagosCols} data={pagos} loading={false} />
          </Card>
        </div>
      </PageContent>
    </div>
  );
}
