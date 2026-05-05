// ──────────────────────────────────────────────────────────
// api.js — Capa de servicios para SQL Server
// Todos los endpoints llaman procedimientos almacenados,
// vistas o funciones en el servidor.
// BASE_URL apunta al backend (Express)
// ──────────────────────────────────────────────────────────
import type { Proyecto } from "./types/proyecto";
import type { Etapa } from "./types/etapa";
import type { Bloque, BloqueFormInput } from "./types/bloque";
import type { Lote, LoteFormInput } from "./types/lote";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export const authApi = {
  login: (data: any) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// PROYECTOS — sp_proyectos_*
export const proyectosApi = {
  list: (): Promise<Proyecto[]> => request<Proyecto[]>("/proyectos"),                         // EXEC sp_proyectos_listar
  get: (id: number): Promise<Proyecto> => request<Proyecto>(`/proyectos/${id}`),                  // EXEC sp_proyectos_obtener @id
  create: (data: Proyecto): Promise<Proyecto> => request<Proyecto>("/proyectos", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Proyecto): Promise<Proyecto> => request<Proyecto>(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number): Promise<void> => request<void>(`/proyectos/${id}`, { method: "DELETE" }),
  dashboard: (): Promise<any> => request("/proyectos/dashboard"),          // Vista vw_dashboard_proyectos
};

// ETAPAS — sp_etapas_*
export const etapasApi = {
  list: (proyectoId: number): Promise<Etapa[]> =>
    request<Etapa[]>(`/etapas${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),
  get: (id: number): Promise<Etapa> => request<Etapa>(`/etapas/${id}`),
  create: (data: Etapa): Promise<Etapa> => request<Etapa>("/etapas", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Etapa): Promise<Etapa> => request<Etapa>(`/etapas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number): Promise<void> => request<void>(`/etapas/${id}`, { method: "DELETE" }),
  cuentas: (etapaId: number): Promise<any> => request<any>(`/etapas/${etapaId}/cuentas`),
};


// BLOQUES — sp_bloques_*
const normalizeBloquePayload = (data: BloqueFormInput): Bloque => {
  const rawId = data.bloqueId ?? data.bloque_id ?? data.BloqueID ?? null;


  return {
    BloqueID: rawId !== undefined && rawId !== null ? Number(rawId) : null,
    EtapaID: data.EtapaID ?? data.etapaId ?? data.EtapaID ?? null,
    Bloque: data.nombre ?? data.bloque ?? data.Bloque ?? null,
    AreaTotalVaras: data.AreaTotalVaras ?? data.areaTotalVaras ?? data.area_total_varas ?? null,
  };
};

export const bloquesApi = {
  list: (etapaId: number) =>
    request(`/bloques${etapaId ? `?etapaId=${etapaId}` : ""}`),
  get: (id: number) => request(`/bloques/${id}`),
  create: (data: Bloque) => request("/bloques", {
    method: "POST",
    body: JSON.stringify(normalizeBloquePayload(data)),
  }),
  update: (id: number, data: Bloque) => request(`/bloques/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeBloquePayload(data)),
  }),
  remove: (id: number) => request(`/bloques/${id}`, { method: "DELETE" }),
};


// LOTES — sp_lotes_*
const normalizeLotePayload = (data: LoteFormInput) => ({
  BloqueID: data.bloqueId ?? data.BloqueID ?? data.bloque_id ?? null,
  NumeroLote: data.numeroLote ?? data.numero_lote ?? data.codigo_lote ?? data.codigoLote ?? null,
  AreaVaras: data.areaVaras ?? data.area_varas ?? data.AreaVaras ?? data.area_m2 ?? data.areaM2 ?? data.areavaras ?? null,
  PrecioVara: data.precioVara ?? data.precio_vara ?? data.PrecioVara ?? data.precioVara ?? data.precio_vara ?? null,
  Estado: data.estado ?? data.Estado ?? 'Disponible',
  FechaReserva: data.fechaReserva ?? data.FechaReserva ?? null
});

const normalizeLoteDisponible = (data: LoteFormInput) => ({
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
  list: (bloqueId: number) =>
    request(`/lotes${bloqueId ? `?bloqueId=${bloqueId}` : ""}`),
  get: (id: number) => request(`/lotes/${id}`),
  //create: (data) => request("/lotes", { method: "POST", body: JSON.stringify(normalizeLotePayload(data)) }),
  getByNumero: (numeroLote: string) => request(`/lotes/NumeroLote?NumeroLote=${encodeURIComponent(numeroLote)}`),
  create: (data: Lote) => request("/lotes", { method: "POST", body: JSON.stringify(data) }),
  //update: (id, data) => request(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request(`/lotes/${id}`, { method: "PUT", body: JSON.stringify(normalizeLotePayload(data)) }),
  remove: (id: number) => request(`/lotes/${id}`, { method: "DELETE" }),
  // Vista vw_lotes_disponibles
  disponibles: (filtros: any) =>
    request(`/lotes/disponibles?${new URLSearchParams(filtros)}`),
  // fn_valor_lote(id) — función escalar SQL
  calcularValor: (id: number) => request(`/lotes/${id}/valor`),
  // Lotes disponibles para venta
  disponiblesVenta: () =>
    request("/ventas/lotes/disponibles").then((rows: any) => rows.map(normalizeLoteDisponible)),
};

// ──────────────────────────────────────────────
// PAGOS — sp_pagos_*
// ──────────────────────────────────────────────
export const pagosApi = {
  list: (ventaId: number) =>
    request(`/pagos${ventaId ? `?ventaId=${ventaId}` : ""}`),
  get: (id: number) => request(`/pagos/${id}`),
  registrar: (data: any) => request("/pagos", { method: "POST", body: JSON.stringify(data) }),
  pendientes: (ventaId: number) => request(`/ventas/${ventaId}/cuotas-pendientes`),
  // sp_obtener_plan_pagos — obtener cuotas por VentaID
  planPagos: (ventaId: number) => request(`/pagos/plan-pagos/${ventaId}`),
  // sp_lotes_disponibles_credito — buscar lote por NumeroLote
  lotePorNumero: (numeroLote: string) =>
    request(`/pagos/lotes/disponibles?numeroLote=${encodeURIComponent(numeroLote)}`),
  // sp_lotes_disponibles_credito — buscar lotes por DNI
  lotesPorDni: (dni: string) =>
    request(`/pagos/lotes/disponibles?dni=${encodeURIComponent(dni)}`),
  update: (id: number, data: any) => request(`/pagos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/pagos/${id}`, { method: "DELETE" }),
  // sp_cierre_caja_diario — cursor
  abonar: (data: any) => request("/pagos/registrar", { method: "POST", body: JSON.stringify(data) }),
  cierreDiario: (fecha: string) => request(`/pagos/cierre?fechaCierre=${fecha}&usuarioCajaId=1`),
  crearCierreDiario: (fecha: string, usuarioCajaId: number) =>
    request('/pagos/cierre-diario', {
      method: 'POST',
      body: JSON.stringify({ fechaCierre: fecha, usuarioCajaId }),
      headers: { 'Content-Type': 'application/json' }
    }),

  // Factura de pago
  factura: (id: number) => request(`/pagos/${id}/factura`),
  cuentasPendientes: ({ Estado, Cliente }: { Estado?: string, Cliente?: string }) => {
    const params = new URLSearchParams();
    if (Estado !== undefined && Estado !== null && Estado !== "") {
      params.append("Estado", Estado);
    }
    if (Cliente !== undefined && Cliente !== null && Cliente !== "") {
      params.append("Cliente", Cliente);
    }
    const query = params.toString();
    return request(`/pagos/prestamos-activos${query ? `?${query}` : ""}`)
  },
};
//___________________________________________
// GASTOS - sp_gastos_*
//___________________________________________ 
export const gastosApi = {
  list: (tipo: string, proyecto: string) => {
    const params = new URLSearchParams();
    if (tipo !== undefined && tipo !== null && tipo !== "") {
      params.append("conGastos", tipo);
    }
    if (proyecto !== undefined && proyecto !== null && proyecto !== "") {
      params.append("Proyecto", proyecto);
    }
    const query = params.toString();
    return request(`/gastos${query ? `?${query}` : ""}`);
  },
  listTipos: () => request("/gastos/tipos"),
  create: (data: any) => request("/gastos", { method: "POST", body: JSON.stringify(data) }),
};


// CLIENTES — sp_clientes_*
// ──────────────────────────────────────────────
export const clientesApi = {
  list: (search: string) =>
    request(`/clientes${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  get: (id: number) => request(`/clientes/${id}`),
  getByDni: (dni: string) => request(`/clientes/dni/${dni}`), // Nuevo: obtener por DNI
  create: (data: any) => request("/clientes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/clientes/${id}`, { method: "DELETE" }),
  historial: (id: number) => request(`/clientes/${id}/historial`), // Vista vw_historial_cliente
};

// Aval — sp_aval_*
// ──────────────────────────────────────────────
export const avalApi = {
  list: (search: string) =>
    request(`/aval${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  get: (id: number) => request(`/aval/${id}`),
  getByDni: (dni: string) => request(`/aval/dni/${dni}`), // Nuevo: obtener por DNI
  create: (data: any) => request("/aval", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request(`/aval/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/aval/${id}`, { method: "DELETE" }),
  historial: (id: number) => request(`/aval/${id}/historial`), // Vista vw_historial_cliente
};

// VENTAS — sp_ventas_*
// ──────────────────────────────────────────────
export const ventasApi = {
  list: () => request("/ventas"),
  get: (id: number) => request(`/ventas/${id}`),
  // sp_crear_venta_completa — con manejo transaccional
  create: (data: any) => request("/ventas", { method: "POST", body: JSON.stringify(data) }),//normalizeVentaPayload(data)) }),
  update: (id: number, data: any) => request(`/ventas/${id}`, { method: "PUT", body: JSON.stringify(data) }),//normalizeVentaPayload(data)) }),
  remove: (id: number) => request(`/ventas/${id}`, { method: "DELETE" }),
  // Cancelar venta completa (transaccional)
  cancelar: (id: number, motivo: string) => request(`/ventas/${id}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivoCancelacion: motivo })
  }),
  // sp_generar_plan_pagos — cursor + transacción
  generarPlan: (ventaId: number, params: any) =>
    request(`/ventas/${ventaId}/plan-pagos`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  planPagos: (ventaId: number) => request(`/ventas/${ventaId}/plan-pagos`),
  // fn_tabla_amortizacion(ventaId) — función tipo tabla
  amortizacion: (ventaId: number) => request(`/ventas/${ventaId}/amortizacion`),
  // Estadísticas de ventas
  estadisticas: () => request("/ventas/estadisticas"),
  estadisticasContado: () => request("/ventas/estadisticas/contado"),
  estadisticasCredito: () => request("/ventas/estadisticas/credito"),
  estadisticasMora: () => request("/ventas/estadisticas/mora"),
};

// TRANSACCIONES — Procedimientos con manejo transaccional
// ──────────────────────────────────────────────
export const transaccionesApi = {
  crearVentaCompleta: (data: any) => ventasApi.create(data),
  cancelarVentaCompleta: (ventaId: number, motivo: string) => ventasApi.cancelar(ventaId, motivo),
  crearLoteCompleto: (data: any) => lotesApi.create(data),
  registrarPagoCompleto: (data: any) => pagosApi.registrar(data),
  generarPlanPagos: (ventaId: number, params: any) => ventasApi.generarPlan(ventaId, params),
  cierreCajaDiario: (fecha: string) => pagosApi.cierreDiario(fecha),
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
  list: (etapaId: number) =>
    request(`/cuentas${etapaId ? `?etapaId=${etapaId}` : ""}`),
  get: (id: number) => request(`/cuentas/${id}`),
  create: (data: any) => request("/cuentas", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => request(`/cuentas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/cuentas/${id}`, { method: "DELETE" }),
  movimientos: (id: number) => request(`/cuentas/${id}/movimientos`),
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
  ocupacionLotes: (estado?: string) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
};

// ──────────────────────────────────────────────
// VISTAS
// ──────────────────────────────────────────────
export const vistasApi = {
  list: () => request("/vistas"),
  ocupacionLotes: (estado?: string) => request(`/reportes/ocupacion-lotes?estado=${estado || ""}`), // Vista vw_ocupacion_lotes
  resumenProyectos: () => request("/reportes/resumen-proyectos"), // Vista vw_resumen_proyectos
  prestamosActivos: () => request("/vistas/prestamos-activos"), // Vista vw_prestamos_activos
};

// ──────────────────────────────────────────────
// FUNCIONES
// ──────────────────────────────────────────────
export const funcionesApi = {
  list: () => request("/funciones"),
};

