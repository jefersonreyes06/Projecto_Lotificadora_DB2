// EjemploTransacciones.jsx - Ejemplo de uso de procedimientos transaccionales
import { useState } from "react";
import { ventasApi, pagosApi, lotesApi } from "../services/api";

export default function EjemploTransacciones() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ejemplo 1: Crear venta completa
  const crearVenta = async () => {
    setLoading(true);
    try {
      const ventaData = {
        clienteId: 1,
        loteId: 5,
        tipoVenta: 'Financiado',
        prima: 10000,
        aniosPlazo: 3,
        tasaInteresAplicada: 10.5
      };

      const resultado = await ventasApi.create(ventaData);
      setResultado({
        tipo: 'venta',
        exito: resultado.exito,
        mensaje: resultado.mensaje,
        ventaId: resultado.ventaId
      });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 2: Registrar pago completo
  const registrarPago = async () => {
    setLoading(true);
    try {
      const pagoData = {
        cuotaId: 15,
        montoRecibido: 2500,
        metodoPago: 'Transferencia',
        numeroDeposito: 'DEP-2024-001',
        cuentaBancariaId: 1,
        usuarioCajaId: 2,
        observaciones: 'Pago de cuota mensual'
      };

      const resultado = await pagosApi.registrar(pagoData);
      setResultado({
        tipo: 'pago',
        exito: resultado.exito,
        mensaje: resultado.mensaje,
        pagoId: resultado.pagoId,
        facturaId: resultado.facturaId,
        numeroFactura: resultado.numeroFactura
      });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 3: Crear lote con características
  const crearLote = async () => {
    setLoading(true);
    try {
      const loteData = {
        bloqueId: 3,
        numeroLote: 'B-25',
        areaVaras: 300.75,
        precioBase: 200000,
        caracteristicas: [1, 2, 4] // IDs de características (esquina, parque, etc.)
      };

      const resultado = await lotesApi.create(loteData);
      setResultado({
        tipo: 'lote',
        exito: resultado.exito,
        mensaje: resultado.mensaje,
        loteId: resultado.loteId
      });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo 4: Cancelar venta
  const cancelarVenta = async () => {
    setLoading(true);
    try {
      const ventaId = 10; // ID de venta a cancelar
      const motivo = 'Cancelación solicitada por el cliente';

      const resultado = await ventasApi.cancelar(ventaId, motivo);
      setResultado({
        tipo: 'cancelacion',
        exito: resultado.exito,
        mensaje: resultado.mensaje,
        ventaId: resultado.ventaId
      });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ejemplos de Procedimientos Transaccionales</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={crearVenta}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Crear Venta Completa
        </button>

        <button
          onClick={registrarPago}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Registrar Pago Completo
        </button>

        <button
          onClick={crearLote}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Crear Lote con Características
        </button>

        <button
          onClick={cancelarVenta}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Cancelar Venta
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Procesando transacción...</p>
        </div>
      )}

      {resultado && (
        <div className={`p-4 rounded-lg border ${
          resultado.exito === 1 || resultado.tipo === 'venta' || resultado.tipo === 'pago' || resultado.tipo === 'lote' || resultado.tipo === 'cancelacion'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">
            {resultado.tipo === 'venta' && 'Venta Creada'}
            {resultado.tipo === 'pago' && 'Pago Registrado'}
            {resultado.tipo === 'lote' && 'Lote Creado'}
            {resultado.tipo === 'cancelacion' && 'Venta Cancelada'}
            {resultado.tipo === 'error' && 'Error'}
          </h3>

          <p className="text-sm mb-2">{resultado.mensaje}</p>

          {resultado.ventaId && (
            <p className="text-xs text-gray-600">ID Venta: {resultado.ventaId}</p>
          )}
          {resultado.pagoId && (
            <div className="text-xs text-gray-600">
              <p>ID Pago: {resultado.pagoId}</p>
              <p>ID Factura: {resultado.facturaId}</p>
              <p>Número Factura: {resultado.numeroFactura}</p>
            </div>
          )}
          {resultado.loteId && (
            <p className="text-xs text-gray-600">ID Lote: {resultado.loteId}</p>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Información Importante</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Todas las operaciones son transaccionales - si algo falla, se revierte todo</li>
          <li>• Se generan automáticamente facturas para pagos</li>
          <li>• Los lotes se marcan como vendidos automáticamente</li>
          <li>• Se registra auditoría completa de todas las operaciones</li>
          <li>• Las validaciones de negocio están centralizadas en los procedimientos</li>
        </ul>
      </div>
    </div>
  );
}