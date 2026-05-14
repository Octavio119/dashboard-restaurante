import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

export const useVentas = ({ user, salesFilter }) => {
  const queryClient = useQueryClient();

  const [ventasFiltro,   setVentasFiltro]   = useState(0);
  const [ventasDia,      setVentasDia]      = useState([]);
  const [ventasResumen,  setVentasResumen]  = useState({ cantidad:0, total:0, por_metodo:{} });
  const [ventasFecha,    setVentasFecha]    = useState(new Date().toISOString().split('T')[0]);
  const [ventaModal,     setVentaModal]     = useState(false);
  const [ventaTicket,    setVentaTicket]    = useState(null);
  const [ventaItems,     setVentaItems]     = useState([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]);
  const [ventaProductos, setVentaProductos] = useState([]);
  const [ventaMetodo,    setVentaMetodo]    = useState('efectivo');
  const [ventaLoading,   setVentaLoading]   = useState(false);
  const [cajaHoy,       setCajaHoy]       = useState(null);
  const [cajaModal,     setCajaModal]     = useState(null);
  const [cajaMonto,     setCajaMonto]     = useState('');
  const [cajaLoading,   setCajaLoading]   = useState(false);
  const [adminModal,    setAdminModal]    = useState(null);
  const [salesData,     setSalesData]     = useState([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('semana');
  const [analytics,     setAnalytics]    = useState(null);

  const ventasResumenQ = useQuery({
    queryKey: qk.ventasResumen(salesFilter),
    queryFn:  () => api.getResumenVentas(salesFilter),
    enabled:  !!user,
    staleTime: 30_000,
  });

  const ventasDiaQ = useQuery({
    queryKey: qk.ventas(ventasFecha),
    queryFn:  () => api.getVentasDia(ventasFecha),
    enabled:  !!user,
    staleTime: 30_000,
  });

  const ventasResumenDiaQ = useQuery({
    queryKey: qk.ventasResumen('dia'),
    queryFn:  () => api.getResumenVentas('dia'),
    enabled:  !!user,
    staleTime: 30_000,
  });

  const analyticsQ = useQuery({
    queryKey: qk.analytics(analyticsPeriod),
    queryFn:  () => api.getAnalytics(),
    enabled:  !!user,
    staleTime: 10 * 60_000,
  });

  const salesDataQ = useQuery({
    queryKey: qk.salesChart(7),
    queryFn:  () => api.getSalesChart(7),
    enabled:  !!user,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (ventasResumenQ.data) setVentasFiltro(ventasResumenQ.data.total ?? 0);
  }, [ventasResumenQ.data]);

  useEffect(() => {
    if (ventasDiaQ.data != null) {
      const arr = Array.isArray(ventasDiaQ.data) ? ventasDiaQ.data : (ventasDiaQ.data?.rows ?? []);
      setVentasDia(arr);
    }
  }, [ventasDiaQ.data]);

  useEffect(() => {
    if (ventasResumenDiaQ.data) setVentasResumen(ventasResumenDiaQ.data);
  }, [ventasResumenDiaQ.data]);

  useEffect(() => {
    if (analyticsQ.data) setAnalytics(analyticsQ.data);
  }, [analyticsQ.data]);

  useEffect(() => {
    if (salesDataQ.data) setSalesData(salesDataQ.data);
  }, [salesDataQ.data]);

  const loadVentas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.ventasResumen(salesFilter) });
  }, [queryClient, salesFilter]);

  const loadVentasDia = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.ventas(ventasFecha) });
    queryClient.invalidateQueries({ queryKey: qk.ventasResumen('dia') });
  }, [queryClient, ventasFecha]);

  const loadAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  const deleteVenta = (venta) => {
    setAdminModal({
      title:   'Acción protegida',
      message: `Vas a anular el ticket ${venta.ticket_id}. Esta acción no se puede deshacer.`,
      onConfirm: async (code) => {
        await api.deleteVenta(venta.id, code);
        loadVentasDia();
        setAdminModal(null);
      },
    });
  };

  return {
    ventasFiltro,
    ventasDia, setVentasDia,
    ventasResumen, setVentasResumen,
    ventasFecha, setVentasFecha,
    ventaModal, setVentaModal,
    ventaTicket, setVentaTicket,
    ventaItems, setVentaItems,
    ventaProductos, setVentaProductos,
    ventaMetodo, setVentaMetodo,
    ventaLoading, setVentaLoading,
    cajaHoy, setCajaHoy,
    cajaModal, setCajaModal,
    cajaMonto, setCajaMonto,
    cajaLoading, setCajaLoading,
    adminModal, setAdminModal,
    salesData, setSalesData,
    analyticsPeriod, setAnalyticsPeriod,
    analytics, setAnalytics,
    analyticsError: analyticsQ.error,
    loadVentas, loadVentasDia, loadAnalytics,
    deleteVenta,
  };
};
