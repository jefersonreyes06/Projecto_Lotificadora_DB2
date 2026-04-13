import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { bloquesApi, lotesApi } from "../../services/api";
import { notify, useNotifyError } from "../../utils/notify";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, StatCard, Alert,
} from "../../components/ui";

const fmtLps = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

const ESTADO_COLOR   = { Disponible: "success", Vendido: "danger", Reservado: "warning", "En proceso": "info" };
const ESTADO_BG      = { Disponible: "#22c55e22", Vendido: "#ef444422", Reservado: "#f59e0b22", "En proceso": "#3b82f622" };
const ESTADO_BORDER  = { Disponible: "#22c55e55", Vendido: "#ef444455", Reservado: "#f59e0b55", "En proceso": "#3b82f655" };

function LoteGridCard({ lote, onClick }) {
  return (
    <button
      onClick={() => onClick(lote)}
      className="text-left p-3 rounded-lg border transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: ESTADO_BG[lote.estado] ?? "#ffffff08",
        borderColor: ESTADO_BORDER[lote.estado] ?? "#ffffff20",
      }}
    >
      <p className="text-xs font-bold text-stone-200">{lote.codigo_lote}</p>
      <p className="text-xs text-stone-500 mt-0.5">{Number(lote.area_m2).toLocaleString()} v²</p>
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {lote.es_esquina   && <span className="text-[10px] text-amber-400">ESQ</span>}
        {lote.cerca_parque && <span className="text-[10px] text-blue-400">PQ</span>}
      </div>
      <p className="text-xs text-stone-400 mt-1">{fmtLps(lote.valor_total)}</p>
    </button>
  );
}

function LoteModal({ lote, onClose }) {
  if (!lote) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-stone-100">Lote {lote.codigo_lote}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">✕</button>
        </div>
        <div className="space-y-2.5 text-sm mb-4">
          {[
            ["Estado",    <Badge key="e" variant={ESTADO_COLOR[lote.estado] ?? "default"}>{lote.estado}</Badge>],
            ["Área",      `${Number(lote.area_m2).toLocaleString()} v²`],
            ["Valor",     <span key="v" className="text-amber-400 font-semibold">{fmtLps(lote.valor_total)}</span>],
            ["Esquina",   lote.es_esquina ? "Sí" : "No"],
            ["Pq. cercano", lote.cerca_parque ? "Sí" : "No"],
            ["C. cerrada", lote.calle_cerrada ? "Sí" : "No"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-stone-500">{label}</span>
              <span className="text-stone-200">{val}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Link to={`/lotes/${lote.id}/editar`} className="flex-1">
            <button className="w-full py-2 text-sm bg-stone-800 border border-stone-700 rounded-md text-stone-200 hover:bg-stone-700 transition-colors">
              Editar
            </button>
          </Link>
          {lote.estado === "Disponible" && (
            <Link to={`/ventas/nueva?loteId=${lote.id}`} className="flex-1">
              <button className="w-full py-2 text-sm bg-amber-400 rounded-md text-stone-950 font-medium hover:bg-amber-300 transition-colors">
                Vender
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BloqueDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bloque,  setBloque]  = useState(null);
  const [lotes,   setLotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [vista,   setVista]   = useState("grid"); // "grid" | "tabla"
  const [loteModal, setLoteModal] = useState(null);

  useEffect(() => {
    Promise.all([bloquesApi.get(id), lotesApi.list(id)])
      .then(([b, l]) => { setBloque(b); setLotes(l); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const tablaCols = [
    { key: "codigo_lote", label: "Código" },
    { key: "area_m2",     label: "Área v²", render: (v) => Number(v).toLocaleString("es-HN") },
    { key: "es_esquina",  label: "Esquina", render: (v) => v ? <Badge variant="warning">Sí</Badge> : "—" },
    { key: "cerca_parque",label: "Parque",  render: (v) => v ? <Badge variant="info">Sí</Badge> : "—" },
    { key: "estado",      label: "Estado",  render: (v) => <Badge variant={ESTADO_COLOR[v] ?? "default"}>{v}</Badge> },
    { key: "valor_total", label: "Valor",   render: (v) => <span className="text-amber-400">{fmtLps(v)}</span> },
    { key: "id", label: "", width: 100,
      render: (lid, row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Link to={`/lotes/${lid}/editar`}><Button size="sm" variant="ghost">Editar</Button></Link>
        </div>
      ),
    },
  ];

  if (loading) return (
    <div><PageHeader title="Bloque" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando...</p></PageContent>
    </div>
  );

  if (error || !bloque) return (
    <div><PageHeader title="Bloque" />
      <PageContent><Alert variant="danger">{error ?? "Bloque no encontrado"}</Alert></PageContent>
    </div>
  );

  const disponibles = lotes.filter((l) => l.estado === "Disponible").length;
  const vendidos    = lotes.filter((l) => l.estado === "Vendido").length;
  const reservados  = lotes.filter((l) => l.estado === "Reservado").length;

  return (
    <div>
      <PageHeader
        title={`Bloque ${bloque.codigo}`}
        subtitle={`${bloque.etapa} · ${bloque.proyecto}`}
        actions={
          <div className="flex gap-2">
            <Link to={`/etapas/${bloque.etapa_id}`}><Button variant="ghost">Ver etapa</Button></Link>
            <Link to="/bloques"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total lotes"  value={lotes.length} />
          <StatCard label="Disponibles" value={disponibles} accent />
          <StatCard label="Vendidos"    value={vendidos} />
          <StatCard label="Reservados"  value={reservados} />
        </div>

        {/* Leyenda + controles */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-4 text-xs">
            {Object.entries(ESTADO_COLOR).map(([estado, variant]) => (
              <span key={estado} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ESTADO_BG[estado], border: `1px solid ${ESTADO_BORDER[estado]}` }} />
                <span className="text-stone-400">{estado}</span>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={vista === "grid" ? "primary" : "secondary"} onClick={() => setVista("grid")}>
              ▦ Grid
            </Button>
            <Button size="sm" variant={vista === "tabla" ? "primary" : "secondary"} onClick={() => setVista("tabla")}>
              ≡ Tabla
            </Button>
            <Link to="/lotes/nuevo">
              <Button size="sm">+ Lote</Button>
            </Link>
          </div>
        </div>

        {vista === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {lotes.map((l) => (
              <LoteGridCard key={l.id} lote={l} onClick={setLoteModal} />
            ))}
            {lotes.length === 0 && (
              <div className="col-span-full">
                <Card className="p-10 text-center text-stone-600">
                  <p className="text-3xl mb-2">▣</p>
                  <p className="text-sm">Sin lotes registrados en este bloque</p>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <DataTable
              columns={tablaCols}
              data={lotes}
              onRowClick={(row) => setLoteModal(row)}
            />
          </Card>
        )}
      </PageContent>

      <LoteModal lote={loteModal} onClose={() => setLoteModal(null)} />
    </div>
  );
}
