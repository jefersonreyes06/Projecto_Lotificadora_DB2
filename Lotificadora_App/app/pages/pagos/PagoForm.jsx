import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { pagosApi, ventasApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";

const fmtLps = (value) =>
  `L ${Number(value ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export default function PagoForm() {
  const [searchParams] = useSearchParams();
  const numeroLoteParam = searchParams.get("numeroLote") ?? "";

  const [lote, setLote] = useState(null);
  const [venta, setVenta] = useState(null);
  const [cuotasPendientes, setCuotasPendientes] = useState([]);
  const [loadingLote, setLoadingLote] = useState(false);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [facturaId, setFacturaId] = useState(null);

  const [form, setForm] = useState({
    numeroLote: numeroLoteParam,
    cuotaId: "",
    montoRecibido: "",
    metodoPago: "Efectivo",
    numeroDeposito: "",
    cuentaBancariaId: "",
    usuarioCajaId: "1",
    observaciones: "",
    fechaPago: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!numeroLoteParam) return;
    setForm((prev) => ({ ...prev, numeroLote: numeroLoteParam }));
    loadLote(numeroLoteParam);
  }, [numeroLoteParam]);

  const setField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Cargar lote por número (automáticamente valida crédito y proceso)
  const loadLote = async (numeroLote) => {
    setLoadingLote(true);
    setError(null);
    setLote(null);
    setVenta(null);
    setCuotasPendientes([]);
    
    try {
      const lotes = await pagosApi.lotePorNumero(numeroLote);
      
      if (!lotes || lotes.length === 0) {
        setError("Lote no encontrado. Asegúrese que esté al crédito y en estado Proceso.");
        return;
      }

      const loteData = lotes[0];
      setLote(loteData);

      // Si el lote tiene venta activa, cargar datos de la venta y cuotas
      if (loteData.VentaID) {
        // Construir objeto de venta con datos del lote
        const ventaData = {
          VentaID: loteData.VentaID,
          ClienteID: loteData.ClienteID,
          ClienteNombre: loteData.ClienteNombre,
          DNI: loteData.DNI,
          NumeroLote: loteData.NumeroLote,
          LoteID: loteData.LoteID,
          TipoVenta: loteData.TipoVenta ?? 'Credito',
          Estado: loteData.EstadoVenta ?? 'Activa',
          LoteEstado: loteData.EstadoLote ?? 'Proceso',
          MontoTotal: loteData.MontoTotal,
          CuotasPendientes: loteData.CuotasPendientes,
          SaldoPendiente: loteData.SaldoPendiente,
        };
        setVenta(ventaData);

        // Cargar cuotas pendientes
        loadCuotas(loteData.VentaID);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el lote.");
    } finally {
      setLoadingLote(false);
    }
  };

  const loadCuotas = async (ventaId) => {
    setLoadingCuotas(true);
    try {
      const cuotas = await pagosApi.planPagos(ventaId);
      // Filtrar solo cuotas pendientes
      const pendientes = cuotas.filter(c => c.Estado === 'Pendiente');
      setCuotasPendientes(pendientes);
    } catch (err) {
      setCuotasPendientes([]);
      setError(err.message || "No se pudieron cargar las cuotas pendientes.");
    } finally {
      setLoadingCuotas(false);
    }
  }; 

  const selectedCuota = cuotasPendientes.find((c) => c.CuotaID === Number(form.cuotaId));

  useEffect(() => {
    if (selectedCuota && !form.montoRecibido) {
      setForm((prev) => ({ ...prev, montoRecibido: String(selectedCuota.SaldoPendiente) }));
    }
  }, [selectedCuota]);

  const isVentaCredito = venta?.TipoVenta === "Credito";
  const isLoteProceso = venta?.LoteEstado === "Proceso";

  const handleBuscar = () => {
    if (!form.numeroLote) {
      setError("Ingrese un número de lote");
      return;
    }
    loadLote(form.numeroLote);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.numeroLote) {
      setError("Debe indicar el número de lote.");
      return;
    }
    if (!form.cuotaId) {
      setError("Seleccione la cuota a pagar.");
      return;
    }
    if (!form.montoRecibido || Number(form.montoRecibido) <= 0) {
      setError("Ingrese un monto recibido válido.");
      return;
    }
    if (!form.usuarioCajaId) {
      setError("Ingrese el usuario de caja.");
      return;
    }
    if (!isVentaCredito) {
      setError("Solo se permiten pagos para ventas al crédito.");
      return;
    }
    if (!isLoteProceso) {
      setError("El lote debe estar en estado 'Proceso' para registrar el pago.");
      return;
    }
    if (!selectedCuota) {
      setError("La cuota seleccionada no existe o no está pendiente.");
      return;
    }

    const montoNumero = Number(form.montoRecibido);
    if (montoNumero > Number(selectedCuota.SaldoPendiente)) {
      setError("El monto recibido no puede exceder el saldo pendiente de la cuota.");
      return;
    }

    setSaving(true);
    try {
      const res = await pagosApi.registrar({
        cuotaId: Number(form.cuotaId),
        montoRecibido: montoNumero,
        metodoPago: form.metodoPago,
        numeroDeposito: form.numeroDeposito || null,
        cuentaBancariaId: form.cuentaBancariaId ? Number(form.cuentaBancariaId) : null,
        usuarioCajaId: Number(form.usuarioCajaId),
        observaciones: form.observaciones || null,
        fechaPago: form.fechaPago,
      });

      setFacturaId(res.FacturaID ?? res.facturaId ?? res.factura_id ?? null);
    } catch (err) {
      setError(err.message || "Error al registrar el pago.");
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
            <p className="text-sm text-stone-400">
              Factura generada: <strong className="text-amber-400">#{facturaId}</strong>
            </p>
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
        subtitle="Buscar por Número de Lote - Validación automática: Crédito + Proceso"
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
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Lote a pagar
                </p>
                <div className="flex gap-3 flex-wrap">
                  <FormField label="Número de lote" required>
                    <Input
                      type="text"
                      value={form.numeroLote}
                      onChange={setField("numeroLote")}
                      placeholder="Ej: A-01, B-05"
                    />
                  </FormField>
                  <div className="flex items-end">
                    <Button type="button" variant="secondary" onClick={handleBuscar}>
                      Cargar lote
                    </Button>
                  </div>
                </div>

                {loadingLote && <p className="text-sm text-stone-500 animate-pulse">Cargando lote...</p>}

                {venta && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Cliente</p>
                      <p className="mt-1 font-medium text-stone-100">{venta.ClienteNombre}</p>
                      <p className="text-xs text-stone-500 mt-1">{venta.DNI}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Tipo venta</p>
                      <p className="mt-1 font-medium text-stone-100">{venta.TipoVenta === "Credito" ? "Crédito ✓" : venta.TipoVenta}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Estado lote</p>
                      <p className="mt-1 font-medium text-stone-100">{venta.LoteEstado === "Proceso" ? "Proceso ✓" : venta.LoteEstado}</p>
                    </div>
                  </div>
                )}

                {venta && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Cuotas pendientes</p>
                      <p className="mt-1 font-medium text-blue-400">{venta.CuotasPendientes}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Saldo pendiente</p>
                      <p className="mt-1 font-medium text-amber-400">{fmtLps(venta.SaldoPendiente)}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-xs text-stone-500 mb-2">Cuotas pendientes</p>
                  {loadingCuotas && <p className="text-sm text-stone-500 animate-pulse">Cargando cuotas...</p>}
                  {!loadingCuotas && cuotasPendientes.length === 0 && (
                    <p className="text-sm text-stone-500">No hay cuotas pendientes para este lote.</p>
                  )}
                  {cuotasPendientes.length > 0 && (
                    <FormField label="Seleccionar cuota" required>
                      <Select value={form.cuotaId} onChange={setField("cuotaId")}>
                        <option value="">Seleccione una cuota</option>
                        {cuotasPendientes.map((cuota) => (
                          <option key={cuota.CuotaID} value={cuota.CuotaID}>
                            Cuota #{cuota.NumeroCuota} — Vence {new Date(cuota.FechaVencimiento).toLocaleDateString("es-HN")} — Saldo {fmtLps(cuota.SaldoPendiente)}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Forma de pago
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Tipo de pago" required>
                    <Select value={form.metodoPago} onChange={setField("metodoPago")}>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Deposito">Depósito</option>
                      <option value="Transferencia">Transferencia</option>
                    </Select>
                  </FormField>
                  <FormField label="Fecha de pago" required>
                    <Input type="date" value={form.fechaPago} onChange={setField("fechaPago")} />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Monto recibido" required>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.montoRecibido}
                      onChange={setField("montoRecibido")}
                      placeholder="Monto pagado"
                    />
                  </FormField>
                  <FormField label="Usuario caja" required>
                    <Input
                      type="number"
                      value={form.usuarioCajaId}
                      onChange={setField("usuarioCajaId")}
                      placeholder="ID usuario caja"
                    />
                  </FormField>
                </div>
                {form.metodoPago !== "Efectivo" && (
                  <>
                    <FormField label="Número de referencia bancaria" required>
                      <Input
                        value={form.numeroDeposito}
                        onChange={setField("numeroDeposito")}
                        placeholder="Ej. 123456789"
                      />
                    </FormField>
                    <FormField label="Cuenta bancaria (ID)" optional>
                      <Input
                        type="number"
                        value={form.cuentaBancariaId}
                        onChange={setField("cuentaBancariaId")}
                        placeholder="ID de cuenta bancaria"
                      />
                    </FormField>
                  </>
                )}
                <FormField label="Observaciones" optional>
                  <Input
                    value={form.observaciones}
                    onChange={setField("observaciones")}
                    placeholder="Notas del pago"
                  />
                </FormField>
              </Card>
            </div>

            <div>
              <Card className="p-5 sticky top-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                    Resumen del pago
                  </p>
                  <div className="grid gap-2 text-sm text-stone-300">
                    <div className="flex justify-between">
                      <span>Lote</span>
                      <span>{form.numeroLote || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliente</span>
                      <span>{venta?.ClienteNombre || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuota seleccionada</span>
                      <span>{selectedCuota ? `#${selectedCuota.NumeroCuota}` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo pendiente</span>
                      <span>{selectedCuota ? fmtLps(selectedCuota.SaldoPendiente) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto a recibir</span>
                      <span>{form.montoRecibido ? fmtLps(form.montoRecibido) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modo de pago</span>
                      <span>{form.metodoPago}</span>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={saving || !form.cuotaId || !isVentaCredito || !isLoteProceso} className="w-full justify-center">
                  {saving ? "Procesando..." : "Registrar pago"}
                </Button>
                {venta && !isVentaCredito && (
                  <Alert variant="warning">Solo se permiten pagos para ventas al crédito.</Alert>
                )}
                {venta && !isLoteProceso && (
                  <Alert variant="warning">El lote debe estar en estado Proceso para registrar el pago.</Alert>
                )}
              </Card>
            </div>
          </div>
        </form>
      </PageContent>
    </div>
  );
}
