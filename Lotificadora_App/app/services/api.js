// ──────────────────────────────────────────────────────────
// api.js — Capa de servicios para SQL Server
// Todos los endpoints llaman procedimientos almacenados,
// vistas o funciones en el servidor.
// BASE_URL apunta al backend (Express / .NET / etc.)
// ──────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error del servidor" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ──────────────────────────────────────────────
// PROYECTOS — sp_proyectos_*
// ──────────────────────────────────────────────
export const proyectosApi = {
  list: () => request("/proyectos"),                         // EXEC sp_proyectos_listar
  get: (id) => request(`/proyectos/${id}`),                  // EXEC sp_proyectos_obtener @id
  create: (data) => request("/proyectos", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/proyectos/${id}`, { method: "DELETE" }),
  dashboard: () => request("/proyectos/dashboard"),          // Vista vw_dashboard_proyectos
};

// ──────────────────────────────────────────────
// ETAPAS — sp_etapas_*
// ──────────────────────────────────────────────
export const etapasApi = {
  list: (proyectoId) =>
    request(`/etapas${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),
  get: (id) => request(`/etapas/${id}`),
  create: (data) => request("/etapas", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/etapas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/etapas/${id}`, { method: "DELETE" }),
  cuentas: (etapaId) => request(`/etapas/${etapaId}/cuentas`),
};

// ──────────────────────────────────────────────
// BLOQUES — sp_bloques_*
// ──────────────────────────────────────────────
const normalizeBloquePayload = (data) => ({
  EtapaID:
    data.etapaId !== undefined && data.etapaId !== null
      ? Number(data.etapaId)
      : data.EtapaID !== undefined && data.EtapaID !== null
      ? Number(data.EtapaID)
      : null,
  Bloque: data.Bloque,
  AreaTotalVaras:
    data.AreaTotalVaras !== undefined && data.AreaTotalVaras !== null
      ? Number(data.AreaTotalVaras)
      : data.areaTotalVaras !== undefined && data.areaTotalVaras !== null
      ? Number(data.areaTotalVaras)
      : null
});

export const bloquesApi = {
  list: (etapaId) =>
    request(`/bloques${etapaId ? `?etapaId=${etapaId}` : ""}`),
  get: (id) => request(`/bloques/${id}`),
  create: (data) => request("/bloques", {
    method: "POST",
    body: JSON.stringify(normalizeBloquePayload(data)),
  }),
  update: (id, data) => request(`/bloques/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeBloquePayload(data)),
  }),
  remove: (id) => request(`/bloques/${id}`, { method: "DELETE" }),
};

// ──────────────────────────────────────────────
// LOTES — sp_lotes_*
// ──────────────────────────────────────────────
const normalizeLotePayload = (data) => ({
  BloqueID: data.bloqueId ?? data.BloqueID ?? data.bloque_id ?? null,
  NumeroLote: data.numeroLote ?? data.numero_lote ?? data.codigo_lote ?? data.codigoLote ?? null,
  AreaVaras: data.areaVaras ?? data.area_varas ?? data.AreaVaras ?? data.area_m2 ?? data.areaM2 ?? data.areavaras ?? null,
  PrecioVara: data.precioVara ?? data.precio_vara ?? data.PrecioVara ?? data.precioVara ?? data.precio_vara ?? null,
  Estado: data.estado ?? data.Estado ?? 'Disponible',
  FechaReserva: data.fechaReserva ?? data.FechaReserva ?? null,
  //caracteristicas: data.caracteristicas ?? [],
});

const normalizeLoteDisponible = (data) => ({
  id: data.LoteID ?? data.id ?? null,
  codigo_lote: data.codigo_lote ?? data.NumeroLote ?? data.numeroLote ?? "",
  proyecto: data.proyecto ?? data.Proyecto ?? data.ProyectoNombre ?? "",
  etapa: data.etapa ?? data.Etapa ?? data.EtapaNombre ?? "",
  bloque: data.bloque ?? data.Bloque ?? data.BloqueNombre ?? "",
  area_m2: data.area_m2 ?? data.AreaVaras ?? data.areaVaras ?? data.areaM2 ?? "",
  precio_base: data.precio_base ?? data.PrecioBase ?? data.precioBase ?? "",
  precio_final: data.precio_final ?? data.PrecioFinal ?? data.precioFinal ?? data.valor_total ?? data.ValorTotal ?? "",
  estado: data.estado ?? data.Estado ?? "",
  proyectoId: data.proyectoId ?? data.ProyectoID ?? "",
  etapaId: data.etapaId ?? data.EtapaID ?? "",
  bloqueId: data.bloqueId ?? data.BloqueID ?? "",
  valor_total: data.valor_total ?? data.PrecioFinal ?? data.ValorTotal ?? "",
  tasa_interes: data.TasaInteresAplicada ?? data.TasaInteres ?? data.TasaInteresAplicada ?? 0,
});

