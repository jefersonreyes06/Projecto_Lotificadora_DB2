import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, Form } from "react-router";
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
  EtapaID: "",
  Bloque: "",
  AreaTotalVaras: "",
  Proyecto: ""
};

export default function BloquesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [proyectoId, setProyectoId] = useState(0);
  const [etapaId, setEtapaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useNotifyError(error);
  
  useEffect(() => {
    proyectosApi.list().then(setProyectos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!proyectoId) { setEtapas([]); return; }
    etapasApi.list().then((etapas) => setEtapas(etapas.filter((e) => e.ProyectoID === proyectoId))).catch(() => {});
  }, [proyectoId]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    bloquesApi
      .get(id)
      .then((data) => {
        setForm({
          Etapa: data.etapa ?? data.Etapa ?? "",
          Proyecto: data.proyecto ?? data.Proyecto ?? "",
          EtapaID: data.etapaId ?? data.EtapaID ?? "",
          Bloque: data.nombre ?? data.Bloque ?? "",
          AreaTotalVaras: data.areaTotalVaras ?? data.AreaTotalVaras ?? ""
        });
      })
      .catch((err) => setError(err.message || "No se pudo cargar el bloque."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /*const set = (key) => (event) => {
    //let value = event.target.value;
    //if (key === "EtapaID") {
    //  value = value ? Number(value) : "";
    //}
    
    setForm((current) => ({ ...current, [key]: value }));
  };*/

  const set = (k) => (event) => {
    setForm((f) => ({ ...f, [k]: event.target.value }));
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
                  <Select value={proyectoId} onChange={(e) => setProyectoId(parseInt(e.target.value))} required disabled={isEdit}>
                      {isEdit && (
                        <option value={proyectoId}>
                          {form.proyecto ?? form.Proyecto ?? "Proyecto actual"}
                        </option>
                      )}
                      {!isEdit && <option value="">Seleccione...</option>}
                      {!isEdit && proyectos.map((p) => (
                        <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>
                      ))}

                  </Select>
                </FormField>
                
                <FormField label="Etapa" required>

                  <Select value={form.EtapaID} onChange={set('EtapaID')} required>
                      {isEdit && (
                        <option value={etapaId}>
                          {form.etapa ?? form.Etapa ?? "Etapa actual"}
                        </option>
                      )}
                      {!isEdit && <option value="">Seleccione...</option>}
                      {!isEdit && etapas.map((e) => (
                        <option key={e.EtapaID} value={e.EtapaID}>{e.Etapa}</option>
                      ))}
                  </Select>
                </FormField>

                <FormField label="Nombre del bloque" required>
                  <Input
                    value={form.Bloque}
                    onChange={set("Bloque")}
                    placeholder="Bloque A"
                    required
                  />
                </FormField>

                <FormField label="Área total (varas²)">
                  <Input
                    type="number"
                    value={form.AreaTotalVaras}
                    onChange={set("AreaTotalVaras")}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </FormField> 
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
