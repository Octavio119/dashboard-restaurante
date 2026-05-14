import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

export const useReservas = ({ user, selectedDate, setSelectedDate, reservasPeriodo, setReservasPeriodo }) => {
  const queryClient = useQueryClient();

  const [reservas,  setReservas]  = useState([]);
  const [totalReservas, setTotalReservas] = useState(0);
  const [autoReminder,  setAutoReminder]  = useState(true);
  const [autoWhatsApp,  setAutoWhatsApp]  = useState(true);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [newResData, setNewResData] = useState({
    name:'', email:'', phone:'', time:'19:00', people:2,
    date: new Date().toISOString().split('T')[0], table:''
  });
  const [lastCreatedRes, setLastCreatedRes] = useState(null);
  const [addResLoading, setAddResLoading] = useState(false);
  const [crearPedidoRes,     setCrearPedidoRes]     = useState(null);
  const [crearPedidoLoading, setCrearPedidoLoading] = useState(false);
  const [reservaConsumoModal, setReservaConsumoModal] = useState(null);
  const [reservaItems,        setReservaItems]        = useState([]);
  const [resConsumoLoading,   setResConsumoLoading]   = useState(false);
  const [resConsumoBusqueda,  setResConsumoBusqueda]  = useState('');
  const [selectedReservaConsumo, setSelectedReservaConsumo] = useState(null);
  const [adminModal, setAdminModal] = useState(null);

  const reservasQ = useQuery({
    queryKey: qk.reservas(reservasPeriodo, selectedDate),
    queryFn:  async () => {
      const data = reservasPeriodo === 'dia'
        ? await api.getReservas(selectedDate)
        : await api.getReservasPeriodo(reservasPeriodo);
      const normFecha = r => ({ ...r, fecha: (r.fecha || '').toString().split('T')[0] });
      const rows = (Array.isArray(data) ? data : (data?.rows || [])).map(normFecha);
      const totales = await api.getTotalesReservas(reservasPeriodo);
      return { rows, total: totales?.total || 0 };
    },
    enabled:  !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (reservasQ.data) {
      setReservas(reservasQ.data.rows);
      setTotalReservas(reservasQ.data.total);
    }
  }, [reservasQ.data]);

  const loadReservas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['reservas'] });
  }, [queryClient]);

  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month+1, 0).getDate();
    for (let i=0;i<firstDay;i++) days.push(null);
    for (let i=1;i<=numDays;i++) days.push(new Date(year,month,i).toISOString().split('T')[0]);
    return days;
  };

  const sendWhatsApp = (phone, name, date, time, tipo = 'recordatorio') => {
    const clean = phone.replace(/\D/g,'');
    const msgs = {
      confirmacion: `Hola ${name} 👋 Su reserva ha sido *confirmada* para el ${date} a las ${time}. ¡Le esperamos! 🍽️`,
      recordatorio: `Hola ${name} 👋 Le recordamos su reserva para *hoy a las ${time}*. ¡Le esperamos! 🍽️`,
    };
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msgs[tipo]||msgs.recordatorio)}`, '_blank');
  };

  const updateReservaEstado = async (id, estado) => {
    try {
      await api.updateReservaEstado(id, estado);
      setReservas(r => r.map(res => res.id === id ? { ...res, estado } : res));
      if (estado === 'confirmada' || estado === 'asistió') {
        queryClient.invalidateQueries({ queryKey: qk.clientes('') });
      }
    } catch(e) { alert(e.message); }
  };

  const deleteReserva = (res) => {
    setAdminModal({
      title:   'Acción protegida',
      message: `Vas a eliminar la reserva de ${res.nombre} del ${res.fecha} a las ${res.hora}. Esta acción no se puede deshacer.`,
      onConfirm: async (code) => {
        await api.deleteReserva(res.id, code);
        setReservas(r => r.filter(x => x.id !== res.id));
        setAdminModal(null);
      },
    });
  };

  const loadReservaConsumos = async (id) => {
    setResConsumoLoading(true);
    try {
      const items = await api.getReservaConsumos(id);
      setReservaItems(items || []);
    } catch(e) { alert(e.message); }
    finally { setResConsumoLoading(false); }
  };

  const handleAddConsumo = async (producto) => {
    if (!selectedReservaConsumo) return;
    try {
      const nuevo = await api.addReservaConsumo(selectedReservaConsumo.id, {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio
      });
      setReservaItems(prev => [...prev, nuevo]);
      setReservas(prev => prev.map(r => r.id === selectedReservaConsumo.id
        ? { ...r, consumo_base: (r.consumo_base || 0) + producto.precio }
        : r));
    } catch(e) { alert(e.message); }
  };

  const handleDeleteConsumo = async (consumoId) => {
    if (!selectedReservaConsumo) return;
    try {
      const res = await api.deleteReservaConsumo(selectedReservaConsumo.id, consumoId);
      setReservaItems(prev => prev.filter(i => i.id !== consumoId));
      setReservas(prev => prev.map(r => r.id === selectedReservaConsumo.id
        ? { ...r, consumo_base: res.nuevoTotal }
        : r));
    } catch(e) { alert(e.message); }
  };

  const ejecutarCierreCuentaReserva = async () => {
    if (!selectedReservaConsumo || reservaItems.length === 0) return;
    setResConsumoLoading(true);
    try {
      const itemsVenta = reservaItems.map(i => ({
        producto_id: i.producto_id,
        nombre: i.nombre,
        qty: i.cantidad,
        precio_unit: i.precio_unitario
      }));
      const totalVenta = itemsVenta.reduce((acc, i) => acc + (i.qty * i.precio_unit), 0);
      await api.createVenta({
        items: itemsVenta,
        total: totalVenta,
        metodo_pago: 'transferencia',
        fecha: new Date().toISOString().split('T')[0],
        skipStock: true
      });
      await api.updateReservaEstado(selectedReservaConsumo.id, 'asistió');
      await api.clearReservaConsumos(selectedReservaConsumo.id);
      setReservaConsumoModal(null);
      setSelectedReservaConsumo(null);
      setReservaItems([]);
      loadReservas();
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      alert('Cuenta cerrada y venta registrada con éxito.');
    } catch(e) { alert(e.message); }
    finally { setResConsumoLoading(false); }
  };

  const addReservation = async () => {
    if (!newResData.name || addResLoading) return;
    const basePrice = parseInt(newResData.people) * 25;
    const savedData = { ...newResData };
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      nombre: savedData.name,
      email: savedData.email,
      telefono: savedData.phone,
      hora: savedData.time,
      personas: parseInt(savedData.people),
      mesa: savedData.table,
      fecha: savedData.date,
      estado: 'pendiente',
      consumo_base: basePrice,
      _saving: true,
    };
    setIsNewResModalOpen(false);
    setReservas(r => [...r, optimistic]);
    setNewResData({ name:'', email:'', phone:'', time:'19:00', people:2, date:new Date().toISOString().split('T')[0], table:'' });
    setAddResLoading(true);
    try {
      const created = await api.createReserva({
        nombre: savedData.name,
        email: savedData.email,
        telefono: savedData.phone,
        hora: savedData.time,
        personas: parseInt(savedData.people),
        mesa: savedData.table,
        fecha: savedData.date,
        consumo_base: basePrice,
      });
      const normalized = { ...created, fecha: (created.fecha || '').toString().split('T')[0] };
      setReservas(r => r.map(x => x.id === tempId ? normalized : x));
      setLastCreatedRes(normalized);
      setSelectedDate(normalized.fecha);
      setReservasPeriodo('dia');
      queryClient.invalidateQueries({ queryKey: qk.clientes('') });
    } catch(e) {
      setReservas(r => r.filter(x => x.id !== tempId));
      setNewResData(savedData);
      setIsNewResModalOpen(true);
      alert(e.message);
    } finally {
      setAddResLoading(false);
    }
  };

  const handleCrearPedidoDesdeReserva = async (reserva, openPedidoDetalle, loadProductos) => {
    setCrearPedidoLoading(true);
    try {
      const pedido = await api.crearPedidoDesdeReserva(reserva.id);
      setCrearPedidoRes(null);
      loadProductos();
      openPedidoDetalle(pedido);
      return pedido;
    } catch(e) {
      if (e.message && e.message.includes('Ya existe un pedido activo')) {
        try {
          const todos = await api.getPedidos();
          const existente = todos.find(p => p.reserva_id === reserva.id && !['confirmado','cancelado'].includes(p.estado));
          if (existente) {
            setCrearPedidoRes(null);
            loadProductos();
            openPedidoDetalle(existente);
            return existente;
          }
        } catch {}
      }
      alert(e.message);
    }
    finally { setCrearPedidoLoading(false); }
  };

  return {
    reservas, setReservas,
    totalReservas,
    autoReminder, setAutoReminder,
    autoWhatsApp, setAutoWhatsApp,
    isNewResModalOpen, setIsNewResModalOpen,
    newResData, setNewResData,
    lastCreatedRes, setLastCreatedRes,
    addResLoading,
    crearPedidoRes, setCrearPedidoRes,
    crearPedidoLoading,
    reservaConsumoModal, setReservaConsumoModal,
    reservaItems, setReservaItems,
    resConsumoLoading,
    resConsumoBusqueda, setResConsumoBusqueda,
    selectedReservaConsumo, setSelectedReservaConsumo,
    adminModal, setAdminModal,
    loadReservas,
    getDaysInMonth, sendWhatsApp,
    updateReservaEstado, deleteReserva,
    loadReservaConsumos, handleAddConsumo, handleDeleteConsumo,
    ejecutarCierreCuentaReserva, addReservation,
    handleCrearPedidoDesdeReserva,
  };
};