export const lotesApi = {
  list: (bloqueId) =>
    request(`/lotes${bloqueId ? `?bloqueId=${bloqueId}` : ""}`),
  get: (id) => request(`/lotes/${id}`),
  //create: (data) => request("/lotes", { method: "POST", body: JSON.stringify(normalizeLotePayload(data)) }),
  getByNumero: (numeroLote) => request(`/lotes/NumeroLote?NumeroLote=${encodeURIComponent(numeroLote)}`),
  create: (data) => request("/lotes", { method: "POST", body: JSON.stringify(data) }),
  //update: (id, data) => request(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  update: (id, data) => request(`/lotes/${id}`, { method: "PUT", body: JSON.stringify(normalizeLotePayload(data)) }),
  remove: (id) => request(`/lotes/${id}`, { method: "DELETE" }),
  // Vista vw_lotes_disponibles
  disponibles: (filtros) =>
    request(`/lotes/disponibles?${new URLSearchParams(filtros)}`),
  // fn_valor_lote(id) — función escalar SQL
  calcularValor: (id) => request(`/lotes/${id}/valor`),
  // Lotes disponibles para venta
  disponiblesVenta: () =>
    request("/ventas/lotes/disponibles").then((rows) => rows.map(normalizeLoteDisponible)),
};

// ──────────────────────────────────────────────
// PAGOS — sp_pagos_*
// ──────────────────────────────────────────────
export const pagosApi = {
  list: (ventaId) =>
    request(`/pagos${ventaId ? `?ventaId=${ventaId}` : ""}`),
  get: (id) => request(`/pagos/${id}`),
  registrar: (data) => request("/pagos", { method: "POST", body: JSON.stringify(data) }),
  pendientes: (ventaId) => request(`/ventas/${ventaId}/cuotas-pendientes`),
  // sp_obtener_plan_pagos — obtener cuotas por VentaID
  planPagos: (ventaId) => request(`/pagos/plan-pagos/${ventaId}`),
  // sp_lotes_disponibles_credito — buscar lote por NumeroLote
  lotePorNumero: (numeroLote) => 
    request(`/pagos/lotes/disponibles?numeroLote=${encodeURIComponent(numeroLote)}`),
  // sp_lotes_disponibles_credito — buscar lotes por DNI
  lotesPorDni: (dni) => 
    request(`/pagos/lotes/disponibles?dni=${encodeURIComponent(dni)}`),
  update: (id, data) => request(`/pagos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/pagos/${id}`, { method: "DELETE" }),
  // sp_cierre_caja_diario — cursor
  cierreDiario: (fecha) =>
  request(`/pagos/cierre?fechaCierre=${fecha}&usuarioCajaId=1`),
  crearCierreDiario: (fecha, usuarioCajaId) => 
  request('/pagos/cierre-diario', {
    method: 'POST',
    body: JSON.stringify({ fechaCierre: fecha, usuarioCajaId }),
    headers: { 'Content-Type': 'application/json' }
  }),

  // Factura de pago
  factura: (id) => request(`/pagos/${id}/factura`),
  cuentasPendientes: () => request("/pagos/prestamos-activos"),
};
// CLIENTES — sp_clientes_*
// ──────────────────────────────────────────────
export const clientesApi = {
  list: (search) =>
    request(`/clientes${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  get: (id) => request(`/clientes/${id}`),
  getByDni: (dni) => request(`/clientes/dni/${dni}`), // Nuevo: obtener por DNI
  create: (data) => request("/clientes", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/clientes/${id}`, { method: "DELETE" }),
  historial: (id) => request(`/clientes/${id}/historial`), // Vista vw_historial_cliente
};

// Aval — sp_aval_*
// ──────────────────────────────────────────────
export const avalApi = {
  list: (search) =>
    request(`/aval${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  get: (id) => request(`/aval/${id}`),
  getByDni: (dni) => request(`/aval/dni/${dni}`), // Nuevo: obtener por DNI
  create: (data) => request("/aval", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/aval/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/aval/${id}`, { method: "DELETE" }),
  historial: (id) => request(`/aval/${id}/historial`), // Vista vw_historial_cliente
};

