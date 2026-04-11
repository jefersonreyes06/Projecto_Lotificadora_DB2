// ════════════════════════════════════════
// ClientesList.jsx
// ════════════════════════════════════════
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { clientesApi } from "../../../services/api.js";
import {
  PageHeader, PageContent, Button, Card, DataTable, Badge, Input,
} from "../../components/index";

export function ClientesList() {
  const [dni, setDni] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Buscar cliente por DNI
  const buscarPorDni = useCallback(() => {
    if (!dni || dni.trim().length < 3) {
      setError("Ingrese al menos 3 caracteres del DNI");
      return;
    }

    setLoading(true);
    setError(null);
    
    clientesApi
      .getByDni(dni)
      .then((cliente) => {
        if (cliente) {
          setCliente(cliente);
          setError(null);
          setClienteId("");
        } else {
          setCliente(null);
          setError("Cliente no encontrado");
        }
      })
      .catch((err) => {
        setCliente(null);
        setError(err.message || "Error al buscar cliente");
      })
      .finally(() => setLoading(false));
  }, [dni]);

  // Buscar cliente por ID
  const buscarPorId = useCallback(() => {
    if (!clienteId || clienteId.trim().length === 0) {
      setError("Ingrese un ID de cliente");
      return;
    }

    setLoading(true);
    setError(null);
    
    clientesApi
      .get(clienteId)
      .then((cliente) => {
        if (cliente) {
          setCliente(cliente);
          setError(null);
          setDni("");
        } else {
          setCliente(null);
          setError("Cliente no encontrado");
        }
      })
      .catch((err) => {
        setCliente(null);
        setError(err.message || "Error al buscar cliente");
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  const cols = [
    { key: "nombre", label: "Nombre", render: (v, r) => `${v} ${r.apellido}` },
    { key: "dni", label: "DNI / Identidad" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "empresa", label: "Empresa / Empleador" },
    {
      key: "total_compras",
      label: "Compras",
      render: (v) => <Badge variant={v > 0 ? "success" : "default"}>{v ?? 0}</Badge>,
    },
    {
      key: "id",
      label: "",
      width: 90,
      render: (id) => (
        <Link to={`/clientes/${id}/editar`}>
          <Button size="sm" variant="ghost">Editar</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="sp_clientes_listar — búsqueda en servidor"
        actions={
          <Link to="/clientes/nuevo">
            <Button>+ Nuevo cliente</Button>
          </Link>
        }
      />
      <PageContent>
        <div className="space-y-4">
          {/* Campos de búsqueda por DNI e ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de búsqueda por DNI */}
            <Card className="p-4">
              <label className="block text-sm font-semibold mb-2">Buscar por DNI</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ingrese el DNI del cliente"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarPorDni()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={buscarPorDni}
                  disabled={loading || !dni.trim() || dni.trim().length < 3}
                  variant="primary"
                >
                  Buscar
                </Button>
              </div>
            </Card>

            {/* Campo de búsqueda por ID */}
            <Card className="p-4">
              <label className="block text-sm font-semibold mb-2">Buscar por ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ingrese el ID del cliente"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarPorId()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={buscarPorId}
                  disabled={loading || !clienteId.trim()}
                  variant="primary"
                >
                  Buscar
                </Button>
              </div>
            </Card>
          </div>

          {/* Mostrar error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Mostrar datos del cliente encontrado */}
          {cliente && !loading && (
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500 uppercase">Nombre Completo</p>
                  <p className="text-lg font-semibold text-stone-100">{cliente.nombreCompleto}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">DNI</p>
                  <p className="text-lg font-semibold text-stone-100">{cliente.dni}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Teléfono</p>
                  <p className="text-stone-100">{cliente.telefono}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Email</p>
                  <p className="text-stone-100">{cliente.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Empresa</p>
                  <p className="text-stone-100">{cliente.nombreEmpresa || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Dirección</p>
                  <p className="text-stone-100">{cliente.direccion || "—"}</p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-stone-800">
                <Link to={`/clientes/${cliente.id}/editar`}>
                  <Button variant="primary">Editar</Button>
                </Link>
                <Link to="/clientes/nuevo">
                  <Button variant="secondary">Nuevo Cliente</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Mostrar loading */}
          {loading && (
            <div className="text-center text-stone-400 py-8">
              Buscando cliente...
            </div>
          )}

          {/* Mostrar si no hay cliente seleccionado */}
          {!cliente && !loading && !error && dni && (
            <div className="text-center text-stone-500 py-8">
              Ingrese un DNI válido
            </div>
          )}
        </div>
      </PageContent>
    </div>
  );
}

export default ClientesList;
