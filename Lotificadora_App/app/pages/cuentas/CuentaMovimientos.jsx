// ════════════════════════════════════════
// CuentaMovimientos.jsx
// ════════════════════════════════════════
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";

import { cuentasApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, Card, DataTable, Badge,
} from "../../components/index";

export function CuentaMovimientos() {
  const { id } = useParams();
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos de la cuenta
      const cuentaData = await cuentasApi.get(id);
      setCuenta(cuentaData);

      // Cargar movimientos
      const movimientosData = await cuentasApi.movimientos(id);
      setMovimientos(movimientosData);
    } catch (err) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const cols = [
    { key: "MovimientoID", label: "ID", width: 80 },
    {
      key: "TipoMovimiento",
      label: "Tipo",
      render: (v) => (
        <Badge variant={v === 'Depósito' ? "success" : v === 'Retiro' ? "danger" : "default"}>
          {v}
        </Badge>
      ),
    },
    {
      key: "Monto",
      label: "Monto",
      render: (v) => `L. ${Number(v || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    },
    {
      key: "Descripcion",
      label: "Descripción",
      render: (v) => v || "—"
    },
    {
      key: "FechaMovimiento",
      label: "Fecha",
      render: (v) => new Date(v).toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      key: "SaldoAnterior",
      label: "Saldo Anterior",
      render: (v) => `L. ${Number(v || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    },
    {
      key: "SaldoPosterior",
      label: "Saldo Posterior",
      render: (v) => `L. ${Number(v || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Movimientos de Cuenta" subtitle="Cargando..." />
        <PageContent>
          <div className="text-center text-stone-400 py-8">
            Cargando movimientos...
          </div>
        </PageContent>
      </div>
    );
  }

  if (!cuenta) {
    return (
      <div>
        <PageHeader title="Movimientos de Cuenta" subtitle="Cuenta no encontrada" />
        <PageContent>
          <div className="text-center text-stone-500 py-8">
            La cuenta especificada no existe.
          </div>
        </PageContent>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Movimientos de Cuenta`}
        subtitle={`Cuenta: ${cuenta.NumeroCuenta} - ${cuenta.Banco}`}
        actions={
          <Link to="/cuentas">
            <Button variant="secondary">← Volver a Cuentas</Button>
          </Link>
        }
      />
      <PageContent>
        <div className="space-y-4">
          {/* Información de la cuenta */}
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-500 uppercase">Banco</p>
                <p className="text-lg font-semibold text-stone-100">{cuenta.Banco}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase">Número de Cuenta</p>
                <p className="text-lg font-semibold text-stone-100">{cuenta.NumeroCuenta}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase">Tipo</p>
                <p className="text-lg font-semibold text-stone-100">{cuenta.TipoCuenta}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase">Saldo Actual</p>
                <p className="text-lg font-semibold text-green-400">
                  L. {Number(cuenta.SaldoActual || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>

          {/* Mostrar error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Tabla de movimientos */}
          <Card className="p-0">
            <DataTable
              columns={cols}
              data={movimientos}
              emptyMessage="No se encontraron movimientos para esta cuenta"
            />
          </Card>

          {/* Resumen de movimientos */}
          {movimientos.length > 0 && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-stone-100">
                    {movimientos.length}
                  </p>
                  <p className="text-sm text-stone-500">Total de Movimientos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    L. {movimientos
                      .filter(m => m.TipoMovimiento === 'Depósito')
                      .reduce((sum, m) => sum + (m.Monto || 0), 0)
                      .toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-stone-500">Total Depósitos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    L. {movimientos
                      .filter(m => m.TipoMovimiento === 'Retiro')
                      .reduce((sum, m) => sum + (m.Monto || 0), 0)
                      .toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-stone-500">Total Retiros</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {movimientos.filter(m => m.TipoMovimiento === 'Depósito').length}
                  </p>
                  <p className="text-sm text-stone-500">N° Depósitos</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </PageContent>
    </div>
  );
}

export default CuentaMovimientos;