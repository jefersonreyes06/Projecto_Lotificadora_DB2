import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ventasApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, DataTable, Badge, Card, Input, Select, FormField,
} from "../../components/index";

const TIPO_COLORS = { Contado: "success", Credito: "info" };
const ESTADO_COLORS = { Activo: "success", Cancelado: "danger", "Al día": "success", "En mora": "danger", "Pagado": "default" };

export default function VentasList() {
  const [data, setData]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [tipoFiltro, setTipo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    ventasApi.list()
      .then((d) => { setData(d); setFiltered(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let d = data;
    if (search) d = d.filter((r) =>
      `${r.cliente} ${r.lote} ${r.id}`.toLowerCase().includes(search.toLowerCase())
    );
    if (tipoFiltro) d = d.filter((r) => r.tipo_venta === tipoFiltro);
    setFiltered(d);
  }, [search, tipoFiltro, data]);

  const columns = [
    { key: "id",           label: "#",        width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
    { key: "cliente",      label: "Cliente" },
    { key: "lote",         label: "Lote" },
    { key: "fecha_venta",  label: "Fecha", render: (v) => new Date(v).toLocaleDateString("es-HN") },
    { key: "tipo_venta",   label: "Tipo",  render: (v) => <Badge variant={TIPO_COLORS[v] ?? "default"}>{v}</Badge> },
    { key: "monto_total",  label: "Monto",
      render: (v) => <span className="text-amber-400 font-medium">L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span> },
    { key: "cuotas_pendientes", label: "Cuotas pend.",
      render: (v) => <span className={v > 0 ? "text-red-400" : "text-stone-500"}>{v ?? "—"}</span> },
    { key: "estado_cuenta", label: "Estado",
      render: (v) => <Badge variant={ESTADO_COLORS[v] ?? "default"}>{v ?? "—"}</Badge> },
    { key: "id", label: "", width: 130,
      render: (id, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/ventas/${id}`}><Button size="sm" variant="ghost">Detalle</Button></Link>
          {row.tipo_venta === "Credito" && (
            <Link to={`/ventas/${id}/plan-pagos`}><Button size="sm" variant="ghost">Plan</Button></Link>
          )}
        </div>
      ),
    },
  ];

  const totales = {
    total:   data.length,
    contado: data.filter((d) => d.tipo_venta === "Contado").length,
    credito: data.filter((d) => d.tipo_venta === "Credito").length,
    mora:    data.filter((d) => d.estado_cuenta === "En mora").length,
  };

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="sp_ventas_listar — procesamiento en servidor"
        actions={<Link to="/ventas/nueva"><Button>+ Nueva venta</Button></Link>}
      />
      <PageContent>
        {/* Stats rápidas */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total ventas",   value: totales.total,   color: "" },
            { label: "Contado",        value: totales.contado, color: "text-emerald-400" },
            { label: "Crédito",        value: totales.credito, color: "text-blue-400" },
            { label: "En mora",        value: totales.mora,    color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="px-4 py-3">
              <p className="text-xs text-stone-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-semibold mt-0.5 ${s.color || "text-stone-100"}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Buscar por cliente, lote o #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={tipoFiltro} onChange={(e) => setTipo(e.target.value)} className="w-44">
            <option value="">Todos los tipos</option>
            <option value="Contado">Contado</option>
            <option value="Credito">Crédito</option>
          </Select>
          {(search || tipoFiltro) && (
            <Button variant="ghost" onClick={() => { setSearch(""); setTipo(""); }}>
              Limpiar
            </Button>
          )}
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            onRowClick={(row) => navigate(`/ventas/${row.id}`)}
          />
        </Card>
      </PageContent>
    </div>
  );
}
