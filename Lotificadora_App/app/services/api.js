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
  etapaId:
    data.etapaId !== undefined && data.etapaId !== null
      ? Number(data.etapaId)
      : data.EtapaID !== undefined && data.EtapaID !== null
      ? Number(data.EtapaID)
      : null,
  nombre: data.nombre,
  areaTotalVaras:
    data.area_total_varas !== undefined && data.area_total_varas !== null
      ? Number(data.area_total_varas)
      : data.areaTotalVaras !== undefined && data.areaTotalVaras !== null
      ? Number(data.areaTotalVaras)
      : null,
  estado: data.estado,
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
  bloqueId: data.bloqueId ?? data.BloqueID ?? data.bloque_id ?? null,
  numeroLote: data.numeroLote ?? data.numero_lote ?? data.codigo_lote ?? data.codigoLote ?? null,
  areaVaras: data.areaVaras ?? data.area_varas ?? data.AreaVaras ?? data.area_m2 ?? data.areaM2 ?? data.areavaras ?? null,
  precioVara: data.precioVara ?? data.precio_vara ?? data.PrecioVara ?? data.precioVara ?? data.precio_vara ?? null,
  estado: data.estado ?? data.Estado ?? 'Disponible',
  caracteristicas: data.caracteristicas ?? [],
  esEsquina: data.es_esquina ?? data.EsEsquina ?? false,
  cercaParque: data.cerca_parque ?? data.CercaParque ?? false,
  calleCerrada: data.calle_cerrada ?? data.CalleCerrada ?? false,
  frenteAvenida: data.frente_avenida ?? data.FrenteAvenida ?? false,
  descripcion: data.descripcion ?? data.Descripcion ?? "",
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
});

export const lotesApi = {
  list: (bloqueId) =>
    request(`/lotes${bloqueId ? `?bloqueId=${bloqueId}` : ""}`),
  get: (id) => request(`/lotes/${id}`),
  create: (data) => request("/lotes", { method: "POST", body: JSON.stringify(normalizeLotePayload(data)) }),
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
  cierreDiario: (fecha) => request(`/pagos/cierre?fecha=${fecha}`),
  // Factura de pago
  factura: (id) => request(`/pagos/${id}/factura`),
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

// ──────────────────────────────────────────────
const normalizeVentaPayload = (data) => ({
  ClienteId: data.clienteId ?? data.ClienteId ?? data.cliente_id ?? data.ClienteID ?? null,
  LoteId: data.loteId ?? data.LoteId ?? data.lote_id ?? data.LoteID ?? null,
  TipoVenta: data.tipo_venta ?? data.TipoVenta ?? data.tipoVenta ?? null,
  Prima: data.prima !== undefined && data.prima !== null ? data.prima : 0,
  AniosPlazo: data.tipo_venta === 'Credito' ? (data.anios_financiamiento ?? data.aniosPlazo ?? data.AniosPlazo ?? 0) : 0,
  TasaInteresAplicada: data.tipo_venta === 'Credito' ? (data.tasa_interes ?? data.tasaInteresAplicada ?? data.TasaInteresAplicada ?? data.interes ?? 12.0) : 0,
});

// VENTAS — sp_ventas_*
// ──────────────────────────────────────────────
export const ventasApi = {
  list: () => request("/ventas"),
  get: (id) => request(`/ventas/${id}`),
  // sp_crear_venta_completa — con manejo transaccional
  create: (data) => request("/ventas", { method: "POST", body: JSON.stringify(normalizeVentaPayload(data)) }),
  update: (id, data) => request(`/ventas/${id}`, { method: "PUT", body: JSON.stringify(normalizeVentaPayload(data)) }),
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
// REPORTES — Vistas, SPs, Funciones tipo tabla
// ──────────────────────────────────────────────
export const reportesApi = {
  // Vistas
  ocupacionLotes: (params) =>
    request(`/reportes/ocupacion-lotes?${new URLSearchParams(params)}`),       // vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"),               // vw_resumen_proyectos

  // Procedimientos almacenados
  morosos: (diasMora) => request(`/reportes/morosos?dias=${diasMora}`),        // sp_reporte_morosos
  ingresosMes: (año, mes) =>
    request(`/reportes/ingresos?anio=${año}&mes=${mes}`),                       // sp_ingresos_mes

  // Funciones tipo tabla
  lotesPorEtapa: (etapaId) => request(`/reportes/lotes-etapa/${etapaId}`),    // fn_lotes_por_etapa
  clientesPorProyecto: (proyectoId) =>
    request(`/reportes/clientes-proyecto/${proyectoId}`),                       // fn_clientes_por_proyecto

  // NUEVAS FUNCIONES TIPO TABLA
  lotesDisponiblesProyecto: (proyectoId) =>
    request(`/reportes/lotes-disponibles-proyecto/${proyectoId}`),             // fn_lotes_disponibles_por_proyecto
  historialPagosCliente: (clienteId) =>
    request(`/reportes/historial-pagos-cliente/${clienteId}`),                  // fn_historial_pagos_cliente
  cuotasVencidas: () => request("/reportes/cuotas-vencidas"),                   // fn_cuotas_vencidas
  ventasPorMes: (anio) => request(`/reportes/ventas-por-mes/${anio}`),         // fn_ventas_por_mes
  estadisticasLotesEstado: () => request("/reportes/estadisticas-lotes-estado"), // fn_estadisticas_lotes_por_estado
};
