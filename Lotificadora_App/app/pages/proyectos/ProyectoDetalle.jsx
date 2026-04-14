import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { proyectosApi, etapasApi } from "../../services/api";
import { notify, useNotifyError } from "../../utils/notify";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, StatCard, Alert,
} from "../../components/ui";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-800/60 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-200 font-medium text-right max-w-xs">{value ?? "—"}</span>
    </div>
  );
}

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [etapas,   setEtapas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useNotifyError(error);

  useEffect(() => {
    Promise.all([proyectosApi.get(id), etapasApi.list(id)])
      .then(([p, e]) => { setProyecto(p); setEtapas(e); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const etapasCols = [
    { key: "nombre",        label: "Etapa" },
    { key: "precio_vara2",  label: "Precio v²", render: (v) => fmtLps(v) },
    { key: "tasa_interes",  label: "Tasa %",    render: (v) => `${v}%` },
    { key: "total_lotes",   label: "Lotes",     render: (v) => <Badge>{v}</Badge> },
    { key: "lotes_disponibles", label: "Disponibles", render: (v) => <Badge variant="success">{v}</Badge> },
    { key: "lotes_vendidos",    label: "Vendidos",    render: (v) => <Badge variant="danger">{v}</Badge> },
    { key: "id", label: "", width: 130,
      render: (eid) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Link to={`/etapas/${eid}`}><Button size="sm" variant="ghost">Detalle</Button></Link>
          <Link to={`/etapas/${eid}/editar`}><Button size="sm" variant="ghost">Editar</Button></Link>
        </div>
      ),
    },
  ];

  if (loading) return (
    <div>
      <PageHeader title="Proyecto" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando...</p></PageContent>
    </div>
  );

  if (error || !proyecto) return (
    <div>
      <PageHeader title="Proyecto" />
      <PageContent><Alert variant="danger">{error ?? "Proyecto no encontrado"}</Alert></PageContent>
    </div>
  );

  const pctVendido = proyecto.total_lotes
    ? Math.round((proyecto.lotes_vendidos / proyecto.total_lotes) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={proyecto.nombre}
        subtitle={`${proyecto.departamento}, ${proyecto.municipio} · sp_proyectos_obtener`}
        actions={
          <div className="flex gap-2">
            <Link to={`/proyectos/${id}/editar`}><Button variant="secondary">Editar proyecto</Button></Link>
            <Link to="/proyectos"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total lotes"    value={proyecto.total_lotes ?? 0} />
          <StatCard label="Disponibles"    value={proyecto.lotes_disponibles ?? 0} accent />
          <StatCard label="Vendidos"       value={proyecto.lotes_vendidos ?? 0} />
          <StatCard label="Ingresos total" value={fmtLps(proyecto.ingresos_total)} />
        </div>

        {/* Barra de ventas */}
        <Card className="px-5 py-4 mb-6">
          <div className="flex justify-between text-xs text-stone-500 mb-2">
            <span>Progreso de ventas</span>
            <span>{pctVendido}% lotes vendidos</span>
          </div>
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pctVendido}%` }} />
          </div>
          <div className="flex justify-between text-xs text-stone-600 mt-1.5">
            <span>{proyecto.lotes_vendidos} vendidos</span>
            <span>{proyecto.lotes_disponibles} disponibles</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info del proyecto */}
          <div className="space-y-5">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Información general</p>
              <InfoRow label="Nombre"       value={proyecto.nombre} />
              <InfoRow label="Departamento" value={proyecto.departamento} />
              <InfoRow label="Municipio"    value={proyecto.municipio} />
              <InfoRow label="Ubicación"    value={proyecto.ubicacion} />
              <InfoRow label="Etapas"       value={etapas.length} />
              <InfoRow label="Límite financ." value={`${proyecto.limite_anios_financiamiento} años`} />
              <InfoRow label="Estado"
                value={<Badge variant={proyecto.estado === "Activo" ? "success" : "default"}>{proyecto.estado}</Badge>} />
            </Card>

            {proyecto.descripcion && (
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Descripción</p>
                <p className="text-sm text-stone-300 leading-relaxed">{proyecto.descripcion}</p>
              </Card>
            )}

            {/* Acciones */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Acciones</p>
              <div className="space-y-2">
                <Link to={`/etapas/nueva?proyectoId=${id}`} className="block">
                  <Button variant="secondary" className="w-full justify-center">+ Añadir etapa</Button>
                </Link>
                <Link to={`/lotes/disponibles?proyectoId=${id}`} className="block">
                  <Button variant="ghost" className="w-full justify-center">Ver lotes disponibles</Button>
                </Link>
                <Link to={`/reportes/funciones?proyectoId=${id}`} className="block">
                  <Button variant="ghost" className="w-full justify-center">Clientes del proyecto</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Etapas */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-stone-300">Etapas del proyecto</p>
              <Link to={`/etapas/nueva?proyectoId=${id}`}>
                <Button size="sm">+ Nueva etapa</Button>
              </Link>
            </div>

            {/* Cards de etapas */}
            <div className="space-y-3 mb-6">
              {etapas.map((e) => {
                const pct = e.total_lotes ? Math.round((e.lotes_disponibles / e.total_lotes) * 100) : 0;
                return (
                  <Card key={e.id} className="p-4 hover:border-stone-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/etapas/${e.id}`)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-stone-200">{e.nombre}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {fmtLps(e.precio_vara2)} / v² · {e.tasa_interes}% anual
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success">{e.lotes_disponibles} disp.</Badge>
                        <Badge variant="danger">{e.lotes_vendidos} vend.</Badge>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-stone-600 mt-1">{pct}% disponible</p>
                  </Card>
                );
              })}
              {etapas.length === 0 && (
                <Card className="p-8 text-center text-stone-600">
                  <p className="text-2xl mb-2">◫</p>
                  <p className="text-sm">Sin etapas registradas</p>
                </Card>
              )}
            </div>

            {/* Tabla detallada */}
            {etapas.length > 0 && (
              <>
                <p className="text-xs text-stone-500 mb-2 uppercase tracking-widest font-semibold">Tabla de etapas</p>
                <Card>
                  <DataTable
                    columns={etapasCols}
                    data={etapas}
                    onRowClick={(row) => navigate(`/etapas/${row.id}`)}
                  />
                </Card>
              </>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
}
