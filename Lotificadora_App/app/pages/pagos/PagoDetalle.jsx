import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { pagosApi } from "../../services/api";
import { PageHeader, PageContent, Card, Badge, Button, Alert } from "../../components/ui";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" }) : "—";

function Row({ label, value, bold, accent }) {
  return (
    <div className={`flex justify-between py-2.5 border-b border-stone-800/50 last:border-0 text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-stone-400">{label}</span>
      <span className={accent ? "text-amber-400" : "text-stone-200"}>{value ?? "—"}</span>
    </div>
  );
}

export default function PagoDetalle() {
  const { id }          = useParams();
  const [pago, setPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    pagosApi.factura(id)
      .then(setPago)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div>
      <PageHeader title="Factura" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando factura...</p></PageContent>
    </div>
  );

  if (error || !pago) return (
    <div>
      <PageHeader title="Factura" />
      <PageContent><Alert variant="danger">{error ?? "Factura no encontrada"}</Alert></PageContent>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={`Factura #${pago.factura_id ?? id}`}
        subtitle="Comprobante de pago — Proyectos Habitacionales"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
            <Link to="/pagos"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />
      <PageContent>
        <div className="max-w-2xl">
          <Card className="p-8">
            {/* Encabezado de factura */}
            <div className="flex justify-between items-start pb-6 border-b border-stone-800 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-amber-400 rounded-sm flex items-center justify-center">
                    <span className="text-stone-950 font-bold text-xs">PH</span>
                  </div>
                  <p className="font-semibold text-stone-100">Proyectos Habitacionales</p>
                </div>
                <p className="text-xs text-stone-500">Sistema de Lotificación</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Factura</p>
                <p className="text-2xl font-bold text-amber-400">#{pago.factura_id ?? id}</p>
                <p className="text-xs text-stone-500 mt-1">{fmtDate(pago.fecha_pago)}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-stone-800 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Pagado por</p>
                <p className="text-stone-100 font-medium">{pago.cliente_nombre} {pago.cliente_apellido}</p>
                <p className="text-sm text-stone-400">{pago.cliente_dni}</p>
                <p className="text-sm text-stone-400">{pago.cliente_telefono}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Lote</p>
                <p className="text-stone-100 font-medium">{pago.lote_codigo}</p>
                <p className="text-sm text-stone-400">{pago.etapa} · {pago.proyecto}</p>
              </div>
            </div>

            {/* Detalle del pago */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Detalle</p>
              <Row label="Tipo de pago"       value={pago.tipo_pago} />
              {pago.referencia_banco && <Row label="Referencia bancaria" value={pago.referencia_banco} />}
              {pago.cuotas && (
                <div className="mt-2 mb-2">
                  <p className="text-xs text-stone-500 mb-1.5">Cuotas canceladas:</p>
                  <div className="space-y-1">
                    {pago.cuotas.map((c) => (
                      <div key={c.numero} className="flex justify-between text-sm bg-stone-800/50 rounded px-3 py-1.5">
                        <span className="text-stone-400">Cuota #{c.numero} · Venc. {fmtDate(c.fecha_vencimiento)}</span>
                        <span className="text-stone-200">{fmtLps(c.cuota_total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desglose capital / interés */}
            <div className="bg-stone-800/40 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Desglose</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Capital</span>
                  <span className="text-blue-400 font-medium">{fmtLps(pago.capital)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Interés</span>
                  <span className="text-amber-400 font-medium">{fmtLps(pago.interes)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-stone-700 pt-2 mt-2 font-semibold">
                  <span className="text-stone-200">Total pagado</span>
                  <span className="text-emerald-400 text-base">{fmtLps(pago.monto_pagado)}</span>
                </div>
              </div>
            </div>

            {/* Saldo tras pago */}
            <div className="flex justify-between items-center py-3 border-t border-stone-700">
              <span className="text-sm text-stone-400">Saldo restante tras este pago</span>
              <span className="text-stone-300 font-medium">{fmtLps(pago.saldo_restante)}</span>
            </div>

            {/* Estado */}
            <div className="flex justify-center mt-6">
              <Badge variant="success" className="text-sm px-4 py-1.5">✓ Pago registrado y procesado</Badge>
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-4">
            <Link to={`/ventas/${pago.venta_id}`}>
              <Button variant="secondary">Ver venta</Button>
            </Link>
            <Link to={`/ventas/${pago.venta_id}/plan-pagos`}>
              <Button variant="ghost">Ver plan de pagos</Button>
            </Link>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
