// ════════════════════════════════════════
// CuentasList.jsx
// ════════════════════════════════════════
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";

import { cuentasApi, etapasApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, Card, DataTable, Badge, Input, Select,
} from "../../components/index";

export function CuentasList() {
  const [cuentas, setCuentas] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filtros
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroBanco, setFiltroBanco] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar etapas para el filtro
      const etapasData = await etapasApi.list();
      setEtapas(etapasData);

      // Cargar cuentas
      const cuentasData = await cuentasApi.list();
      setCuentas(cuentasData);
    } catch (err) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cuentas
  const filteredCuentas = useMemo(() => {
    return cuentas.filter(cuenta => {
      const matchEtapa = !filtroEtapa || cuenta.EtapaID.toString() === filtroEtapa;
      const matchBanco = !filtroBanco || cuenta.Banco.toLowerCase().includes(filtroBanco.toLowerCase());
      const matchTipo = !filtroTipo || cuenta.TipoCuenta === filtroTipo;
      return matchEtapa && matchBanco && matchTipo;
    });
  }, [cuentas, filtroEtapa, filtroBanco, filtroTipo]);

  // Obtener nombre de etapa
  const getEtapaNombre = (etapaId) => {
    const etapa = etapas.find(e => e.EtapaID === etapaId);
    return etapa ? etapa.Nombre : `Etapa ${etapaId}`;
  };

  // Tipos de cuenta disponibles
  const tiposCuenta = [
    { value: "", label: "Todos los tipos" },
    { value: "Corriente", label: "Corriente" },
    { value: "Ahorro", label: "Ahorro" },
    { value: "Plazo Fijo", label: "Plazo Fijo" },
  ];

  const cols = [
    { key: "CuentaID", label: "ID", width: 80 },
    {
      key: "EtapaID",
      label: "Etapa",
      render: (v) => getEtapaNombre(v)
    },
    { key: "Banco", label: "Banco" },
    { key: "NumeroCuenta", label: "Número de Cuenta" },
    { key: "TipoCuenta", label: "Tipo" },
    {
      key: "SaldoActual",
      label: "Saldo Actual",
      render: (v) => `L. ${Number(v || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    },
    {
      key: "Estado",
      label: "Estado",
      render: (v) => (
        <Badge variant={v === 'Activa' ? "success" : "default"}>{v}</Badge>
      ),
    },
    {
      key: "CuentaID",
      label: "",
      width: 120,
      render: (id) => (
        <div className="flex gap-1">
          <Link to={`/cuentas/${id}/editar`}>
            <Button size="sm" variant="ghost">Editar</Button>
          </Link>
          <Link to={`/cuentas/${id}/movimientos`}>
            <Button size="sm" variant="outline">Movimientos</Button>
          </Link>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Cuentas Bancarias" subtitle="Cargando..." />
        <PageContent>
          <div className="text-center text-stone-400 py-8">
            Cargando cuentas...
          </div>
        </PageContent>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cuentas Bancarias"
        subtitle="sp_cuentas_listar — gestión de cuentas bancarias"
        actions={
          <Link to="/cuentas/nuevo">
            <Button>+ Nueva cuenta</Button>
          </Link>
        }
      />
      <PageContent>
        <div className="space-y-4">
          {/* Filtros */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Etapa</label>
                <Select
                  value={filtroEtapa}
                  onChange={(e) => setFiltroEtapa(e.target.value)}
                >
                  <option value="">Todas las etapas</option>
                  {etapas.map(etapa => (
                    <option key={etapa.EtapaID} value={etapa.EtapaID}>
                      {etapa.Nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Banco</label>
                <Input
                  placeholder="Filtrar por banco"
                  value={filtroBanco}
                  onChange={(e) => setFiltroBanco(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tipo de Cuenta</label>
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  {tiposCuenta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* Mostrar error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Tabla de cuentas */}
          <Card className="p-0">
            <DataTable
              columns={cols}
              data={filteredCuentas}
              emptyMessage="No se encontraron cuentas bancarias"
            />
          </Card>

          {/* Resumen */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-stone-100">
                  {filteredCuentas.length}
                </p>
                <p className="text-sm text-stone-500">Total de Cuentas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  L. {filteredCuentas.reduce((sum, c) => sum + (c.SaldoActual || 0), 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-stone-500">Saldo Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredCuentas.filter(c => c.Estado === 'Activa').length}
                </p>
                <p className="text-sm text-stone-500">Cuentas Activas</p>
              </div>
            </div>
          </Card>
        </div>
      </PageContent>
    </div>
  );
}

export default CuentasList;