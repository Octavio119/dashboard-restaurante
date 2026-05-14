import { useState, useCallback } from 'react';
import { api } from '../api';

export const useInventario = ({ user }) => {
  const [inventarioTab, setInventarioTab] = useState('stock');
  const [proveedores,   setProveedores]   = useState([]);
  const [movimientos,   setMovimientos]   = useState([]);
  const [movStats,      setMovStats]      = useState({ entrada: { count: 0, total: 0 }, salida: { count: 0, total: 0 }, ajuste: { count: 0, total: 0 } });
  const [movTotal,      setMovTotal]      = useState(0);
  const [movFiltros,    setMovFiltros]    = useState({ tipo: '', producto_id: '', fecha_desde: '', fecha_hasta: '' });
  const [proveedorForm, setProveedorForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '' });
  const [isProvModalOpen, setIsProvModalOpen] = useState(false);
  const [isMovModalOpen,  setIsMovModalOpen]  = useState(false);
  const [movimientoForm,  setMovimientoForm]  = useState({ producto_id: '', tipo: 'entrada', cantidad: '', notas: '', proveedor_id: '' });
  const [invLoading,    setInvLoading]    = useState(false);
  const [isSavingMov,   setIsSavingMov]   = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadInventario = useCallback(async (filtros = {}) => {
    try {
      setInvLoading(true);
      const [p, movRes] = await Promise.all([
        api.getProveedores(),
        api.getMovimientos(filtros)
      ]);
      setProveedores(p);
      setMovimientos(movRes.rows ?? movRes);
      if (movRes.stats) setMovStats(movRes.stats);
      if (movRes.total !== undefined) setMovTotal(movRes.total);
    } catch(e) { console.error(e); }
    finally { setInvLoading(false); }
  }, []);

  const saveProveedor = async () => {
    try {
      if (proveedorForm.id) {
        await api.updateProveedor(proveedorForm.id, proveedorForm);
      } else {
        await api.createProveedor(proveedorForm);
      }
      setIsProvModalOpen(false);
      loadInventario();
    } catch(e) { alert(e.message); }
  };

  const deleteProveedor = async (id) => {
    if (!confirm('¿Seguro que desea eliminar este proveedor?')) return;
    try {
      await api.deleteProveedor(id);
      loadInventario();
    } catch(e) { alert(e.message); }
  };

  const saveMovimiento = async (userId, loadProductos) => {
    try {
      if (!movimientoForm.producto_id || !movimientoForm.cantidad) return alert('Complete los campos obligatorios');
      setIsSavingMov(true);
      await api.createMovimiento({ ...movimientoForm, usuario_id: userId });
      setIsMovModalOpen(false);
      setSuccessMessage('Movimiento registrado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      setMovimientoForm({ producto_id:'', tipo:'entrada', cantidad:'', proveedor_id:'', notas:'' });
      loadInventario(movFiltros);
      loadProductos();
    } catch(e) { alert(e.message); }
    finally { setIsSavingMov(false); }
  };

  return {
    inventarioTab, setInventarioTab,
    proveedores, setProveedores,
    movimientos, setMovimientos,
    movStats, movTotal,
    movFiltros, setMovFiltros,
    proveedorForm, setProveedorForm,
    isProvModalOpen, setIsProvModalOpen,
    isMovModalOpen, setIsMovModalOpen,
    movimientoForm, setMovimientoForm,
    invLoading, isSavingMov,
    successMessage,
    loadInventario,
    saveProveedor, deleteProveedor, saveMovimiento,
  };
};
