import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { etapasApi, bloquesApi } from "../../services/api";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, StatCard, Alert,
} from "../../components/ui";

const fmtLps = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-800/60 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-200 font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default function EtapaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [etapa,   setEtapa]   = useState(null);
  const [bloques, setBloques] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      etapasApi.get(id),
      bloquesApi.list(id),
      etapasApi.cuentas(id),
    ])
      .then(([e, b, c]) => { setEtapa(e); setBloques(b); setCuentas(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const bloquesCols = [
    { key: "codigo",         label: "Código" },
    { key: "total_lotes",    label: "Lotes",        render: (v) => <Badge>{v}</Badge> },
    { key: "lotes_disponibles", label: "Disponibles", render: (v) => <Badge variant="success">{v}</Badge> },
    { key: "lotes_vendidos",    label: "Vendidos",    render: (v) => <Badge variant="danger">{v}</Badge> },
    { key: "area_total",     label: "Área total v²", render: (v) => Number(v ?? 0).toLocaleString("es-HN") },
    { key: "id", label: "", width: 110,
      render: (bid) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Link to={`/bloques/${bid}`}><Button size="sm" variant="ghost">Detalle</Button></Link>
        </div>
      ),
    },
  ];

  if (loading) return (
    <div>
      <PageHeader title="Etapa" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando...</p></PageContent>
    </div>
  );

  if (error || !etapa) return (
    <div>
      <PageHeader title="Etapa" />
      <PageContent><Alert variant="danger">{error ?? "Etapa no encontrada"}</Alert></PageContent>
    </div>
  );

  const pctVendido = etapa.total_lotes
    ? Math.round(((etapa.lotes_vendidos ?? 0) / etapa.total_lotes) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={etapa.nombre}
        subtitle={`${etapa.proyecto} · sp_etapas_obtener @id=${id}`}
        actions={
          <div className="flex gap-2">
            <Link to={`/etapas/${id}/editar`}><Button variant="secondary">Editar</Button></Link>
            <Link to={`/proyectos/${etapa.proyecto_id}`}><Button variant="ghost">Ver proyecto</Button></Link>
            <Link to="/etapas"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total lotes"     value={etapa.total_lotes ?? 0} />
          <StatCard label="Disponibles"     value={etapa.lotes_disponibles ?? 0} accent />
          <StatCard label="Vendidos"        value={etapa.lotes_vendidos ?? 0} />
          <StatCard label="Precio / vara²"  value={fmtLps(etapa.precio_vara2)} />
        </div>

        {/* Progreso */}
        <Card className="px-5 py-4 mb-6">
          <div className="flex justify-between text-xs text-stone-500 mb-2">
            <span>Ventas de la etapa</span>
            <span>{pctVendido}% vendido</span>
          </div>
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pctVendido}%` }} />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info */}
          <div className="space-y-5">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Configuración</p>
              <InfoRow label="Proyecto"         value={etapa.proyecto} />
              <InfoRow label="Precio por vara²" value={fmtLps(etapa.precio_vara2)} />
              <InfoRow label="Tasa de interés"  value={`${etapa.tasa_interes}% anual`} />
              <InfoRow label="Límite financ."   value={`${etapa.limite_anios ?? "—"} años`} />
              <InfoRow label="Bloques"          value={bloques.length} />
            </Card>

            {/* Áreas */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Áreas</p>
              <InfoRow label="Área total"       value={etapa.area_total_m2 ? `${Number(etapa.area_total_m2).toLocaleString()} v²` : "—"} />
              <InfoRow label="Área lotificable" value={etapa.area_lotificable ? `${Number(etapa.area_lotificable).toLocaleString()} v²` : "—"} />
              <InfoRow label="Áreas verdes"     value={etapa.area_verde ? `${Number(etapa.area_verde).toLocaleString()} v²` : "—"} />
              <InfoRow label="Áreas comunes"    value={etapa.area_comun ? `${Number(etapa.area_comun).toLocaleString()} v²` : "—"} />
            </Card>

            {/* Cuentas bancarias */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Cuentas bancarias</p>
              {cuentas.length === 0 ? (
                <p className="text-xs text-stone-600">Sin cuentas asignadas</p>
              ) : (
                <div className="space-y-3">
                  {cuentas.map((c) => (
                    <div key={c.id} className="text-sm">
                      <p className="text-stone-200 font-medium">{c.banco}</p>
                      <p className="text-stone-500 font-mono text-xs">{c.numero_cuenta}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge>{c.tipo_cuenta}</Badge>
                        <Badge variant={c.estado === "Activa" ? "success" : "default"}>{c.estado}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-stone-800">
                <Link to="/cuentas">
                  <Button size="sm" variant="ghost" className="w-full justify-center">Gestionar cuentas</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Bloques */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-stone-300">Bloques de la etapa</p>
              <Link to={`/bloques?etapaId=${id}`}>
                <Button size="sm" variant="secondary">+ Añadir bloque</Button>
              </Link>
            </div>

            {/* Cards de bloques */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {bloques.map((b) => {
                const pct = b.total_lotes ? Math.round((b.lotes_disponibles / b.total_lotes) * 100) : 0;
                return (
                  <Card key={b.id}
                    className="p-4 cursor-pointer hover:border-stone-600 transition-colors"
                    onClick={() => navigate(`/bloques/${b.id}`)}>
                    <p className="font-semibold text-stone-200 text-lg mb-1">{b.codigo}</p>
                    <div className="flex gap-1.5 mb-2">
                      <Badge variant="success" >{b.lotes_disponibles} disp.</Badge>
                      <Badge variant="danger">{b.lotes_vendidos} vend.</Badge>
                    </div>
                    <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400/50 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-stone-600 mt-1">{b.total_lotes} lotes · {pct}% disponible</p>
                  </Card>
                );
              })}
              {bloques.length === 0 && (
                <div className="col-span-3">
                  <Card className="p-8 text-center text-stone-600">
                    <p className="text-2xl mb-2">▦</p>
                    <p className="text-sm">Sin bloques registrados</p>
                  </Card>
                </div>
              )}
            </div>

            {bloques.length > 0 && (
              <>
                <p className="text-xs text-stone-500 mb-2 uppercase tracking-widest font-semibold">Tabla de bloques</p>
                <Card>
                  <DataTable columns={bloquesCols} data={bloques} onRowClick={(r) => navigate(`/bloques/${r.id}`)} />
                </Card>
              </>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
}
