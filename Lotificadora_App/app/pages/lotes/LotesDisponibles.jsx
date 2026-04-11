import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  PageHeader, PageContent, Card, DataTable, Badge, FormField, Select, Button, Input, Modal, Alert,
} from "../../components/index";
import { lotesApi, proyectosApi, etapasApi, bloquesApi, clientesApi, ventasApi } from "../../services/api";

const ESTADO_COLORS = {
  Disponible: "success",
  Vendido: "danger",
  Reservado: "warning",
  "En proceso": "info",
};

export default function LotesDisponibles() {
  const [lotes, setLotes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftFiltros, setDraftFiltros] = useState({
    proyectoId: "",
    etapaId: "",
    bloqueId: "",
    areaMin: "",
    areaMax: "",
  });
  const [filtros, setFiltros] = useState({
    proyectoId: "",
    etapaId: "",
    bloqueId: "",
    areaMin: "",
    areaMax: "",
  });

  // Modal de venta
  const [ventaModal, setVentaModal] = useState({ open: false, lote: null });
  const [clienteDni, setClienteDni] = useState("");
  const [clienteData, setClienteData] = useState(null);
  const [ventaForm, setVentaForm] = useState({
    tipoVenta: "Contado",
    prima: "",
    aniosPlazo: 10,
  });
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [creandoVenta, setCreandoVenta] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([proyectosApi.list(), lotesApi.disponiblesVenta()])
      .then(([projectList, lotesList]) => {
        setProyectos(projectList);
        setLotes(lotesList);
      })
      .catch((err) => setError(err.message || "Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draftFiltros.proyectoId) {
      setEtapas([]);
      setBloques([]);
      return;
    }
    etapasApi.list(draftFiltros.proyectoId).then(setEtapas).catch(() => setEtapas([]));
  }, [draftFiltros.proyectoId]);

  useEffect(() => {
    if (!draftFiltros.etapaId || !draftFiltros.proyectoId) {
      setBloques([]);
      return;
    }
    bloquesApi.list().then((bloques) => setBloques(bloques.filter((b) => b.EtapaID === draftFiltros.etapaId))).catch(() => setBloques([]));
  }, [draftFiltros.etapaId, draftFiltros.proyectoId]);

  const buscar = () => {
    setFiltros(draftFiltros);
  };

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setDraftFiltros((prev) => {
      if (key === "proyectoId") {
        return { ...prev, proyectoId: value, etapaId: "", bloqueId: "" };
      }
      if (key === "etapaId") {
        return { ...prev, etapaId: value, bloqueId: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  // Funciones para la modal de venta
  const abrirVentaModal = (lote) => {
    setVentaModal({ open: true, lote });
    setClienteDni("");
    setClienteData(null);
    setVentaForm({ tipoVenta: "Contado", prima: "", aniosPlazo: 10 });
  };

  const cerrarVentaModal = () => {
    setVentaModal({ open: false, lote: null });
  };

  const buscarCliente = async () => {
    if (!clienteDni.trim()) return;
    setBuscandoCliente(true);
    try {
      const cliente = await clientesApi.getByDni(clienteDni);
      setClienteData(cliente);
    } catch (err) {
      setClienteData(null);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const crearVenta = async () => {
    if (!clienteData) return;
    setCreandoVenta(true);
    try {
      const montoTotal = ventaModal.lote.valor_total;
      const prima = ventaForm.tipoVenta === "Contado" ? 0 : (parseFloat(ventaForm.prima) || 0);
      const montoFinanciado = ventaForm.tipoVenta === "Financiado" ? montoTotal - prima : 0;
      const aniosPlazo = ventaForm.tipoVenta === "Contado" ? 0 : ventaForm.aniosPlazo;

      console.log(clienteData, ventaModal.lote, ventaForm);
      await ventasApi.create({
        ClienteID: clienteData.id,
        LoteID: ventaModal.lote.id,
        TipoVenta: ventaForm.tipoVenta,
        MontoTotal: montoTotal,
        Prima: prima,
        MontoFinanciado: montoFinanciado,
        AniosPlazo: aniosPlazo,
        TasaInteresAplicada: 12.0, // Asumiendo tasa fija, ajustar según necesidad
      });

      // Actualizar la lista de lotes
      setLotes(prev => prev.filter(l => l.id !== ventaModal.lote.id));
      cerrarVentaModal();
      alert("Venta creada exitosamente");
    } catch (err) {
      console.log(err.message)
    } finally {
      setCreandoVenta(false);
    }
  };

  const filteredLotes = useMemo(() => {
    return lotes.filter((item) => {
      const proyectoId = String(item.proyectoId ?? "");
      const etapaId = String(item.etapaId ?? "");
      const area = parseFloat(item.area_m2 ?? 0) || 0;

      const matchesProyecto = filtros.proyectoId
        ? proyectoId === filtros.proyectoId
        : true;
      const matchesEtapa = filtros.etapaId
        ? etapaId === filtros.etapaId
        : true;
      const matchesBloque = filtros.bloqueId
        ? String(item.bloqueId ?? "") === filtros.bloqueId
        : true;
      const matchesAreaMin = filtros.areaMin ? area >= parseFloat(filtros.areaMin) : true;
      const matchesAreaMax = filtros.areaMax ? area <= parseFloat(filtros.areaMax) : true;

      const result = matchesProyecto && matchesEtapa && matchesBloque && matchesAreaMin && matchesAreaMax;
      return result;
    });
  }, [lotes, filtros]);

  const columns = [
    { key: "codigo_lote", label: "Número de Lote" },
    { key: "proyecto", label: "Proyecto" },
    { key: "etapa", label: "Etapa" },
    { key: "bloque", label: "Bloque" },
    {
      key: "area_m2",
      label: "Área (v²)",
      render: (v) => {
        const numValue = parseFloat(v) || 0;
        return <span className="text-stone-300">{numValue.toLocaleString()}</span>;
      },
    },
    {
      key: "precio_final",
      label: "Precio Final",
      render: (v) => {
        const numValue = parseFloat(v) || 0;
        return (
          <span className="text-amber-400 font-medium">
            L {numValue.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <Button size="sm" onClick={() => abrirVentaModal(row)}>
          Vender
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lotes Disponibles"
        subtitle="Vista: vw_lotes_disponibles — consulta directa al servidor"
      />
      <PageContent>
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        {/* Filtros */}
        <Card className="p-5 mb-6">
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4 font-semibold">
            Filtros de búsqueda
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Proyecto">
              <Select value={draftFiltros.proyectoId} onChange={handleChange("proyectoId")}>
                <option value="">Todos</option>
                {proyectos.map((p) => (
                  <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Etapa">
              <Select
                value={draftFiltros.etapaId}
                onChange={handleChange("etapaId")}
                disabled={!draftFiltros.proyectoId}
              >
                <option value="">Todas</option>
                {etapas.map((e) => (
                  <option key={e.EtapaID} value={e.EtapaID}>{e.Etapa}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Bloque">
              <Select
                value={draftFiltros.bloqueId}
                onChange={handleChange("bloqueId")}
                disabled={!draftFiltros.etapaId}
              >
                <option value="">Todos</option>
                {bloques.map((b) => (
                  <option key={b.BloqueID} value={b.BloqueID}>{b.Nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Área mín (v²)">
              <Input
                type="number"
                placeholder="0"
                value={draftFiltros.areaMin}
                onChange={handleChange("areaMin")}
              />
            </FormField>

            <FormField label="Área máx (v²)">
              <Input
                type="number"
                placeholder="9999"
                value={draftFiltros.areaMax}
                onChange={handleChange("areaMax")}
              />
            </FormField>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={buscar}>
              Buscar lotes
            </Button>
          </div>
        </Card>

        {/* Resultados */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-stone-500">
            {filteredLotes.length > 0
              ? `${filteredLotes.length} lote(s) encontrado(s)`
              : "Use los filtros para consultar"}
          </p>
        </div>

        <Card>
          <DataTable columns={columns} data={filteredLotes} loading={loading} />
        </Card>

        {/* Modal de Venta */}
        <Modal open={ventaModal.open} onClose={cerrarVentaModal} title="Vender Lote">
          {ventaModal.lote && (
            <div className="space-y-4">
              <div className="bg-stone-800 p-4 rounded">
                <h3 className="font-semibold mb-2">Detalles del Lote</h3>
                <p><strong>Lote:</strong> {ventaModal.lote.codigo_lote}</p>
                <p><strong>Proyecto:</strong> {ventaModal.lote.proyecto}</p>
                <p><strong>Precio:</strong> L {parseFloat(ventaModal.lote.precio_final).toLocaleString("es-HN", { minimumFractionDigits: 2 })}</p>
              </div>

              <FormField label="DNI del Cliente">
                <div className="flex gap-2">
                  <Input
                    value={clienteDni}
                    onChange={(e) => setClienteDni(e.target.value)}
                    placeholder="Ingrese DNI"
                  />
                  <Button onClick={buscarCliente} loading={buscandoCliente}>
                    Buscar
                  </Button>
                </div>
              </FormField>

              {clienteData && (
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded">
                  <h4 className="font-semibold mb-2">Cliente Encontrado</h4>
                  <p><strong>Nombre:</strong> {clienteData.nombreCompleto}</p>
                  <p><strong>DNI:</strong> {clienteData.dni}</p>
                  <p><strong>Teléfono:</strong> {clienteData.telefono || clienteData.telefono}</p>
                  <p><strong>Empresa:</strong> {clienteData.nombreEmpresa || clienteData.NombreEmpresa}</p>
                  <p><strong>Ocupacion:</strong> {clienteData.ocupacion || clienteData.Ocupacion}</p>
                  <p><strong>Ingreso Mensual:</strong> {clienteData.ingresoMensual || clienteData.IngresoMensual}</p>
                  <p><strong>Estado:</strong> {clienteData.estado || clienteData.Estado}</p>


                  {/*<pre className="text-xs mt-2 text-stone-400">
                    {JSON.stringify(clienteData, null, 2)}
                  </pre>*/}
                </div>
              )}

              {!clienteData && clienteDni && !buscandoCliente && (
                <Alert variant="warning">
                  Cliente no encontrado. <Link to="/clientes/nuevo" className="underline">Registrar nuevo cliente</Link>
                </Alert>
              )}

                  {clienteData && (
                    <>
                      <FormField label="Tipo de Venta">
                        <Select
                          value={ventaForm.tipoVenta}
                          onChange={(e) => setVentaForm(prev => ({ ...prev, tipoVenta: e.target.value }))}
                        >
                          <option value="Contado">Contado</option>
                          <option value="Credito">Credito</option>
                        </Select>
                      </FormField>

                      {ventaForm.tipoVenta === "Credito" && (
                        <>
                          <FormField label="Prima">
                            <Input
                              type="number"
                              value={ventaForm.prima}
                              onChange={(e) => setVentaForm(prev => ({ ...prev, prima: e.target.value }))}
                              placeholder="Monto de prima"
                            />
                          </FormField>
                          <FormField label="Años de Plazo">
                            <Input
                              type="number"
                              value={ventaForm.aniosPlazo}
                              onChange={(e) => setVentaForm(prev => ({ ...prev, aniosPlazo: e.target.value }))}
                              placeholder="Años"
                            />
                          </FormField>
                        </>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={cerrarVentaModal}>
                          Cancelar
                        </Button>
                        <Button onClick={crearVenta} loading={creandoVenta}>
                          Crear Venta
                        </Button>
                      </div>
                    </>
                  )}
            </div>
          )}
        </Modal>
      </PageContent>
    </div>
  );
}
