import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';
import { updateItemQty } from '../lib/pedidoQtyUtils';

export const usePedidos = ({ user, dateFilter, salesFilter }) => {
  const queryClient = useQueryClient();

  const [pedidos, setPedidos] = useState([]);

  // POS modal
  const [pedidoModal,     setPedidoModal]     = useState(false);
  const [pedidoForm,      setPedidoForm]      = useState({ cliente_nombre:'', mesa:'' });
  const [pedidoItems,     setPedidoItems]     = useState([]);
  const [pedidoCatFilter, setPedidoCatFilter] = useState('Todos');
  const [pedidoSearch,    setPedidoSearch]    = useState('');
  const [pedidoLoading,   setPedidoLoading]   = useState(false);
  const [clienteSearchResults, setClienteSearchResults] = useState([]);
  const [isSearchingClientes,  setIsSearchingClientes]  = useState(false);

  // Conversión pedido → venta
  const [pedidoConvertModal, setPedidoConvertModal] = useState(null);
  const [convertMetodo,      setConvertMetodo]      = useState('efectivo');
  const [convertLoading,     setConvertLoading]     = useState(false);

  // Vista por mesa
  const [pedidoMesaView,    setPedidoMesaView]    = useState(false);
  const [mesasPedidos,      setMesasPedidos]      = useState([]);
  const [pedidoDetalle,     setPedidoDetalle]     = useState(null);
  const [pedidoDetalleItems, setPedidoDetalleItems] = useState([]);
  const [addItemSearch,     setAddItemSearch]     = useState('');
  const [addItemLoading,    setAddItemLoading]    = useState(null);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [adminModal,    setAdminModal]    = useState(null);

  const pedidosQ = useQuery({
    queryKey: qk.pedidos(dateFilter),
    queryFn:  () => api.getPedidos(dateFilter).then(d => Array.isArray(d) ? d : (d?.rows || [])),
    enabled:  !!user,
    staleTime: 30_000,
  });

  const mesasPedidosQ = useQuery({
    queryKey: qk.mesasPedidos(),
    queryFn:  () => api.getPedidosPorMesa(),
    enabled:  !!user && pedidoMesaView,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (pedidosQ.data && !pedidos.some(p => String(p.id).startsWith('temp-'))) {
      setPedidos(pedidosQ.data);
    }
  }, [pedidosQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mesasPedidosQ.data) setMesasPedidos(mesasPedidosQ.data);
  }, [mesasPedidosQ.data]);

  // Debounced client search inside POS modal
  useEffect(() => {
    const query = pedidoForm.cliente_nombre;
    if (pedidoModal && query.length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingClientes(true);
        try {
          const results = await api.getClientes(query);
          setClienteSearchResults(results);
        } catch(e) { console.error(e); }
        finally { setIsSearchingClientes(false); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setClienteSearchResults([]);
    }
  }, [pedidoForm.cliente_nombre, pedidoModal]);

  const loadPedidos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.pedidos(dateFilter) });
  }, [queryClient, dateFilter]);

  const loadMesasPedidos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.mesasPedidos() });
  }, [queryClient]);

  const updatePedidoEstado = async (id, estado) => {
    try {
      await api.updatePedidoEstado(id, estado);
      setPedidos(p => p.map(o => o.id === id ? { ...o, estado } : o));
    } catch(e) { alert(e.message); }
  };

  const deletePedido = (pedido, isAdmin) => {
    if (!isAdmin) {
      setConfirmDialog({ title:'Sin permiso', message:'Solo administradores pueden eliminar pedidos.', onConfirm:() => setConfirmDialog(null), danger:false });
      return;
    }
    setAdminModal({
      title:   'Acción protegida',
      message: `Vas a eliminar el pedido ${pedido.numero} de ${pedido.cliente_nombre}. Esta acción no se puede deshacer.`,
      onConfirm: async (code) => {
        await api.deletePedido(pedido.id, code);
        setPedidos(p => p.filter(o => o.id !== pedido.id));
        setAdminModal(null);
      },
    });
  };

  const confirmarConversionVenta = (pedido) => {
    setConvertMetodo('efectivo');
    setPedidoConvertModal(pedido);
  };

  const ejecutarConversionVenta = async () => {
    if (!pedidoConvertModal) return;
    setConvertLoading(true);
    try {
      await api.updatePedidoEstado(pedidoConvertModal.id, 'confirmado', { metodo_pago: convertMetodo });
      setPedidos(p => p.map(o => o.id === pedidoConvertModal.id ? { ...o, estado: 'confirmado', metodo_pago: convertMetodo } : o));
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: qk.ventasResumen(salesFilter) });
      if (pedidoMesaView) loadMesasPedidos();
      setPedidoConvertModal(null);
    } catch(e) { alert(e.message); }
    finally { setConvertLoading(false); }
  };

  const openPedidoDetalle = (pedido) => {
    setPedidoDetalle(pedido);
    setPedidoDetalleItems(pedido.items || []);
    setAddItemSearch('');
  };

  const handleAddPedidoItem = async (producto) => {
    if (!pedidoDetalle || addItemLoading === producto.id) return;
    const existing = pedidoDetalleItems.find(i => i.producto_id === producto.id);
    if (existing) {
      handleUpdatePedidoItemQty(existing.id, existing.cantidad + 1);
      return;
    }
    setAddItemLoading(producto.id);
    try {
      const nuevo = await api.addPedidoItem(pedidoDetalle.id, {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio,
      });
      setPedidoDetalleItems(prev => [...prev, nuevo]);
      const newTotal = pedidoDetalle.total + producto.precio;
      setPedidos(p => p.map(o => o.id !== pedidoDetalle.id ? o
        : { ...o, total: newTotal, items: [...(o.items||[]), nuevo] }));
      setPedidoDetalle(prev => ({ ...prev, total: newTotal }));
      if (pedidoMesaView) loadMesasPedidos();
    } catch(e) { alert(e.message); }
    finally { setAddItemLoading(null); }
  };

  const handleUpdatePedidoItemQty = (itemId, nuevaCantidad) => {
    if (!pedidoDetalle) return;
    if (nuevaCantidad < 1) { handleDeletePedidoItem(itemId); return; }
    setPedidoDetalleItems(prev => {
      const { items: updated, total: nuevoTotal } = updateItemQty(prev, itemId, nuevaCantidad);
      setPedidoDetalle(p => ({ ...p, total: nuevoTotal }));
      setPedidos(p => p.map(o => o.id === pedidoDetalle.id
        ? { ...o, total: nuevoTotal, items: (o.items||[]).map(i => i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i) }
        : o));
      return updated;
    });
  };

  const handleDeletePedidoItem = async (itemId) => {
    if (!pedidoDetalle) return;
    try {
      const res = await api.deletePedidoItem(pedidoDetalle.id, itemId);
      const filtered = pedidoDetalleItems.filter(i => i.id !== itemId);
      setPedidoDetalleItems(filtered);
      setPedidos(p => p.map(o => o.id === pedidoDetalle.id ? { ...o, total: res.nuevoTotal, items: filtered } : o));
      setPedidoDetalle(prev => ({ ...prev, total: res.nuevoTotal }));
      if (pedidoMesaView) loadMesasPedidos();
    } catch(e) { alert(e.message); }
  };

  return {
    pedidos, setPedidos,
    pedidoModal, setPedidoModal,
    pedidoForm, setPedidoForm,
    pedidoItems, setPedidoItems,
    pedidoCatFilter, setPedidoCatFilter,
    pedidoSearch, setPedidoSearch,
    pedidoLoading, setPedidoLoading,
    clienteSearchResults, setClienteSearchResults,
    isSearchingClientes,
    pedidoConvertModal, setPedidoConvertModal,
    convertMetodo, setConvertMetodo,
    convertLoading,
    pedidoMesaView, setPedidoMesaView,
    mesasPedidos, setMesasPedidos,
    pedidoDetalle, setPedidoDetalle,
    pedidoDetalleItems, setPedidoDetalleItems,
    addItemSearch, setAddItemSearch,
    addItemLoading,
    confirmDialog, setConfirmDialog,
    adminModal, setAdminModal,
    loadPedidos, loadMesasPedidos,
    updatePedidoEstado, deletePedido,
    confirmarConversionVenta, ejecutarConversionVenta,
    openPedidoDetalle,
    handleAddPedidoItem, handleUpdatePedidoItemQty, handleDeletePedidoItem,
    pedidosLoading: pedidosQ.isLoading,
  };
};
