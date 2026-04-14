import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { bloquesApi, etapasApi, proyectosApi } from "../../services/api.js";
import { notify, useNotifyError } from "../../utils/notify";

import {
  PageHeader,
  PageContent,
  Button,
  FormField,
  Input,
  Select,
  Card,
  Alert,
} from "../../components/index";

const EMPTY = {
  etapaId: "",
  nombre: "",
  areaTotalVaras: ""
};

export default function BloquesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useNotifyError(error);
  
  useEffect(() => { proyectosApi.list().then(setProyectos).catch(() => {}); }, []);
  useEffect(() => {
    etapasApi.list().then((d) => setEtapas(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    bloquesApi
      .get(id)
      .then((data) => {
        setForm({
          //etapa: data.etapa ?? data.Etapa ?? "",
          etapaId: data.etapaId ?? data.EtapaID ?? "",
          nombre: data.nombre ?? data.Bloque ?? "",
          areaTotaVaras: data.areaTotalVaras ?? data.AreaTotalVaras ?? ""
        });
      })
      .catch((err) => setError(err.message || "No se pudo cargar el bloque."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (event) => {
    let value = event.target.value;
    if (key === "etapaId") {
      value = value ? Number(value) : "";
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await bloquesApi.update(id, form);
        notify.success("Bloque actualizado correctamente");
      } else {
        await bloquesApi.create(form);
        notify.success("Bloque creado correctamente");
      }
      navigate("/bloques");
    } catch (err) {
      const message = err.message || "Error al guardar el bloque.";
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Bloque" : "Nuevo Bloque"}
        subtitle={isEdit ? `sp_bloques_actualizar @id=${id}` : "sp_bloques_insertar"}
        actions={
          <Link to="/bloques">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />

      <PageContent>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <p className="text-sm text-stone-500 animate-pulse">Cargando bloque...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Proyecto" required isDisabled>
                  <Select value={form.ProyectoID} onChange={set("ProyectoID")} required disabled={isEdit}>
                    <option value="">Seleccione proyecto...</option>
                    {proyectos.map((p) => <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>)}
                  </Select>
                </FormField>
                <FormField label="Etapa" required>
                  <Select value={form.etapaId} onChange={set("etapaId")} required disabled={isEdit}>
                    {isEdit && (
                      <option value={form.etapaId}>
                        {form.etapa ?? form.Etapa}
                      </option>
                    )}

                    {!isEdit && <option value="">Seleccione etapa...</option>}
                    {!isEdit && etapas.map((etapa) => (
                      <option key={etapa.EtapaID ?? etapa.id} value={etapa.EtapaID ?? etapa.id}>
                        {etapa.nombre ?? etapa.Etapa}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Nombre del bloque" required>
                  <Input
                    value={form.nombre}
                    onChange={set("nombre")}
                    placeholder="Bloque A"
                    required
                  />
                </FormField>

                <FormField label="Área total (varas²)">
                  <Input
                    type="number"
                    value={form.areaTotalVaras}
                    onChange={set("areaTotalVaras")}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </FormField> 

                {/*<FormField label="Estado">
                  <Select value={form.estado} onChange={set("estado")}>
                    <option value="Disponible">Disponible</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                  </Select>
                </FormField>*/}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-800">
                <Link to="/bloques">
                  <Button variant="secondary">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : isEdit ? "Actualizar bloque" : "Crear bloque"}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </PageContent>
    </div>
  );
}
