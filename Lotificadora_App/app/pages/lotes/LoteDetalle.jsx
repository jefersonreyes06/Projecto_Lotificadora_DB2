import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { lotesApi } from "../../services/api";
import {
  PageHeader, PageContent, Card, Badge, Button, StatCard, Alert,
} from "../../components/ui";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN") : "—";

const ESTADO_COLOR = {
  Disponible: "success", Vendido: "danger", Reservado: "warning", "En proceso": "info",
};

function InfoRow({ label, value, accent }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-800/60 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${accent ? "text-amber-400" : "text-stone-200"}`}>{value ?? "—"}</span>
    </div>
  );
}

function CaracteristicaBadge({ label, activo, variant }) {
  if (!activo) return null;
  return <Badge variant={variant ?? "warning"}>{label}</Badge>;
}

export default function LoteDetalle() {
  const { id }        = useParams();
  const [lote, setLote]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    lotesApi.get(id)
      .then(setLote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div><PageHeader title="Lote" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando...</p></PageContent>
    </div>
  );

  if (error || !lote) return (
    <div><PageHeader title="Lote" />
      <PageContent><Alert variant="danger">{error ?? "Lote no encontrado"}</Alert></PageContent>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={`Lote ${lote.codigo_lote}`}
        subtitle={`Bloque ${lote.bloque} · ${lote.etapa} · ${lote.proyecto}`}
        actions={
          <div className="flex gap-2">
            {lote.estado === "Disponible" && (
              <Link to={`/ventas/nueva?loteId=${id}`}>
                <Button>Vender este lote</Button>
              </Link>
            )}
            <Link to={`/lotes/${id}/editar`}><Button variant="secondary">Editar</Button></Link>
            <Link to={`/bloques/${lote.bloque_id}`}><Button variant="ghost">← Bloque</Button></Link>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Valor del lote"
            value={fmtLps(lote.valor_total)}
            accent
            sub="fn_valor_lote — función escalar"
          />
          <StatCard label="Área"  value={`${Number(lote.area_m2 ?? 0).toLocaleString()} v²`} />
          <StatCard label="Precio / vara²" value={fmtLps(lote.precio_vara2)} sub="Precio de la etapa" />
          <StatCard
            label="Estado"
            value={lote.estado}
            sub={lote.fecha_venta ? `Vendido ${fmtDate(lote.fecha_venta)}` : ""}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info del lote */}
          <div className="space-y-5">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Identificación
              </p>
              <InfoRow label="Código"    value={lote.codigo_lote} />
              <InfoRow label="Bloque"    value={lote.bloque} />
              <InfoRow label="Etapa"     value={lote.etapa} />
              <InfoRow label="Proyecto"  value={lote.proyecto} />
              <InfoRow label="Estado"
                value={<Badge variant={ESTADO_COLOR[lote.estado] ?? "default"}>{lote.estado}</Badge>}
              />
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Dimensiones y valor
              </p>
              <InfoRow label="Área"           value={`${Number(lote.area_m2 ?? 0).toLocaleString()} v²`} />
              <InfoRow label="Frente (m)"     value={lote.frente_m} />
              <InfoRow label="Fondo (m)"      value={lote.fondo_m} />
              <InfoRow label="Precio / vara²" value={fmtLps(lote.precio_vara2)} />
              <InfoRow label="Incremento características" value={fmtLps(lote.incremento)} />
              <InfoRow label="Valor total"    value={fmtLps(lote.valor_total)} accent />
            </Card>

            {/* Características */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Características
              </p>
              <div className="flex flex-wrap gap-2">
                <CaracteristicaBadge label="Esquina"       activo={lote.es_esquina}    variant="warning" />
                <CaracteristicaBadge label="Cerca de parque" activo={lote.cerca_parque} variant="info" />
                <CaracteristicaBadge label="Calle cerrada" activo={lote.calle_cerrada}  variant="success" />
                <CaracteristicaBadge label="Vista al lago" activo={lote.vista_lago}     variant="info" />
                <CaracteristicaBadge label="Frente a avenida" activo={lote.frente_avenida} variant="warning" />
              </div>
              {!lote.es_esquina && !lote.cerca_parque && !lote.calle_cerrada && (
                <p className="text-xs text-stone-600 mt-2">Sin características especiales</p>
              )}
            </Card>
          </div>

          {/* Venta actual (si está vendido) */}
          <div className="lg:col-span-2 space-y-5">
            {lote.estado !== "Disponible" && lote.venta_id && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                    Venta activa
                  </p>
                  <Link to={`/ventas/${lote.venta_id}`}>
                    <Button size="sm" variant="secondary">Ver venta completa</Button>
                  </Link>
                </div>

                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-stone-800">
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-400">
                      {(lote.cliente_nombre?.[0] ?? "") + (lote.cliente_apellido?.[0] ?? "")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-200">{lote.cliente_nombre} {lote.cliente_apellido}</p>
                    <p className="text-xs text-stone-500">{lote.cliente_dni}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  <InfoRow label="Tipo de venta"  value={<Badge variant={lote.tipo_venta === "Contado" ? "success" : "info"}>{lote.tipo_venta}</Badge>} />
                  <InfoRow label="Fecha de venta" value={fmtDate(lote.fecha_venta)} />
                  <InfoRow label="Monto total"    value={fmtLps(lote.monto_total)} accent />
                  <InfoRow label="Monto pagado"   value={fmtLps(lote.monto_pagado)} />
                  {lote.tipo_venta === "Credito" && <>
                    <InfoRow label="Cuota mensual"  value={fmtLps(lote.cuota_mensual)} />
                    <InfoRow label="Cuotas vencidas" value={lote.cuotas_vencidas ?? 0} />
                  </>}
                </div>

                {lote.tipo_venta === "Credito" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                      <span>Progreso del crédito</span>
                      <span>
                        {lote.monto_total
                          ? Math.round(((lote.monto_pagado ?? 0) / lote.monto_total) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${lote.monto_total ? Math.min(100, ((lote.monto_pagado ?? 0) / lote.monto_total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Link to={`/pagos/nuevo?ventaId=${lote.venta_id}`}>
                    <Button size="sm">Registrar pago</Button>
                  </Link>
                  {lote.tipo_venta === "Credito" && (
                    <Link to={`/ventas/${lote.venta_id}/plan-pagos`}>
                      <Button size="sm" variant="secondary">Plan de pagos</Button>
                    </Link>
                  )}
                </div>
              </Card>
            )}

            {lote.estado === "Disponible" && (
              <Card className="p-8 text-center border-emerald-400/20 bg-emerald-400/5">
                <div className="text-4xl mb-3">◉</div>
                <p className="text-lg font-semibold text-emerald-400 mb-1">Lote disponible</p>
                <p className="text-sm text-stone-400 mb-4">
                  Este lote está listo para ser vendido a un cliente.
                </p>
                <Link to={`/ventas/nueva?loteId=${id}`}>
                  <Button className="mx-auto">Iniciar proceso de venta</Button>
                </Link>
              </Card>
            )}

            {/* Notas */}
            {lote.notas && (
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Notas</p>
                <p className="text-sm text-stone-300 leading-relaxed">{lote.notas}</p>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
}
