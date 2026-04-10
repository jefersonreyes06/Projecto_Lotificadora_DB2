import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
// import { pagosApi, ventasApi } from "../../services/api";
import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert, Badge,
} from "../../components/index";

export default function PagoForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ventaId: "",
    tipo_pago: "Efectivo",
    referencia_banco: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    cuotas_ids: [],
  });

  const [cuotasPendientes, setCuotasPendientes] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [facturaId, setFacturaId] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const buscarCuotas = () => {
    if (!form.ventaId) return;
    setLoadingCuotas(true);
    // fn_tabla_pagos_pendientes — función tipo tabla
    pagosApi
      .pendientes(form.ventaId)
      .then(setCuotasPendientes)
      .catch(() => setCuotasPendientes([]))
      .finally(() => setLoadingCuotas(false));
  };

  const toggleCuota = (id) => {
    setForm((f) => ({
      ...f,
      cuotas_ids: f.cuotas_ids.includes(id)
        ? f.cuotas_ids.filter((c) => c !== id)
        : [...f.cuotas_ids, id],
    }));
  };

  const totalSeleccionado = cuotasPendientes
    .filter((c) => form.cuotas_ids.includes(c.id))
    .reduce((sum, c) => sum + Number(c.cuota_total), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.cuotas_ids.length === 0) {
      setError("Seleccione al menos una cuota a pagar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await pagosApi.registrar(form); // sp_registrar_pago — transaccional
      setFacturaId(res.facturaId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (facturaId) {
    return (
      <div>
        <PageHeader title="Pago registrado" />
        <PageContent>
          <Card className="p-8 max-w-md text-center space-y-4">
            <div className="text-5xl">◎</div>
            <p className="text-lg font-semibold text-stone-100">Pago procesado</p>
            <p className="text-sm text-stone-400">Factura generada: <strong className="text-amber-400">#{facturaId}</strong></p>
            <div className="flex gap-3 justify-center">
              <Link to={`/pagos/${facturaId}/factura`}>
                <Button>Ver factura</Button>
              </Link>
              <Link to="/pagos">
                <Button variant="secondary">Ir a pagos</Button>
              </Link>
            </div>
          </Card>
        </PageContent>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Registrar Pago"
        subtitle="sp_registrar_pago — transaccional con emisión de factura"
        actions={
          <Link to="/pagos">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
      <PageContent>
        {error && <Alert variant="danger">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Búsqueda de venta */}
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Venta a pagar
                </p>
                <div className="flex gap-3">
                  <FormField label="ID de venta" required>
                    <Input
                      type="number"
                      value={form.ventaId}
                      onChange={set("ventaId")}
                      placeholder="Número de venta"
                    />
                  </FormField>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={buscarCuotas}
                      disabled={!form.ventaId}
                    >
                      Buscar cuotas
                    </Button>
                  </div>
                </div>

                {/* Cuotas pendientes */}
                {loadingCuotas && (
                  <p className="text-sm text-stone-500 animate-pulse">Cargando cuotas...</p>
                )}
                {cuotasPendientes.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-3">
                      Seleccione las cuotas a cancelar:
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {cuotasPendientes.map((c) => {
                        const sel = form.cuotas_ids.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-all ${
                              sel
                                ? "border-amber-400/50 bg-amber-400/5"
                                : "border-stone-700 hover:border-stone-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => toggleCuota(c.id)}
                              className="accent-amber-400"
                            />
                            <div className="flex-1 flex justify-between text-sm">
                              <span className="text-stone-300">
                                Cuota #{c.numero_cuota} · Vence:{" "}
                                {new Date(c.fecha_vencimiento).toLocaleDateString("es-HN")}
                              </span>
                              <span className="flex items-center gap-2">
                                {c.dias_mora > 0 && (
                                  <Badge variant="danger">{c.dias_mora}d mora</Badge>
                                )}
                                <span className="text-amber-400 font-medium">
                                  L {Number(c.cuota_total).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                                </span>
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* Tipo de pago */}
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Forma de pago
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tipo de pago" required>
                    <Select value={form.tipo_pago} onChange={set("tipo_pago")}>
                      <option value="Efectivo">Efectivo (en caja)</option>
                      <option value="Deposito">Depósito bancario</option>
                      <option value="Transferencia">Transferencia</option>
                    </Select>
                  </FormField>
                  <FormField label="Fecha de pago" required>
                    <Input
                      type="date"
                      value={form.fecha_pago}
                      onChange={set("fecha_pago")}
                    />
                  </FormField>
                </div>
                {form.tipo_pago !== "Efectivo" && (
                  <FormField label="Número de referencia bancaria" required>
                    <Input
                      value={form.referencia_banco}
                      onChange={set("referencia_banco")}
                      placeholder="Número de transacción"
                    />
                  </FormField>
                )}
              </Card>
            </div>

            {/* Resumen */}
            <div>
              <Card className="p-5 sticky top-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Total a cobrar
                </p>
                <p className="text-3xl font-semibold text-amber-400">
                  L {totalSeleccionado.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-stone-600">
                  {form.cuotas_ids.length} cuota(s) seleccionada(s)
                </p>
                <div className="border-t border-stone-800 pt-4">
                  <Button
                    type="submit"
                    disabled={saving || form.cuotas_ids.length === 0}
                    className="w-full justify-center"
                  >
                    {saving ? "Procesando..." : "Registrar y emitir factura"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </PageContent>
    </div>
  );
}
