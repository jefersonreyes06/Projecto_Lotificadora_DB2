import { type RouteConfig, index, layout, route, prefix } from "@react-router/dev/routes";

export default [
  layout("layouts/MainLayout.jsx", [
    index("pages/Dashboard.jsx"),

    // Proyectos
    ...prefix("proyectos", [
      index("pages/proyectos/ProyectosList.jsx"),
      // Añadimos un ID único a cada una
      route("nuevo", "pages/proyectos/ProyectoForm.jsx", { id: "proyecto-nuevo" }),
      route(":id/editar", "pages/proyectos/ProyectoForm.jsx", { id: "proyecto-editar" }),
    ]),

    // Vistas
    ...prefix("vistas", [
      index("pages/reportes/ReporteVistas.jsx"),
      //route("ocupacion-lotes", "pages/reportes/ReporteVistas.jsx"),
      //route("resumen-proyectos", "pages/reportes/ReporteVistas.jsx"),
    ]),

    // Funciones
    ...prefix("funciones", [
      index("pages/reportes/ReporteFunciones.jsx"),
      //route("ocupacion-lotes", "pages/reportes/ReporteVistas.jsx"),
      //route("resumen-proyectos", "pages/reportes/ReporteVistas.jsx"),
    ]),

    // Etapas
    ...prefix("etapas", [
      index("pages/etapas/EtapasList.jsx"),
      route("nueva", "pages/etapas/EtapaForm.jsx", { id: "etapa-nueva" }),
      route(":id/editar", "pages/etapas/EtapaForm.jsx", { id: "etapa-editar" }),
    ]),

    // Bloques
    ...prefix("bloques", [
      index("pages/bloques/BloquesList.jsx"),
      route("nuevo", "pages/bloques/BloquesForm.jsx", { id: "bloque-nuevo" }),
      route(":id/editar", "pages/bloques/BloquesForm.jsx", { id: "bloque-editar" }),
    ]),

    // Lotes
    ...prefix("lotes", [
      index("pages/lotes/LotesList.jsx"),
      route("nuevo", "pages/lotes/LoteForm.jsx", { id: "lote-nuevo" }),
      route(":id/editar", "pages/lotes/LoteForm.jsx", { id: "lote-editar" }),
    ]),
    route("disponibles", "pages/lotes/LotesDisponibles.jsx"),

    // Clientes
    ...prefix("clientes", [
      index("pages/clientes/ClientesList.jsx"),
      route("nuevo", "pages/clientes/ClienteForm.jsx", { id: "cliente-nuevo" }),
      route(":id/editar", "pages/clientes/ClienteForm.jsx", { id: "cliente-editar" }),
    ]),

    // Ventas
    ...prefix("ventas", [
      index("pages/ventas/VentasList.jsx"),
      route("nueva", "pages/ventas/VentaForm.jsx"),
      route(":id", "pages/ventas/VentaDetalle.jsx"),
      route(":id/plan-pagos", "pages/ventas/PlanPagos.jsx"),
    ]),

    // Pagos
    ...prefix("pagos", [
      index("pages/pagos/PagosList.jsx"),
      route("cuentas-activas", "pages/pagos/VentasActivaList.jsx"),
      route(":id", "pages/pagos/PagoForm.jsx"),
    ]),

    // Gastos
    ...prefix("gastos", [
      index("pages/gastos/GastosList.jsx"),
      route("nuevo/:id", "pages/gastos/GastoForm.jsx", { id: "gasto-nuevo" }),
      //route("tipos", "pages/gastos/GastoForm.jsx")
      //route(":id/editar", "pages/gastos/GastoForm.jsx", { id: "gasto-editar" }),
    ]),

    // Cuentas
    ...prefix("cuentas", [
      index("pages/cuentas/CuentasList.jsx"),
      route("nuevo", "pages/cuentas/CuentaForm.jsx", { id: "cuenta-nueva" }),
      route(":id/editar", "pages/cuentas/CuentaForm.jsx", { id: "cuenta-editar" }),
      route(":id/movimientos", "pages/cuentas/CuentaMovimientos.jsx", { id: "cuenta-movimientos" }),
    ]),


  ]),] satisfies RouteConfig;


