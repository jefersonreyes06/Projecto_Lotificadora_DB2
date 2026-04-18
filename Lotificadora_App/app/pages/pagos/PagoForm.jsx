import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { pagosApi, ventasApi, lotesApi } from "../../services/api.js";
import { notify, useNotifyError } from "../../utils/notify";
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

  useNotifyError(error);

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
      const lotes = await lotesApi.getByNumero(numeroLote);

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
          ClienteNombre: loteData.NombreCompleto,
          DNI: loteData.DNI,
          NumeroLote: loteData.NumeroLote,
          LoteID: loteData.LoteID,
          TipoVenta: loteData.TipoVenta ?? 'Credito',
          Estado: loteData.EstadoVenta ?? 'Activa',
          LoteEstado: loteData.EstadoLote ?? 'Proceso',
          MontoCuota: loteData.MontoCuota,
          MontoTotal: loteData.MontoTotal,
          cuotasPendientes: loteData.CuotasPendientes,
          SaldoPendiente: loteData.SaldoPendiente,
          CuotasRestantes: loteData.CuotasRestantes,
        };
        setVenta(ventaData);

        // Cargar cuotas pendientes
        loadCuotas(loteData.VentaID);
      }
    } catch (err) {
      const message = err.message || "No se pudo cargar el lote.";
      setError(message);
      notify.error(message);
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
      const message = err.message || "No se pudieron cargar las cuotas pendientes.";
      setCuotasPendientes([]);
      setError(message);
      notify.error(message);
    } finally {
      setLoadingCuotas(false);
    }
  }; 

  const selectedCuota = cuotasPendientes.find((c) => c.CuotaID === Number(form.cuotaId));

  /*useEffect(() => {
    if (selectedCuota && !form.montoRecibido) {
      setForm((prev) => ({ ...prev, montoRecibido: String(selectedCuota.SaldoPendiente) }));
    }
  }, [selectedCuota]);*/

  const isVentaCredito = venta?.TipoVenta === "Credito";
  const isLoteProceso = venta?.LoteEstado === "Reservado";

  const handleBuscar = () => {
    if (!form.numeroLote) {
      const message = "Ingrese un número de lote";
      setError(message);
      notify.error(message);
      return;
    }
    loadLote(form.numeroLote);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.numeroLote) {
      const message = "Debe indicar el número de lote.";
      setError(message);
      notify.error(message);
      return;
    }
    /*if (!form.cuotaId) {
      const message = "Seleccione la cuota a pagar.";
      setError(message);
      notify.error(message);
      return;
    }*/
    if (!form.montoRecibido || Number(form.montoRecibido) <= 0) {
      const message = "Ingrese un monto recibido válido.";
      setError(message);
      notify.error(message);
      return;
    }
    /*if (!form.usuarioCajaId) {
      const message = "Ingrese el usuario de caja.";
      setError(message);
      notify.error(message);
      return;
    }*/
    /*if (!isVentaCredito) {
      const message = "Solo se permiten pagos para ventas al crédito.";
      setError(message);
      notify.error(message);
      return;
    }
    /*if (!isLoteProceso) {
      const message = "El lote debe estar en estado 'Proceso' para registrar el pago.";
      setError(message);
      notify.error(message);
      return;
    }
    /*if (!selectedCuota) {
      const message = "La cuota seleccionada no existe o no está pendiente.";
      setError(message);
      notify.error(message);
      return;
    }*/

    const montoNumero = Number(form.montoRecibido);
    /*if (montoNumero > Number(selectedCuota.SaldoPendiente)) {
      setError("El monto recibido no puede exceder el saldo pendiente de la cuota.");
      return;
    } */

    setSaving(true);
    try {
      const res = await pagosApi.update(
        venta.VentaID, // este es el id que va en la URL
        {
          VentaID: venta.VentaID,
          TipoPago: form.metodoPago,
          MontoRecibido: form.montoRecibido
        }
      );

      setFacturaId(res.FacturaID ?? res.facturaId ?? res.factura_id ?? null);
      notify.success("Pago registrado correctamente");
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
                      <p className="mt-1 font-medium text-blue-400">{venta.cuotasPendientes}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Saldo pendiente</p>
                      <p className="mt-1 font-medium text-amber-400">{fmtLps(venta.SaldoPendiente)}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Cuotas restantes</p>
                      <p className="mt-1 font-medium text-blue-400">{venta.CuotasRestantes}</p>
                    </div>
                    <div className="rounded-lg border border-stone-800 p-3 bg-stone-950/60">
                      <p className="text-stone-400 text-xs uppercase tracking-wide">Monto por cuota</p>
                      <p className="mt-1 font-medium text-amber-400">{fmtLps(venta.MontoCuota)}</p>
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
                  </>
                )}
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
                      <span>{selectedCuota ? `#${selectedCuota.NumeroCuota}` : "Ultima Cuota"}</span>
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
                <Button type="submit" disabled={saving /*|| !form.cuotaId*/ || !isVentaCredito || !isLoteProceso} className="w-full justify-center">
                  {saving ? "Procesando..." : "Registrar pago"}
                </Button>
                {venta && !isVentaCredito && (
                  <Alert variant="warning">Solo se permiten pagos para ventas al crédito.</Alert>
                )}
                {venta && !isLoteProceso && (
                  <Alert variant="warning">El lote debe estar en estado Reservado para registrar el pago.</Alert>
                )}
              </Card>
            </div>
          </div>
        </form>
      </PageContent>
    </div>
  );
}
