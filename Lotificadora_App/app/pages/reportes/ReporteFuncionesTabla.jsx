import { useEffect, useState } from "react";
import { reportesApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Card, DataTable, Badge, Button, FormField, Input, Select,
} from "../../components/index";

const ESTADO_COLORS = {
  Disponible: "success",
  Vendido: "danger",
  Reservado: "warning",
  "En proceso": "info",
};

export default function ReporteFuncionesTabla() {
  const [activeTab, setActiveTab] = useState("lotes-disponibles");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    proyectoId: "",
    clienteId: "",
    anio: new Date().getFullYear(),
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let result = [];
      switch (activeTab) {
        case "lotes-disponibles":
          if (filters.proyectoId) {
            result = await reportesApi.lotesDisponiblesProyecto(filters.proyectoId);
          }
          break;
        case "historial-pagos":
          if (filters.clienteId) {
            result = await reportesApi.historialPagosCliente(filters.clienteId);
          }
          break;
        case "cuotas-vencidas":
          result = await reportesApi.cuotasVencidas();
          break;
        case "ventas-mes":
          result = await reportesApi.ventasPorMes(filters.anio);
          break;
        case "estadisticas-lotes":
          result = await reportesApi.estadisticasLotesEstado();
          break;
      }
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const tabs = [
    { id: "lotes-disponibles", label: "Lotes Disponibles por Proyecto", icon: "🏠" },
    { id: "historial-pagos", label: "Historial de Pagos por Cliente", icon: "💰" },
    { id: "cuotas-vencidas", label: "Cuotas Vencidas", icon: "⚠️" },
    { id: "ventas-mes", label: "Ventas por Mes", icon: "📊" },
    { id: "estadisticas-lotes", label: "Estadísticas de Lotes", icon: "📈" },
  ];

  const renderTable = () => {
    if (loading) return <p className="text-center py-8">Cargando...</p>;
    if (error) return <p className="text-center py-8 text-red-500">{error}</p>;
    if (!data.length) return <p className="text-center py-8">No hay datos disponibles</p>;

    switch (activeTab) {
      case "lotes-disponibles":
        return (
          <DataTable
            columns={[
              { key: "codigo_lote", header: "Código" },
              { key: "bloque", header: "Bloque" },
              { key: "etapa", header: "Etapa" },
              { key: "area_m2", header: "Área (m²)", format: (v) => `${v} m²` },
              { key: "valor_total", header: "Valor", format: (v) => `L ${Number(v).toLocaleString()}` },
              { key: "estado", header: "Estado", render: (v) => <Badge variant={ESTADO_COLORS[v] || "default"}>{v}</Badge> },
            ]}
            data={data}
          />
        );
      case "historial-pagos":
        return (
          <DataTable
            columns={[
              { key: "fecha_pago", header: "Fecha", format: (v) => new Date(v).toLocaleDateString() },
              { key: "monto_pagado", header: "Monto Pagado", format: (v) => `L ${Number(v).toLocaleString()}` },
              { key: "metodo_pago", header: "Método" },
              { key: "numero_cuota", header: "Cuota #" },
              { key: "cuota_total", header: "Cuota Total", format: (v) => `L ${Number(v).toLocaleString()}` },
              { key: "lote", header: "Lote" },
            ]}
            data={data}
          />
        );
      case "cuotas-vencidas":
        return (
          <DataTable
            columns={[
              { key: "numero_cuota", header: "Cuota #" },
              { key: "fecha_vencimiento", header: "Vencimiento", format: (v) => new Date(v).toLocaleDateString() },
              { key: "cuota_total", header: "Cuota", format: (v) => `L ${Number(v).toLocaleString()}` },
              { key: "saldo_pendiente", header: "Saldo", format: (v) => `L ${Number(v).toLocaleString()}` },
              { key: "dias_mora", header: "Días Mora" },
              { key: "cliente", header: "Cliente" },
              { key: "lote", header: "Lote" },
            ]}
            data={data}
          />
        );
      case "ventas-mes":
        return (
          <DataTable
            columns={[
              { key: "mes", header: "Mes", format: (v) => new Date(2024, v - 1).toLocaleDateString('es', { month: 'long' }) },
              { key: "total_ventas", header: "Total Ventas" },
              { key: "ventas_contado", header: "Contado" },
              { key: "ventas_credito", header: "Crédito" },
              { key: "monto_total", header: "Monto Total", format: (v) => `L ${Number(v).toLocaleString()}` },
            ]}
            data={data}
          />
        );
      case "estadisticas-lotes":
        return (
          <DataTable
            columns={[
              { key: "estado", header: "Estado", render: (v) => <Badge variant={ESTADO_COLORS[v] || "default"}>{v}</Badge> },
              { key: "cantidad", header: "Cantidad" },
              { key: "area_total", header: "Área Total", format: (v) => `${Number(v).toLocaleString()} m²` },
              { key: "valor_total", header: "Valor Total", format: (v) => `L ${Number(v).toLocaleString()}` },
            ]}
            data={data}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="Reportes - Funciones Tipo Tabla" />
      <PageContent>
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <span>{tab.icon}</span>
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              {(activeTab === "lotes-disponibles" || activeTab === "historial-pagos") && (
                <FormField label="ID">
                  <Input
                    type="number"
                    value={activeTab === "lotes-disponibles" ? filters.proyectoId : filters.clienteId}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      [activeTab === "lotes-disponibles" ? "proyectoId" : "clienteId"]: e.target.value
                    }))}
                    placeholder={activeTab === "lotes-disponibles" ? "ID Proyecto" : "ID Cliente"}
                  />
                </FormField>
              )}
              {activeTab === "ventas-mes" && (
                <FormField label="Año">
                  <Input
                    type="number"
                    value={filters.anio}
                    onChange={(e) => setFilters(prev => ({ ...prev, anio: e.target.value }))}
                    placeholder="Año"
                  />
                </FormField>
              )}
              <Button onClick={loadData} disabled={loading}>
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-4">
            {renderTable()}
          </Card>
        </div>
      </PageContent>
    </div>
  );
}