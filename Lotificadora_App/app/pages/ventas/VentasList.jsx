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
  const [estadisticas, setEstadisticas] = useState({
    total_ventas: 0,
    total_contado: 0,
    total_credito: 0,
    total_mora: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos de ventas y estadísticas en paralelo
    Promise.all([
      ventasApi.list(),
      ventasApi.estadisticas()
    ])
      .then(([ventasData, statsData]) => {
        setData(ventasData);
        setFiltered(ventasData);
        setEstadisticas(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let d = data;
    if (search) d = d.filter((r) =>
      `${r.ClienteNombre} ${r.lote} ${r.VentaId}`.toLowerCase().includes(search.toLowerCase())
    );
    if (tipoFiltro) d = d.filter((r) => r.TipoVenta === tipoFiltro);
    setFiltered(d);
  }, [search, tipoFiltro, data]);

  const columns = [
    { key: "VentaID",  label: "#",        width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
    { key: "ClienteNombre",      label: "Cliente" },
    { key: "NumeroLote",         label: "Lote" },
    { key: "FechaVenta",  label: "Fecha", render: (v) => new Date(v).toLocaleDateString("es-HN") },
    { key: "TipoVenta",   label: "Tipo",  render: (v) => <Badge variant={TIPO_COLORS[v] ?? "default"}>{v === "Credito" ? "Crédito" : v}</Badge> },
    { key: "Estado", label: "Estado",
      render: (v) => <Badge variant={ESTADO_COLORS[v] ?? "default"}>{v ?? "—"}</Badge> },
    { key: "MontoTotal", label: "Monto Total",
      render: (v) => <span className={v > 0 ? "text-red-400" : "text-stone-500"}>{v ?? "—"}</span> },
    { key: "VentaID", label: "", width: 130,
      render: (id, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/ventas/${id}`}><Button size="sm" variant="ghost">Detalle</Button></Link>
          {row.tipo_venta === "Crédito" && (
            <Link to={`/ventas/${id}/plan-pagos`}><Button size="sm" variant="ghost">Plan</Button></Link>
          )}
        </div>
      ),
    },
  ];

  const totales = {
    total: estadisticas.total_ventas,
    contado: estadisticas.total_contado,
    credito: estadisticas.total_credito,
    mora: estadisticas.total_mora
  };

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="sp_ventas_listar — procesamiento en servidor"
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
          />
        </Card>
      </PageContent>
    </div>
  );
}
