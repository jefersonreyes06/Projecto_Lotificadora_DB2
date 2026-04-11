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
  etapaId: data.etapaId,
  nombre: data.nombre,
  areaTotalVaras: data.area_total_varas ?? data.areaTotalVaras ?? null,
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
  loteId: data.loteId,
  bloqueId: data.bloqueId,
  codigoLote: data.codigo_lote ?? data.codigoLote,
  areaM2: data.area_m2 ?? data.areaM2,
  esEsquina: data.es_esquina ?? data.esEsquina ?? false,
  cercaParque: data.cerca_parque ?? data.cercaParque ?? false,
  calleCerrada: data.calle_cerrada ?? data.calleCerrada ?? false,
  frenteAvenida: data.frente_avenida ?? data.frenteAvenida ?? false,
  estado: data.estado,
  valorTotal: data.valorTotal ?? data.valor_total ?? null,
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
  disponiblesVenta: () => request("/ventas/lotes/disponibles"),
};

// ──────────────────────────────────────────────
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
// VENTAS — sp_ventas_*
// ──────────────────────────────────────────────
export const ventasApi = {
  list: () => request("/ventas"),
  get: (id) => request(`/ventas/${id}`),
  // sp_crear_venta — con manejo transaccional
  create: (data) => request("/ventas", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/ventas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/ventas/${id}`, { method: "DELETE" }),
  // sp_generar_plan_pagos — cursor + transacción
  generarPlan: (ventaId, params) =>
    request(`/ventas/${ventaId}/plan-pagos`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  planPagos: (ventaId) => request(`/ventas/${ventaId}/plan-pagos`),
  // fn_tabla_amortizacion(ventaId) — función tipo tabla
  amortizacion: (ventaId) => request(`/ventas/${ventaId}/amortizacion`),
};

// ──────────────────────────────────────────────
// PAGOS — sp_pagos_*
// ──────────────────────────────────────────────
export const pagosApi = {
  list: (ventaId) =>
    request(`/pagos${ventaId ? `?ventaId=${ventaId}` : ""}`),
  get: (id) => request(`/pagos/${id}`),
  // sp_registrar_pago — transaccional
  registrar: (data) =>
    request("/pagos", { method: "POST", body: JSON.stringify(data) }),
  // sp_cierre_caja_diario — cursor
  cierreDiario: (fecha) =>
    request("/pagos/cierre-diario", {
      method: "POST",
      body: JSON.stringify({ fecha }),
    }),
  // fn_tabla_pagos_pendientes(ventaId) — función tipo tabla
  pendientes: (ventaId) => request(`/ventas/${ventaId}/cuotas-pendientes`),
  factura: (pagoId) => request(`/pagos/${pagoId}/factura`),
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
};