// ──────────────────────────────────────────────
/*const normalizeVentaPayload = (data) => ({
  ClienteId: data.clienteId ?? data.ClienteId ?? data.cliente_id ?? data.ClienteID ?? null,

  LoteId: data.loteId ?? data.LoteId ?? data.lote_id ?? data.LoteID ?? null,
  TipoVenta: data.tipo_venta ?? data.TipoVenta ?? data.tipoVenta ?? null,
  Prima: data.prima !== undefined && data.prima !== null ? data.prima : 0,
  AniosPlazo: data.tipo_venta === 'Credito' ? (data.anios_financiamiento ?? data.aniosPlazo ?? data.AniosPlazo ?? 0) : 0,
  TasaInteresAplicada: data.tipo_venta === 'Credito' ? (data.tasa_interes ?? data.tasaInteresAplicada ?? data.TasaInteresAplicada ?? data.interes ?? 12.0) : 0,
});
*/
// VENTAS — sp_ventas_*
// ──────────────────────────────────────────────
export const ventasApi = {
  list: () => request("/ventas"),
  get: (id) => request(`/ventas/${id}`),
  // sp_crear_venta_completa — con manejo transaccional
  create: (data) => request("/ventas", { method: "POST", body: JSON.stringify(data)}),//normalizeVentaPayload(data)) }),
  update: (id, data) => request(`/ventas/${id}`, { method: "PUT", body: JSON.stringify(data)}),//normalizeVentaPayload(data)) }),
  remove: (id) => request(`/ventas/${id}`, { method: "DELETE" }),
  // Cancelar venta completa (transaccional)
  cancelar: (id, motivo) => request(`/ventas/${id}/cancelar`, { 
    method: "POST", 
    body: JSON.stringify({ motivoCancelacion: motivo }) 
  }),
  // sp_generar_plan_pagos — cursor + transacción
  generarPlan: (ventaId, params) =>
    request(`/ventas/${ventaId}/plan-pagos`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  planPagos: (ventaId) => request(`/ventas/${ventaId}/plan-pagos`),
  // fn_tabla_amortizacion(ventaId) — función tipo tabla
  amortizacion: (ventaId) => request(`/ventas/${ventaId}/amortizacion`),
  // Estadísticas de ventas
  estadisticas: () => request("/ventas/estadisticas"),
  estadisticasContado: () => request("/ventas/estadisticas/contado"),
  estadisticasCredito: () => request("/ventas/estadisticas/credito"),
  estadisticasMora: () => request("/ventas/estadisticas/mora"),
};

// TRANSACCIONES — Procedimientos con manejo transaccional
// ──────────────────────────────────────────────
export const transaccionesApi = {
  crearVentaCompleta: (data) => ventasApi.create(data),
  cancelarVentaCompleta: (ventaId, motivo) => ventasApi.cancelar(ventaId, motivo),
  crearLoteCompleto: (data) => lotesApi.create(data),
  registrarPagoCompleto: (data) => pagosApi.registrar(data),
  generarPlanPagos: (ventaId, params) => ventasApi.generarPlan(ventaId, params),
  cierreCajaDiario: (fecha) => pagosApi.cierreDiario(fecha),
};

// ──────────────────────────────────────────────
// TRIGGERS — consulta de triggers activos en la base de datos
// ──────────────────────────────────────────────
export const triggersApi = {
  list: () => request("/triggers"),
};

// ──────────────────────────────────────────────
// CUENTAS BANCARIAS — sp_cuentas_*
// ──────────────────────────────────────────────
export const cuentasApi = {
  list: (etapaId) =>
    request(`/cuentas${etapaId ? `?etapaId=${etapaId}` : ""}`),
  get: (id) => request(`/cuentas/${id}`),
  create: (data) => request("/cuentas", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/cuentas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/cuentas/${id}`, { method: "DELETE" }),
  movimientos: (id) => request(`/cuentas/${id}/movimientos`),
};

// ──────────────────────────────────────────────
// DASHBOARD — Funciones escalares
// ──────────────────────────────────────────────
export const dashboardApi = {
  proyectosActivos: () => request("/dashboard/proyectos-activos"),             // fn_ContarProyectosActivos
  lotesDisponibles: () => request("/dashboard/lotes-disponibles"),             // fn_LotesDisponibles
  ventasMesActual: () => request("/dashboard/ventas-mes-actual"),              // fn_VentasMesActual
  pagosPendientes: () => request("/dashboard/pagos-pendientes"),               // fn_PagosPendientes
  ingresosMesActual: () => request("/dashboard/ingresos-mes-actual"),          // fn_IngresosMesActual
};

// ──────────────────────────────────────────────
// REPORTES — vw_reportes*
// ──────────────────────────────────────────────
export const reportesApi = {
  vistas: () => request("/reportes/vistas"),   
  ocupacionLotes: (estado) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
};
/*
export const proyectosApi = {
  list: () => request("/proyectos"),                         // EXEC sp_proyectos_listar
  get: (id) => request(`/proyectos/${id}`),                  // EXEC sp_proyectos_obtener @id
  create: (data) => request("/proyectos", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/proyectos/${id}`, { method: "DELETE" }),
  dashboard: () => request("/proyectos/dashboard"),          // Vista vw_dashboard_proyectos
};*/

// ──────────────────────────────────────────────
// VISTAS
// ──────────────────────────────────────────────
export const vistasApi = {
  list: () => request("/vistas"),   
  ocupacionLotes: (estado) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
  prestamosActivos: () => request("/vistas/prestamos-activos"), // Vista vw_prestamos_activos
};
/*
// ──────────────────────────────────────────────
// PROCEDIMIENTOS
// ──────────────────────────────────────────────
export const procedimienApi = {
  list: () => request("/vistas"),   
  ocupacionLotes: (estado) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
};*/

// ──────────────────────────────────────────────
// FUNCIONES
// ──────────────────────────────────────────────
export const funcionesApi = {
  list: () => request("/funciones"),   
  //ocupacionLotes: (estado) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  //resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
};

