import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from './lib/queryKeys';
import { updateItemQty } from './lib/pedidoQtyUtils';
import {
  LayoutDashboard, Utensils, Calendar, Users, BarChart3, Settings, LogOut,
  TrendingUp, ShoppingBag, Clock, DollarSign, ChevronRight, Search, Bell,
  MoreVertical, Check, X, MessageCircle, Zap, Menu,
  UserCheck, Save, CreditCard, Banknote,
  Smartphone, QrCode, AlertTriangle, Flame, Activity, Trash2, Download,
  Package, Plus, Minus, Shield, Building2, FileText, Receipt, Wallet, Printer, ShieldAlert,
  Pencil, Tag, List, History, AlertCircle, Truck, RefreshCw, Upload, ImageIcon,
  LayoutGrid, TableProperties, ChefHat, Mail, ShoppingCart
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { io as socketIO } from 'socket.io-client';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';
import { api } from './api';

const PIE_COLORS = ['#8B5CF6','#10B981','#EC4899','#06B6D4','#F59E0B'];

import ToastContainer from './components/notifications/ToastContainer';
import SidebarItem from './components/layout/SidebarItem';
import StatusBadge from './components/ui/StatusBadge';
import MetricCard from './components/ui/MetricCard';
import AdminCodeModal from './components/ui/AdminCodeModal';
import ConfirmDialog from './components/ui/ConfirmDialog';

import DashboardPage from './pages/DashboardPage';
import PedidosPage from './pages/PedidosPage';
import ReservasPage from './pages/ReservasPage';
import ClientesPage from './pages/ClientesPage';
import InventarioPage from './pages/InventarioPage';
import VentasPage from './pages/VentasPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Billing from './pages/Billing';
import ProtectedRoute from './components/ProtectedRoute';
import UsageBanner from './components/UsageBanner';
import OnboardingWizard from './components/OnboardingWizard';
import ApiKeysPage from './pages/ApiKeysPage';
import BillingSuccess from './pages/BillingSuccess';
import { silentPrint } from './lib/silentPrint';
import Spinner from './components/ui/Spinner';

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = () => {
  const { user, loading: authLoading, logout } = useAuth();

  // ─── Toast notifications ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type, ...options }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const [activeTab, setActiveTab]   = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [bellOpen, setBellOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pedidos — modal nuevo pedido (POS)
  const [pedidoModal,     setPedidoModal]     = useState(false);
  const [pedidoForm,      setPedidoForm]      = useState({ cliente_nombre:'', mesa:'' });
  const [pedidoItems,     setPedidoItems]     = useState([]); // [{producto_id,nombre,precio_unitario,cantidad}]
  const [pedidoCatFilter, setPedidoCatFilter] = useState('Todos');
  const [pedidoSearch,    setPedidoSearch]    = useState('');
  const [pedidoLoading,   setPedidoLoading]   = useState(false);
  const [clienteSearchResults, setClienteSearchResults] = useState([]);
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);

  // Pedidos — conversión a venta
  const [pedidoConvertModal, setPedidoConvertModal] = useState(null); // pedido | null
  const [convertMetodo,      setConvertMetodo]      = useState('efectivo');
  const [convertLoading,     setConvertLoading]     = useState(false);

  // Datos desde API
  const [pedidos,   setPedidos]   = useState([]);
  const [reservas,  setReservas]  = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [productos,   setProductos]   = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [usuarios,    setUsuarios]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editCategoria,  setEditCategoria]  = useState(null); // { id, nombre } | null

  // Filtros
  const [dateFilter,      setDateFilter]      = useState(new Date().toISOString().split('T')[0]);
  const [salesFilter,     setSalesFilter]     = useState('dia');       // pedidos periodo
  const [selectedDate,    setSelectedDate]    = useState(new Date().toISOString().split('T')[0]);
  const [reservasPeriodo, setReservasPeriodo] = useState('dia');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('semana');

  // Ventas calculadas
  const [ventasFiltro, setVentasFiltro] = useState(0);
  const [totalReservas, setTotalReservas] = useState(0);

  // Modales
  const [isNewResModalOpen,      setIsNewResModalOpen]      = useState(false);
  const [selectedCustomer,       setSelectedCustomer]       = useState(null);
  const [activeMenuCategory,     setActiveMenuCategory]     = useState(null);
  const [confirmDialog,          setConfirmDialog]          = useState(null); // {title,message,onConfirm}
  const [adminModal,             setAdminModal]             = useState(null); // {title,message,onConfirm}

  const [newResData, setNewResData] = useState({
    name:'', email:'', phone:'', time:'19:00', people:2,
    date: new Date().toISOString().split('T')[0], table:''
  });
  const [lastCreatedRes, setLastCreatedRes] = useState(null);

  // Automaciones
  const [autoReminder,  setAutoReminder]  = useState(true);
  const [autoWhatsApp,  setAutoWhatsApp]  = useState(true);

  // Config
  const [config, setConfig] = useState({
    restaurantName: 'masterGrowth Gourmet',
    rut: '76.123.456-7',
    direccion: 'Av. Providencia 1234, Santiago',
    currency: '$', currencyCode: 'CLP',
    openTime: '11:00', closeTime: '23:30',
    taxRate: 19,
    paymentMethods: { cash:true, card:true, transfer:true, qr:false },
    timezone: 'America/Santiago',
    idioma: 'es',
    formatoFecha: 'DD/MM/YYYY',
    prefijoTicket: 'TKT',
    numeroInicial: 1,
    impuestoActivo: true,
    logoUrl: '',
  });
  const [configSaved,   setConfigSaved]   = useState(false);
  const [configSaving,  setConfigSaving]  = useState(false);
  const [configTab,     setConfigTab]     = useState('negocio');
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);

  // Nuevo producto (config menú)
  const [newProduct, setNewProduct] = useState({ nombre:'', categoria:'', precio:'', stock:'' });
  const [editProduct, setEditProduct] = useState(null);

  // Nuevo usuario (config)
  const [newUser, setNewUser] = useState({ nombre:'', email:'', password:'', rol:'staff' });
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Inventario
  const [inventarioTab, setInventarioTab] = useState('stock'); // stock | movimientos | proveedores
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
  
  // Pedidos — vista por mesa e items
  const [pedidoMesaView,    setPedidoMesaView]    = useState(false);
  const [mesasPedidos,      setMesasPedidos]      = useState([]);
  const [pedidoDetalle,     setPedidoDetalle]     = useState(null); // pedido | null
  const [pedidoDetalleItems, setPedidoDetalleItems] = useState([]);
  const [addItemSearch,     setAddItemSearch]     = useState('');
  const [addItemLoading,    setAddItemLoading]    = useState(null); // producto_id en carga | null

  // Reservas — crear pedido desde reserva
  const [crearPedidoRes,     setCrearPedidoRes]     = useState(null); // reserva | null
  const [crearPedidoLoading, setCrearPedidoLoading] = useState(false);

  // Reservas - Consumo
  const [reservaConsumoModal, setReservaConsumoModal] = useState(null); // reserva | null
  const [reservaItems,        setReservaItems]        = useState([]);
  const [resConsumoLoading,   setResConsumoLoading]   = useState(false);
  const [resConsumoBusqueda,  setResConsumoBusqueda]  = useState('');
  const [selectedReservaConsumo, setSelectedReservaConsumo] = useState(null);
  const [successMessage,         setSuccessMessage]         = useState(null);
  const [isSavingMov,           setIsSavingMov]           = useState(false);

  // Cliente modal
  const [clienteForm, setClienteForm] = useState(null); // null | objeto para editar
  const [clienteFormOpen, setClienteFormOpen] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [salesData,  setSalesData]  = useState([]);

  // Ventas (caja)
  const [ventasDia,      setVentasDia]      = useState([]);
  const [ventasResumen,  setVentasResumen]  = useState({ cantidad:0, total:0, por_metodo:{} });
  const [ventasFecha,    setVentasFecha]    = useState(new Date().toISOString().split('T')[0]);
  const [ventaModal,     setVentaModal]     = useState(false);
  const [ventaTicket,    setVentaTicket]    = useState(null);   // ticket mostrado post-venta
  const [ventaItems,     setVentaItems]     = useState([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]);
  const [ventaProductos, setVentaProductos] = useState([]);

  // Caja diaria
  const [cajaHoy,       setCajaHoy]       = useState(null);   // null = sin caja, objeto = caja del día
  const [cajaModal,     setCajaModal]     = useState(null);   // 'abrir' | 'cerrar' | null
  const [cajaMonto,     setCajaMonto]     = useState('');
  const [cajaLoading,   setCajaLoading]   = useState(false);
  const [ventaMetodo,    setVentaMetodo]    = useState('efectivo');
  const [ventaLoading,   setVentaLoading]   = useState(false);

  // ─── TanStack Query client ────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // ─── Queries ──────────────────────────────────────────────────────────────────
  const pedidosQ = useQuery({
    queryKey: qk.pedidos(dateFilter),
    queryFn:  () => api.getPedidos(dateFilter).then(d => Array.isArray(d) ? d : (d?.rows || [])),
    enabled:  !!user,
    staleTime: 30_000,
  });

  const ventasResumenQ = useQuery({
    queryKey: qk.ventasResumen(salesFilter),
    queryFn:  () => api.getResumenVentas(salesFilter),
    enabled:  !!user,
    staleTime: 30_000,
  });

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

  const clientesQ = useQuery({
    queryKey: qk.clientes(''),
    queryFn:  () => api.getClientes(''),
    enabled:  !!user,
    staleTime: 60_000,
  });

  const productosQ = useQuery({
    queryKey: qk.productos(),
    queryFn:  () => api.getProductos(),
    enabled:  !!user,
    staleTime: 15 * 60_000, // 15 min — catalog changes infrequently
  });

  const categoriasQ = useQuery({
    queryKey: qk.categorias(),
    queryFn:  () => api.getCategorias(),
    enabled:  !!user,
    staleTime: 15 * 60_000,
  });

  const usuariosQ = useQuery({
    queryKey: qk.usuarios(),
    queryFn:  () => api.getUsuarios(),
    enabled:  !!user && user?.rol === 'admin',
    staleTime: 60_000,
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
    staleTime: 10 * 60_000, // 10 min
  });

  const salesDataQ = useQuery({
    queryKey: qk.salesChart(7),
    queryFn:  () => api.getSalesChart(7),
    enabled:  !!user,
    staleTime: 10 * 60_000,
  });

  const mesasPedidosQ = useQuery({
    queryKey: qk.mesasPedidos(),
    queryFn:  () => api.getPedidosPorMesa(),
    enabled:  !!user && pedidoMesaView,
    staleTime: 30_000,
  });

  const configQ = useQuery({
    queryKey: qk.config(),
    queryFn:  () => api.getConfig(),
    enabled:  !!user,
    staleTime: 5 * 60_000,
  });

  // ─── Sync query results into local state ─────────────────────────────────────
  // pedidos — only when not in optimistic-update mode (no temp entries)
  useEffect(() => {
    if (pedidosQ.data && !pedidos.some(p => String(p.id).startsWith('temp-'))) {
      setPedidos(pedidosQ.data);
    }
  }, [pedidosQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ventasResumenQ.data) setVentasFiltro(ventasResumenQ.data.total ?? 0);
  }, [ventasResumenQ.data]);

  useEffect(() => {
    if (reservasQ.data) {
      setReservas(reservasQ.data.rows);
      setTotalReservas(reservasQ.data.total);
    }
  }, [reservasQ.data]);

  useEffect(() => {
    if (clientesQ.data) setClientes(clientesQ.data);
  }, [clientesQ.data]);

  useEffect(() => {
    if (productosQ.data) {
      setProductos(productosQ.data);
      setProductosLoading(false);
    } else {
      setProductosLoading(productosQ.isLoading);
    }
  }, [productosQ.data, productosQ.isLoading]);

  useEffect(() => {
    if (categoriasQ.data) {
      setCategorias(categoriasQ.data);
      setActiveMenuCategory(prev => prev ?? (categoriasQ.data[0]?.nombre || null));
      setNewProduct(prev => prev.categoria ? prev : { ...prev, categoria: categoriasQ.data[0]?.nombre || '' });
    }
  }, [categoriasQ.data]);

  useEffect(() => {
    if (usuariosQ.data) setUsuarios(usuariosQ.data);
  }, [usuariosQ.data]);

  useEffect(() => {
    if (ventasDiaQ.data) setVentasDia(ventasDiaQ.data);
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

  useEffect(() => {
    if (mesasPedidosQ.data) setMesasPedidos(mesasPedidosQ.data);
  }, [mesasPedidosQ.data]);

  useEffect(() => {
    if (!configQ.data) return;
    const data = configQ.data;
    setConfig({
      restaurantName: data.nombre        ?? 'masterGrowth Gourmet',
      rut:            data.rut           ?? '',
      direccion:      data.direccion     ?? '',
      currency:       data.currency      ?? '$',
      currencyCode:   data.currency_code ?? 'CLP',
      openTime:       data.open_time     ?? '11:00',
      closeTime:      data.close_time    ?? '23:30',
      taxRate:        data.tax_rate      ?? 19,
      paymentMethods: data.payment_methods ?? { cash:true, card:true, transfer:true, qr:false },
      timezone:       data.timezone      ?? 'America/Santiago',
      idioma:         data.idioma        ?? 'es',
      formatoFecha:   data.formato_fecha ?? 'DD/MM/YYYY',
      prefijoTicket:  data.prefijo_ticket  ?? 'TKT',
      numeroInicial:  data.numero_inicial  ?? 1,
      impuestoActivo: data.impuesto_activo != null ? Boolean(data.impuesto_activo) : true,
      logoUrl:        data.logo_url        ?? '',
    });
  }, [configQ.data]);

  // ─── Compat shims — keep existing call sites working ─────────────────────────
  const loadPedidos   = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.pedidos(dateFilter) }), [queryClient, dateFilter]);
  const loadVentas    = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.ventasResumen(salesFilter) }), [queryClient, salesFilter]);
  const loadReservas  = useCallback(() => queryClient.invalidateQueries({ queryKey: ['reservas'] }), [queryClient]);
  const loadClientes  = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.clientes('') }), [queryClient]);
  const loadProductos = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.productos() }), [queryClient]);
  const loadCategorias = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.categorias() }), [queryClient]);
  const loadVentasDia  = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.ventas(ventasFecha) });
    queryClient.invalidateQueries({ queryKey: qk.ventasResumen('dia') });
  }, [queryClient, ventasFecha]);
  const loadAnalytics   = useCallback(() => queryClient.invalidateQueries({ queryKey: ['analytics'] }), [queryClient]);
  const loadSalesData   = useCallback(() => queryClient.invalidateQueries({ queryKey: ['ventas', 'chart'] }), [queryClient]);
  const loadMesasPedidos = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.mesasPedidos() }), [queryClient]);
  const loadConfig      = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.config() }), [queryClient]);
  const loadUsuarios    = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.usuarios() }), [queryClient]);
  const loadInventario  = useCallback(async (filtros = {}) => {
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

  // Debounced client search inside POS modal (not cached — short-lived)
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

  // Backfill único: vincula reservas existentes sin cliente al iniciar sesión
  useEffect(() => {
    if (user) api.backfillClientes().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Onboarding: show wizard to new admin restaurants with no products/categories yet
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;
    const dismissed = localStorage.getItem(`onboarding_dismissed_${user.restaurante_id}`);
    if (dismissed) return;
    Promise.all([api.getProductos(), api.getCategorias()]).then(([prods, cats]) => {
      if (prods.length === 0 && cats.length === 0) setShowOnboarding(true);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Low-perf device detection: disables all backdrop-filter via CSS class
  useEffect(() => {
    const lowPerf =
      navigator.hardwareConcurrency <= 4 ||
      /Android/.test(navigator.userAgent);
    if (lowPerf) document.documentElement.classList.add('no-blur');
    return () => document.documentElement.classList.remove('no-blur');
  }, []);

  // Listen for plan-gated feature errors dispatched by api.js
  useEffect(() => {
    const handler = (e) => {
      const { feature, plan_requerido } = e.detail || {};
      const label = feature === 'analytics' ? 'Analytics' : feature === 'pdf' ? 'PDF de tickets' : feature || 'esta función';
      addToast(`${label} requiere plan ${plan_requerido ?? 'Pro'}. Actualiza en Facturación.`, 'warning', { icon: '🔒', title: 'Plan requerido' });
    };
    const navBilling = () => setActiveTab('Billing');
    window.addEventListener('upgrade_required', handler);
    window.addEventListener('nav:billing', navBilling);
    return () => {
      window.removeEventListener('upgrade_required', handler);
      window.removeEventListener('nav:billing', navBilling);
    };
  }, [addToast]);

  // Manejar redirects de PayPal post-pago
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      addToast('¡Plan actualizado con éxito! Bienvenido al nuevo plan.', 'success', { icon: '🎉', title: 'Pago exitoso' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('cancelled') === 'true') {
      addToast('El pago fue cancelado. Puedes intentarlo de nuevo desde Facturación.', 'warning', { icon: '⚠️', title: 'Pago cancelado' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      addToast('Hubo un problema con el pago. Contacta soporte si el problema persiste.', 'error', { icon: '❌', title: 'Error en el pago' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── WebSocket — notificaciones en tiempo real ───────────────────────────────
  // Dep array is [user, addToast, queryClient] — no loader functions, so socket
  // does NOT reconnect when dateFilter / ventasFecha / salesFilter change.
  useEffect(() => {
    if (!user) return;
    const socket = socketIO({
      path: '/socket.io',
      auth: { restaurante_id: user.restaurante_id || 1, rol: user.rol || 'staff' },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('pedido:creado', data => {
      addToast(`${data.numero} · ${data.cliente_nombre}${data.mesa ? ` · Mesa ${data.mesa}` : ''}`, 'info', { icon: '🛎️', title: 'Nuevo pedido' });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    });
    socket.on('pedido:actualizado', data => {
      if (data.estado === 'listo') {
        addToast(`${data.numero} listo para entregar`, 'success', { icon: '✅', title: 'Pedido listo' });
      } else if (data.estado === 'en preparación') {
        addToast(`${data.numero} pasó a cocina`, 'info', { icon: '👨‍🍳', title: 'En preparación' });
      } else if (data.estado === 'confirmado') {
        addToast(`${data.numero} confirmado y cobrado`, 'success', { icon: '💰', title: 'Pedido confirmado' });
      }
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    });
    socket.on('venta:realizada', data => {
      addToast(`Venta $${data.total?.toFixed(0)} · ${data.metodo_pago}`, 'success', { icon: '💵', title: 'Venta registrada' });
      // Invalidate all three ventas-related keys
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    });
    socket.on('stock:alerta', data => {
      addToast(`${data.nombre}: ${data.stock} uds restantes (mín: ${data.minimo})`, 'warning', { icon: '⚠️', title: 'Stock bajo' });
    });
    socket.on('connect_error', () => {});

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user, addToast, queryClient]);

  // ─── Acciones Inventario ─────────────────────────────────────────────────────
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

  const saveMovimiento = async () => {
    try {
      if (!movimientoForm.producto_id || !movimientoForm.cantidad) return alert('Complete los campos obligatorios');
      setIsSavingMov(true);
      await api.createMovimiento({
        ...movimientoForm,
        usuario_id: user.id
      });
      setIsMovModalOpen(false);
      setSuccessMessage('Movimiento registrado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      setMovimientoForm({ producto_id:'', tipo:'entrada', cantidad:'', proveedor_id:'', notas:'' });
      loadInventario(movFiltros);
      loadProductos();
    } catch(e) { alert(e.message); }
    finally { setIsSavingMov(false); }
  };
  useEffect(() => {
    if (user && activeTab === 'Ventas') {
      loadVentasDia();
      api.getCajaHoy().then(setCajaHoy).catch(() => setCajaHoy(null));
    }
  }, [user, activeTab, ventasFecha, loadVentasDia]);

  useEffect(() => {
    if (user && activeTab === 'Inventario') {
      loadInventario(movFiltros);
      loadProductos();
    }
  }, [user, activeTab, loadInventario, loadProductos, movFiltros]);

  useEffect(() => {
    if (user && activeTab === 'Pedidos') {
      loadProductos();
      if (pedidoMesaView) loadMesasPedidos();
    }
  }, [user, activeTab, pedidoMesaView, loadMesasPedidos, loadProductos]);

  // ─── Acciones Pedidos ────────────────────────────────────────────────────────
  const updatePedidoEstado = async (id, estado) => {
    try {
      await api.updatePedidoEstado(id, estado);
      setPedidos(p => p.map(o => o.id === id ? { ...o, estado } : o));
    } catch(e) { alert(e.message); }
  };

  const deletePedido = (pedido) => {
    if (user?.rol !== 'admin') {
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

  // ─── Convertir Pedido → Venta ────────────────────────────────────────────────
  const confirmarConversionVenta = (pedido) => {
    setConvertMetodo('efectivo');
    setPedidoConvertModal(pedido);
  };

  const ejecutarConversionVenta = async () => {
    if (!pedidoConvertModal) return;
    setConvertLoading(true);
    try {
      // El backend crea la venta y actualiza el estado en una sola operación
      await api.updatePedidoEstado(pedidoConvertModal.id, 'confirmado', { metodo_pago: convertMetodo });
      setPedidos(p => p.map(o => o.id === pedidoConvertModal.id ? { ...o, estado: 'confirmado', metodo_pago: convertMetodo } : o));
      loadVentasDia();
      loadVentas();
      if (pedidoMesaView) loadMesasPedidos();
      setPedidoConvertModal(null);
    } catch(e) { alert(e.message); }
    finally { setConvertLoading(false); }
  };

  // ─── Vista por Mesa ─────────────────────────────────────────────────────────
  const openPedidoDetalle = (pedido) => {
    setPedidoDetalle(pedido);
    setPedidoDetalleItems(pedido.items || []);
    setAddItemSearch('');
  };

  const handleAddPedidoItem = async (producto) => {
    if (!pedidoDetalle || addItemLoading === producto.id) return;
    // Si el producto ya está en el pedido, incrementar cantidad (optimista, sin red)
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

  // ─── Crear Pedido desde Reserva ──────────────────────────────────────────────
  const handleCrearPedidoDesdeReserva = async (reserva) => {
    setCrearPedidoLoading(true);
    try {
      const pedido = await api.crearPedidoDesdeReserva(reserva.id);
      setPedidos(p => [pedido, ...p]);
      setCrearPedidoRes(null);
      // Abrir detalle directamente sin cambiar de tab
      loadProductos();
      openPedidoDetalle(pedido);
    } catch(e) {
      // Si ya existe un pedido activo para esta reserva, abrir ese pedido
      if (e.message && e.message.includes('Ya existe un pedido activo')) {
        try {
          const todos = await api.getPedidos();
          const existente = todos.find(p => p.reserva_id === reserva.id && !['confirmado','cancelado'].includes(p.estado));
          if (existente) {
            setCrearPedidoRes(null);
            loadProductos();
            openPedidoDetalle(existente);
            return;
          }
        } catch {}
      }
      alert(e.message);
    }
    finally { setCrearPedidoLoading(false); }
  };

  // ─── Imprimir Pedido ─────────────────────────────────────────────────────────
  const printPedido = (order) => {
    const hora = order.fecha
      ? new Date(order.fecha).toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })
      : new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' });
    const fecha = order.fecha
      ? new Date(order.fecha).toLocaleDateString('es-CL')
      : new Date().toLocaleDateString('es-CL');
    silentPrint(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${order.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size:13px; color:#111; padding:20px; width:320px; }
    h1 { text-align:center; font-size:18px; font-weight:900; margin-bottom:4px; }
    .sub { text-align:center; font-size:11px; color:#555; margin-bottom:12px; }
    hr { border:none; border-top:1px dashed #aaa; margin:10px 0; }
    .row { display:flex; justify-content:space-between; margin:3px 0; }
    .label { color:#555; font-size:11px; }
    .val { font-weight:700; }
    .item-block { margin:6px 0; }
    .total-row { font-size:16px; font-weight:900; display:flex; justify-content:space-between; margin-top:8px; }
    .footer { text-align:center; font-size:10px; color:#888; margin-top:14px; }
    @media print { body { padding:0; } }
  </style>
</head>
<body>
  <h1>${config.restaurantName}</h1>
  <p class="sub">${config.direccion || ''}</p>
  <hr/>
  <div class="row"><span class="label">Pedido</span><span class="val">${order.numero}</span></div>
  <div class="row"><span class="label">Fecha</span><span class="val">${fecha}</span></div>
  <div class="row"><span class="label">Hora</span><span class="val">${hora}</span></div>
  <div class="row"><span class="label">Cliente</span><span class="val">${order.cliente_nombre}</span></div>
  <hr/>
  <div class="item-block">
    <div class="label">Ítems</div>
    <div style="margin-top:4px">${order.item}</div>
  </div>
  <hr/>
  <div class="total-row"><span>TOTAL</span><span>${config.currency}${Number(order.total).toLocaleString('es-CL', { minimumFractionDigits:2 })}</span></div>
  <hr/>
  <p class="footer">Estado: CONFIRMADO &nbsp;|&nbsp; ¡Gracias por su preferencia!</p>
</body>
</html>`);
  };

  // ─── Acciones Reservas ───────────────────────────────────────────────────────
  const updateReservaEstado = async (id, estado) => {
    try {
      await api.updateReservaEstado(id, estado);
      setReservas(r => r.map(res => res.id === id ? { ...res, estado } : res));
      // Refrescar clientes al confirmar o marcar asistió (ambos actualizan visitas)
      if (estado === 'confirmada' || estado === 'asistió') loadClientes();
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
      // Actualizar el total en la lista de reservas
      setReservas(prev => prev.map(r => r.id === selectedReservaConsumo.id ? { ...r, consumo_base: (r.consumo_base || 0) + producto.precio } : r));
    } catch(e) { alert(e.message); }
  };

  const handleDeleteConsumo = async (consumoId) => {
    if (!selectedReservaConsumo) return;
    try {
      const res = await api.deleteReservaConsumo(selectedReservaConsumo.id, consumoId);
      setReservaItems(prev => prev.filter(i => i.id !== consumoId));
      // Actualizar el total en la lista de reservas
      setReservas(prev => prev.map(r => r.id === selectedReservaConsumo.id ? { ...r, consumo_base: res.nuevoTotal } : r));
    } catch(e) { alert(e.message); }
  };

  const ejecutarCierreCuentaReserva = async () => {
    if (!selectedReservaConsumo || reservaItems.length === 0) return;
    setResConsumoLoading(true);
    try {
      // 1. Crear venta
      const itemsVenta = reservaItems.map(i => ({
        producto_id: i.producto_id,
        nombre: i.nombre,
        qty: i.cantidad,
        precio_unit: i.precio_unitario // Aligning with ventas.js expectation
      }));
      const totalVenta = itemsVenta.reduce((acc, i) => acc + (i.qty * i.precio_unit), 0);
      
      await api.createVenta({
        items: itemsVenta,
        total: totalVenta,
        metodo_pago: 'transferencia',
        fecha: new Date().toISOString().split('T')[0],
        skipStock: true // Important: Stock already deducted in reservation
      });

      // 2. Marcar reserva como asistió (ya hecho si estamos aquí, pero refrescamos)
      await api.updateReservaEstado(selectedReservaConsumo.id, 'asistió');
      
      // 3. Limpiar consumos de la reserva (ya están en la venta)
      await api.clearReservaConsumos(selectedReservaConsumo.id);
      
      setReservaConsumoModal(null);
      setSelectedReservaConsumo(null);
      setReservaItems([]);
      loadReservas();
      loadVentasDia();
      loadVentas();
      alert('Cuenta cerrada y venta registrada con éxito.');
    } catch(e) { alert(e.message); }
    finally { setResConsumoLoading(false); }
  };

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

  const [addResLoading, setAddResLoading] = useState(false);

  const addReservation = async () => {
    if (!newResData.name || addResLoading) return;
    const basePrice = parseInt(newResData.people) * 25;
    const savedData = { ...newResData };

    // Optimistic update: close modal immediately and add temp entry
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
      loadClientes();
    } catch(e) {
      setReservas(r => r.filter(x => x.id !== tempId));
      setNewResData(savedData);
      setIsNewResModalOpen(true);
      alert(e.message);
    } finally {
      setAddResLoading(false);
    }
  };

  // ─── Acciones Clientes ───────────────────────────────────────────────────────
  const saveCliente = async () => {
    try {
      if (clienteForm.id) {
        const updated = await api.updateCliente(clienteForm.id, clienteForm);
        setClientes(c => c.map(x => x.id === updated.id ? updated : x));
      } else {
        await api.createCliente(clienteForm);
        await loadClientes();
      }
      setClienteFormOpen(false);
      setClienteForm(null);
    } catch(e) { alert(e.message); }
  };

  const deleteCliente = (cliente) => {
    if (!isAdmin) {
      setConfirmDialog({ title:'Sin permiso', message:'Solo administradores pueden eliminar clientes.', onConfirm:() => setConfirmDialog(null), danger:false });
      return;
    }
    setAdminModal({
      title: 'Eliminar cliente',
      message: `Vas a eliminar a ${cliente.nombre}. Esta acción no se puede deshacer.`,
      onConfirm: async (code) => {
        await api.deleteCliente(cliente.id, code);
        setClientes(c => c.filter(x => x.id !== cliente.id));
        setAdminModal(null);
      },
    });
  };

  // ─── Acciones Categorías ─────────────────────────────────────────────────────
  const agregarCategoria = async () => {
    const nombre = nuevaCategoria.trim().toLowerCase();
    if (!nombre) return;
    try {
      const creada = await api.createCategoria(nombre);
      setCategorias(c => [...c, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaCategoria('');
      setActiveMenuCategory(creada.nombre);
      queryClient.invalidateQueries({ queryKey: qk.categorias() });
    } catch(e) { alert(e.message); }
  };

  const guardarEditCategoria = async () => {
    if (!editCategoria) return;
    const nombre = editCategoria.nombre.trim().toLowerCase();
    if (!nombre) return;
    try {
      const actualizada = await api.updateCategoria(editCategoria.id, nombre);
      setCategorias(c => c.map(x => x.id === actualizada.id ? actualizada : x).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      if (activeMenuCategory === editCategoria.nombreOriginal) setActiveMenuCategory(actualizada.nombre);
      setProductos(p => p.map(x => x.categoria === editCategoria.nombreOriginal ? { ...x, categoria: actualizada.nombre } : x));
      setEditCategoria(null);
      queryClient.invalidateQueries({ queryKey: qk.categorias() });
      queryClient.invalidateQueries({ queryKey: qk.productos() });
    } catch(e) { alert(e.message); }
  };

  const eliminarCategoria = (cat) => {
    const count = productos.filter(p => p.categoria === cat.nombre && p.activo !== 0).length;
    setConfirmDialog({
      title: 'Eliminar categoría',
      message: count > 0
        ? `La categoría "${cat.nombre}" tiene ${count} producto(s) activos. Se eliminarán del menú. ¿Continuar?`
        : `¿Eliminar la categoría "${cat.nombre}"?`,
      onConfirm: async () => {
        try {
          await api.deleteCategoria(cat.id);
          setCategorias(c => c.filter(x => x.id !== cat.id));
          if (activeMenuCategory === cat.nombre) {
            const restantes = categorias.filter(x => x.id !== cat.id);
            setActiveMenuCategory(restantes[0]?.nombre || null);
          }
          queryClient.invalidateQueries({ queryKey: qk.categorias() });
          queryClient.invalidateQueries({ queryKey: qk.productos() });
        } catch(e) { alert(e.message); }
        setConfirmDialog(null);
      },
    });
  };

  // ─── Acciones Productos ──────────────────────────────────────────────────────
  const saveProducto = async () => {
    if (!newProduct.nombre || !newProduct.precio) return;
    try {
      const created = await api.createProducto({
        nombre: newProduct.nombre,
        categoria: newProduct.categoria,
        precio: parseFloat(newProduct.precio),
        stock: parseInt(newProduct.stock) || 0,
      });
      setProductos(p => [...p, created]);
      setNewProduct({ nombre:'', categoria: categorias[0]?.nombre || '', precio:'', stock:'' });
      setActiveMenuCategory(created.categoria);
      queryClient.invalidateQueries({ queryKey: qk.productos() });
    } catch(e) { alert(e.message); }
  };

  const updateProductoSave = async () => {
    if (!editProduct) return;
    try {
      const updated = await api.updateProducto(editProduct.id, editProduct);
      setProductos(p => p.map(x => x.id === updated.id ? updated : x));
      setEditProduct(null);
      queryClient.invalidateQueries({ queryKey: qk.productos() });
    } catch(e) { alert(e.message); }
  };

  const changeStock = async (id, delta) => {
    try {
      const { stock } = await api.updateStock(id, delta);
      setProductos(p => p.map(x => x.id === id ? { ...x, stock } : x));
      queryClient.invalidateQueries({ queryKey: qk.productos() });
    } catch(e) { alert(e.message); }
  };

  const deleteProducto = (prod) => {
    setConfirmDialog({
      title: 'Eliminar producto',
      message: `¿Eliminar "${prod.nombre}" del menú?`,
      onConfirm: async () => {
        try {
          await api.deleteProducto(prod.id);
          setProductos(p => p.filter(x => x.id !== prod.id));
          queryClient.invalidateQueries({ queryKey: qk.productos() });
        } catch(e) { alert(e.message); }
        setConfirmDialog(null);
      }
    });
  };

  // ─── Acciones Usuarios ───────────────────────────────────────────────────────
  const createUsuario = async () => {
    try {
      const created = await api.createUsuario(newUser);
      setUsuarios(u => [...u, created]);
      setNewUser({ nombre:'', email:'', password:'', rol:'staff' });
      setUserFormOpen(false);
    } catch(e) { alert(e.message); }
  };

  const toggleUsuarioActivo = async (u) => {
    try {
      await api.patchUsuario(u.id, { activo: u.activo ? 0 : 1 });
      setUsuarios(list => list.map(x => x.id === u.id ? { ...x, activo: x.activo ? 0 : 1 } : x));
    } catch(e) { alert(e.message); }
  };

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const hdr = ['Número','Cliente','Item','Total','Estado','Fecha'];
    const rows = pedidos.map(o => [o.numero, o.cliente_nombre, o.item, o.total, o.estado, o.fecha]);
    const resHdr = ['','Nombre','Hora','Personas','Mesa','Estado','Fecha'];
    const resRows = reservas.map(r => ['', r.nombre, r.hora, r.personas, r.mesa, r.estado, r.fecha]);
    const csv = [
      '=== PEDIDOS ===',
      hdr.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
      '',
      '=== RESERVAS ===',
      resHdr.join(','),
      ...resRows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reporte-${today}.csv`;
    a.click();
  };

  // ─── Utils ───────────────────────────────────────────────────────────────────
  const sendWhatsApp = (phone, name, date, time, tipo = 'recordatorio') => {
    const clean = phone.replace(/\D/g,'');
    const msgs = {
      confirmacion: `Hola ${name} 👋 Su reserva ha sido *confirmada* para el ${date} a las ${time}. ¡Le esperamos! 🍽️`,
      recordatorio: `Hola ${name} 👋 Le recordamos su reserva para *hoy a las ${time}*. ¡Le esperamos! 🍽️`,
    };
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msgs[tipo]||msgs.recordatorio)}`, '_blank');
  };


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

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      let finalLogoUrl = config.logoUrl;

      // Si el usuario seleccionó un archivo, subirlo primero
      if (logoFile) {
        const { logoUrl } = await api.uploadLogo(logoFile);
        finalLogoUrl = logoUrl;
        setLogoFile(null);
        if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      }

      await api.saveConfig({
        nombre:          config.restaurantName,
        rut:             config.rut,
        direccion:       config.direccion,
        currency:        config.currency,
        currency_code:   config.currencyCode,
        open_time:       config.openTime,
        close_time:      config.closeTime,
        tax_rate:        config.taxRate,
        payment_methods: config.paymentMethods,
        timezone:        config.timezone,
        idioma:          config.idioma,
        formato_fecha:   config.formatoFecha,
        prefijo_ticket:  config.prefijoTicket,
        numero_inicial:  config.numeroInicial,
        impuesto_activo: config.impuestoActivo,
        logo_url:        finalLogoUrl,
      });
      setConfig(prev => ({ ...prev, logoUrl: finalLogoUrl }));
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    } catch(e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setConfigSaving(false);
    }
  };

  // ─── Imprimir ticket ─────────────────────────────────────────────────────────
  // ─── Exportar Reporte PDF (ventas de un período) ─────────────────────────────
  const exportReportePDF = (ventasList, fecha) => {
    if (!ventasList.length) return;
    const W = 210;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Cabecera oscura
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, W, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(251, 191, 36);
    doc.text(config.restaurantName || 'Restaurante', 14, 17);
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(`Reporte de Ventas — ${fecha}`, 14, 24);
    doc.setTextColor(0);

    // Resumen
    let y = 38;
    const totalVentas = ventasList.reduce((s, v) => s + v.total, 0);
    const porMetodo = ventasList.reduce((acc, v) => { acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + v.total; return acc; }, {});

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('RESUMEN', 14, y); y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    [
      [`Transacciones:`, String(ventasList.length)],
      [`Total ventas:`,  `$${totalVentas.toLocaleString('es-CL', { minimumFractionDigits:2 })}`],
      ...Object.entries(porMetodo).map(([k, v]) => [`  Pago ${k}:`, `$${v.toLocaleString('es-CL', { minimumFractionDigits:2 })}`]),
    ].forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 110, y, { align: 'right' });
      y += 5;
    });
    y += 4;

    // Tabla
    const headers  = ['TICKET', 'FECHA', 'ITEMS', 'MÉTODO', 'CAJERO', 'TOTAL'];
    const colW     = [34, 24, 64, 22, 28, 22];
    const tableW   = colW.reduce((a, b) => a + b, 0);
    const rowH     = 7;
    const lm       = 14;

    doc.setFillColor(39, 39, 42);
    doc.rect(lm, y, tableW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(251, 191, 36);
    let x = lm;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 4.5); x += colW[i]; });
    y += rowH;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ventasList.forEach((v, ri) => {
      if (y > 272) { doc.addPage(); y = 20; }
      if (ri % 2 === 0) { doc.setFillColor(248, 248, 248); doc.rect(lm, y, tableW, rowH, 'F'); }
      doc.setTextColor(0);
      const itemsStr = v.items.slice(0, 2).map(i => `${i.nombre} ×${i.qty}`).join(', ') + (v.items.length > 2 ? '…' : '');
      const cells = [v.ticket_id, v.fecha, itemsStr, v.metodo_pago, v.cajero || '-', `$${v.total.toLocaleString('es-CL', { minimumFractionDigits:2 })}`];
      x = lm;
      cells.forEach((cell, i) => {
        const txt = doc.splitTextToSize(String(cell || ''), colW[i] - 3)[0] || '';
        doc.text(txt, x + 2, y + 4.5);
        x += colW[i];
      });
      y += rowH;
    });

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })}`, 14, 288);

    doc.save(`reporte-ventas-${fecha}.pdf`);
  };

  // ─── Exportar Excel ───────────────────────────────────────────────────────────
  const exportVentasExcel = (ventasList, fecha) => {
    if (!ventasList.length) return;
    const data = ventasList.map(v => ({
      Ticket:    v.ticket_id,
      Fecha:     v.fecha,
      Hora:      v.hora || '',
      Items:     v.items.map(i => `${i.nombre} x${i.qty}`).join(', '),
      Método:    v.metodo_pago,
      Cajero:    v.cajero || '',
      Subtotal:  v.subtotal ?? v.total,
      Total:     v.total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `ventas-${fecha}.xlsx`);
  };

  const exportInventarioExcel = (productosList) => {
    if (!productosList.length) return;
    const data = productosList.map(p => ({
      Nombre:         p.nombre,
      Categoría:      p.categoria,
      Precio:         p.precio,
      Stock:          p.stock,
      'Stock Mínimo': p.stock_minimo,
      Unidad:         p.unidad || '',
      Estado:         p.stock <= p.stock_minimo ? 'CRÍTICO' : p.stock <= p.stock_minimo * 2 ? 'Bajo' : 'OK',
      Activo:         p.activo ? 'Sí' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printTicket = (venta) => {
    const taxAmount  = venta.subtotal != null ? (venta.total - venta.subtotal) : 0;
    const showTax    = config.impuestoActivo && taxAmount > 0;

    const itemsHTML = venta.items.map(it => `
      <tr>
        <td>${it.nombre}</td>
        <td class="center">×${it.qty}</td>
        <td class="right">$${(it.precio_unit * it.qty).toFixed(2)}</td>
      </tr>`).join('');

    const logoHTML = config.logoUrl
      ? `<img src="${config.logoUrl}" alt="logo" style="max-height:48px;max-width:160px;object-fit:contain;margin-bottom:6px"/>`
      : '';

    const taxHTML = showTax ? `
      <tr class="subtotal-row">
        <td colspan="2">Subtotal</td>
        <td class="right">$${venta.subtotal.toFixed(2)}</td>
      </tr>
      <tr class="subtotal-row">
        <td colspan="2">IVA (${config.taxRate}%)</td>
        <td class="right">$${taxAmount.toFixed(2)}</td>
      </tr>` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${venta.ticket_id}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #111;
      width: 80mm;
      padding: 8mm 6mm 12mm;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header .biz-name { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
    .header .sub { font-size: 10px; color: #555; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
    .ticket-id { text-align: center; font-size: 10px; color: #666; margin-bottom: 6px; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    td:first-child { width: 55%; }
    td.center { text-align: center; width: 15%; }
    td.right { text-align: right; width: 30%; }
    .subtotal-row td { color: #555; font-size: 10px; padding-top: 3px; }
    .total-row td {
      font-size: 13px; font-weight: bold;
      border-top: 1px solid #111;
      padding-top: 5px; margin-top: 4px;
    }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 12px; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoHTML}
    <div class="biz-name">${config.restaurantName}</div>
    ${config.rut      ? `<div class="sub">RUT: ${config.rut}</div>` : ''}
    ${config.direccion? `<div class="sub">${config.direccion}</div>` : ''}
  </div>

  <hr class="divider"/>
  <div class="ticket-id"># ${venta.ticket_id}</div>
  <div class="meta">
    <span>${venta.fecha}</span>
    <span>${venta.hora ?? ''}</span>
  </div>
  <hr class="divider"/>

  <table>
    <tbody>
      ${itemsHTML}
      ${taxHTML}
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td class="right">$${venta.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <hr class="divider"/>
  <div class="footer">
    <div>Pago: ${venta.metodo_pago}</div>
    ${venta.cajero ? `<div>Cajero: ${venta.cajero}</div>` : ''}
    <div style="margin-top:8px">¡Gracias por su visita!</div>
  </div>

</body>
</html>`;

    silentPrint(html);
  };

  // ─── Descargar ticket en PDF ──────────────────────────────────────────────────
  const downloadPDF = (venta) => {
    const taxAmount = venta.subtotal != null ? (venta.total - venta.subtotal) : 0;
    const showTax   = config.impuestoActivo && taxAmount > 0;

    // Altura dinámica según contenido
    const baseH  = 92;
    const itemH  = venta.items.length * 6;
    const taxH   = showTax ? 10 : 0;
    const rutH   = config.rut       ? 4  : 0;
    const dirH   = config.direccion ? 4  : 0;
    const cajH   = venta.cajero     ? 4  : 0;
    const totalH = baseH + itemH + taxH + rutH + dirH + cajH;

    const W  = 80;
    const LM = 6; // left margin
    const RM = W - LM; // right edge

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, totalH] });

    let y = 8;

    // ── Helpers ──────────────────────────────────────────────────
    const center = (txt, sz = 9) => {
      doc.setFontSize(sz);
      doc.text(String(txt), W / 2, y, { align: 'center' });
    };
    const row = (leftTxt, rightTxt, sz = 9) => {
      doc.setFontSize(sz);
      doc.text(String(leftTxt),  LM, y);
      doc.text(String(rightTxt), RM, y, { align: 'right' });
    };
    const dashed = () => {
      doc.setLineDashPattern([1, 1], 0);
      doc.setDrawColor(160, 160, 160);
      doc.line(LM, y, RM, y);
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(0);
    };

    // ── Cabecera ─────────────────────────────────────────────────
    doc.setFont('courier', 'bold');
    center(config.restaurantName.toUpperCase(), 11);
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setTextColor(90);
    if (config.rut) { center(`RUT: ${config.rut}`, 8); y += 4; }
    if (config.direccion) { center(config.direccion, 8); y += 4; }
    doc.setTextColor(0);

    y += 2; dashed(); y += 5;

    // ── Número de ticket ─────────────────────────────────────────
    doc.setTextColor(100);
    center(`# ${venta.ticket_id}`, 8);
    y += 4;

    doc.setFontSize(8);
    doc.text(venta.fecha, LM, y);
    doc.text(venta.hora ?? '', RM, y, { align: 'right' });
    y += 4;
    doc.setTextColor(0);

    dashed(); y += 5;

    // ── Items ────────────────────────────────────────────────────
    doc.setFont('courier', 'normal');
    for (const it of venta.items) {
      row(`${it.nombre} ×${it.qty}`, `$${(it.precio_unit * it.qty).toFixed(2)}`, 8.5);
      y += 5.5;
    }

    y += 1; dashed(); y += 4;

    // ── Desglose IVA ─────────────────────────────────────────────
    if (showTax) {
      doc.setTextColor(110);
      row('Subtotal', `$${venta.subtotal.toFixed(2)}`, 8);
      y += 4.5;
      row(`IVA (${config.taxRate}%)`, `$${taxAmount.toFixed(2)}`, 8);
      y += 4.5;
      doc.setTextColor(0);
    }

    // ── Total ────────────────────────────────────────────────────
    doc.setFont('courier', 'bold');
    row('TOTAL', `$${venta.total.toFixed(2)}`, 11);
    y += 7;

    dashed(); y += 5;

    // ── Footer ───────────────────────────────────────────────────
    doc.setFont('courier', 'normal');
    doc.setTextColor(110);
    center(`Pago: ${venta.metodo_pago}`, 8);
    y += 4;
    if (venta.cajero) { center(`Cajero: ${venta.cajero}`, 8); y += 4; }
    y += 2;
    center('¡Gracias por su visita!', 8);

    doc.save(`ticket-${venta.ticket_id}.pdf`);
  };

  // ─── Public billing redirect (PayPal returns here — no auth required) ────────
  const _billingQs = new URLSearchParams(window.location.search)
  if (
    window.location.pathname === '/billing' &&
    (_billingQs.get('success') === '1' || _billingQs.get('cancel') === '1')
  ) {
    return <BillingSuccess />
  }

  // ─── Auth guard ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Spinner size="lg" color="violet" />
      </div>
    );
  }
  if (!user) {
    const path = window.location.pathname;
    if (path === '/' || path === '') return <Landing />;
    if (path === '/register') return <Register />;
    return <Login />;
  }

  // Rutas independientes del tab system
  if (window.location.pathname === '/billing') {
    const _qs = new URLSearchParams(window.location.search);
    if (_qs.get('success') === '1') return <BillingSuccess />;
    return <Billing />;
  }
  if (window.location.pathname === '/apikeys') {
    return <ApiKeysPage user={user} />;
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const safeReservas = Array.isArray(reservas) ? reservas : [];
  const safePedidos  = Array.isArray(pedidos)  ? pedidos  : [];
  const safeClientes = Array.isArray(clientes) ? clientes : [];

  const todayReservations  = safeReservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);
  const dailyReservations  = safeReservas.filter(r => reservasPeriodo === 'dia' ? r.fecha === selectedDate : true);
  const filteredOrders     = safePedidos.filter(o =>
    o.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.numero?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredClientes = safeClientes.filter(c =>
    c.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rut?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mapa reserva_id → pedido activo (para mostrar estado del pedido en la card de reserva)
  const reservaPedidoMap = {};
  for (const p of pedidos) {
    if (p.reserva_id && !['confirmado','cancelado'].includes(p.estado)) {
      reservaPedidoMap[p.reserva_id] = p;
    }
  }

  const rolLabel = { admin:'Administrador', chef:'Chef', staff:'Personal', gerente:'Gerente', super_admin:'Super Admin' };
  const rolColor = {
    admin:       'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
    gerente:     'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
    chef:        'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30',
    staff:       'bg-white/5 text-[#94A3B8] border-white/10',
    super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const isAdmin    = user?.rol === 'admin' || user?.rol === 'super_admin';
  const isGerente  = isAdmin || user?.rol === 'gerente';
  const canEditMenu = isGerente;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-[#F8FAFC] font-jakarta">

      {/* Sidebar */}
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-[220px] border-r p-6 flex flex-col gap-8 z-[100] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#0D0D14', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-2 cursor-pointer select-none" onClick={() => setActiveTab('Dashboard')}>
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="logo"
              className="w-10 h-10 rounded-xl object-contain bg-zinc-800 border border-zinc-700 p-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
              <Utensils size={20} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="font-black tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>
                Mastexo
              </span>
              <span className="font-black text-lg" style={{ color: 'var(--primary)' }}>POS</span>
            </div>
            {(() => {
              const p = user?.restaurante?.plan?.toLowerCase();
              const isPro = p === 'pro' || p === 'business';
              return (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,.3), rgba(236,72,153,.2))',
                    color: 'white',
                  }}
                >
                  {p === 'free' ? 'Starter' : p === 'pro' ? 'Pro' : p === 'business' ? 'Business' : 'Starter'}
                </span>
              );
            })()}
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          {[
            { icon:LayoutDashboard, label:'Dashboard',  roles: null },
            { icon:ShoppingBag,    label:'Pedidos',     roles: null },
            { icon:Receipt,        label:'Ventas',      roles: null },
            { icon:Calendar,       label:'Reservas',    roles: null },
            { icon:Users,          label:'Clientes',    roles: null },
            { icon:Package,        label:'Inventario',  roles: ['admin','gerente','super_admin'] },
            { icon:BarChart3,      label:'Analytics',   roles: ['admin','gerente','super_admin'] },
          ].filter(({ roles }) => !roles || roles.includes(user?.rol))
           .map(({ icon, label }) => (
             <SidebarItem 
              key={label} 
              icon={icon} 
              label={label} 
              active={activeTab===label} 
              onClick={() => {
                setActiveTab(label);
                setSidebarOpen(false);
              }} 
            />

          ))}
        </nav>

        <div className="border-t pt-4 flex flex-col gap-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <SidebarItem 
            icon={Settings} 
            label="Configuración" 
            active={activeTab==='Configuración'} 
            onClick={() => {
              setActiveTab('Configuración');
              setSidebarOpen(false);
            }} 
          />
          <div
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#8892A4] hover:text-red-400 hover:bg-red-500/5 cursor-pointer transition-all"
          >
            <LogOut size={18} />
            <span className="font-semibold text-sm">Cerrar sesión</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow flex flex-col pb-16 lg:pb-0 main-content-area">
        {/* Header */}
        {/* Header */}
        <header className="h-[60px] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50" style={{ background: '#0A0A12', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 1px 0 rgba(0,0,0,0.6)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center border cursor-pointer transition-colors text-[#94A3B8] hover:text-[#F8FAFC]" style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <Menu size={20} />
            </button>
            
            <div className="relative w-40 sm:w-64 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10 pr-4 text-sm w-full"
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(v => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors relative cursor-pointer text-[#94A3B8] hover:text-[#8B5CF6]" style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <Bell size={17} />
                <span className="notification-dot absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#8B5CF6' }} />
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:0.96 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:8, scale:0.96 }}
                    className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl z-[200] overflow-hidden" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8892A4' }}>Notificaciones</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>0</span>
                    </div>
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-zinc-500">Sin notificaciones nuevas</p>
                    </div>
                    <button className="w-full py-3 text-center text-xs text-zinc-500 hover:text-amber-400 transition-colors font-medium" onClick={() => setBellOpen(false)}>
                      Marcar todo como leído
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* User */}
            <div className="flex items-center gap-2.5 cursor-default group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', fontSize: '14px', boxShadow: '0 0 0 2px rgba(139,92,246,0.35), 0 0 12px rgba(139,92,246,0.2)' }}>
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col gap-0.5">
                <span className="font-bold leading-none" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{user.nombre}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider w-fit ${rolColor[user.rol] || rolColor.staff}`} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {rolLabel[user.rol] || user.rol}
                </span>
              </div>
            </div>
          </div>
        </header>

        <UsageBanner />

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {activeTab === 'Dashboard' && (
            <DashboardPage
              user={user}
              todayReservations={todayReservations}
              exportCSV={exportCSV}
              setIsNewResModalOpen={setIsNewResModalOpen}
              ventasResumen={ventasResumen}
              pedidos={pedidos}
              salesData={salesData}
              setActiveTab={setActiveTab}
            />
          )}

          {/* ── PEDIDOS ── */}
          {activeTab === 'Pedidos' && (
            <PedidosPage
              pedidoMesaView={pedidoMesaView} setPedidoMesaView={setPedidoMesaView}
              loadMesasPedidos={loadMesasPedidos} mesasPedidos={mesasPedidos}
              salesFilter={salesFilter} setSalesFilter={setSalesFilter}
              dateFilter={dateFilter} setDateFilter={setDateFilter}
              filteredOrders={filteredOrders} ventasFiltro={ventasFiltro}
              pedidoForm={pedidoForm} setPedidoForm={setPedidoForm}
              pedidoItems={pedidoItems} setPedidoItems={setPedidoItems}
              pedidoSearch={pedidoSearch} setPedidoSearch={setPedidoSearch}
              pedidoCatFilter={pedidoCatFilter} setPedidoCatFilter={setPedidoCatFilter}
              pedidoModal={pedidoModal} setPedidoModal={setPedidoModal}
              openPedidoDetalle={openPedidoDetalle} printPedido={printPedido}
              confirmarConversionVenta={confirmarConversionVenta} updatePedidoEstado={updatePedidoEstado} deletePedido={deletePedido}
              productos={productos} loadProductos={loadProductos} productosLoading={productosLoading}
              clienteSearchResults={clienteSearchResults} setClienteSearchResults={setClienteSearchResults}
              isSearchingClientes={isSearchingClientes}
              pedidoLoading={pedidoLoading} setPedidoLoading={setPedidoLoading}
              setPedidos={setPedidos} api={api}
            />
          )}

          {/* ── RESERVAS ── */}
          {activeTab === 'Reservas' && (
            <ReservasPage
              getDaysInMonth={getDaysInMonth}
              reservas={reservas}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              reservasPeriodo={reservasPeriodo} setReservasPeriodo={setReservasPeriodo}
              autoReminder={autoReminder} setAutoReminder={setAutoReminder}
              autoWhatsApp={autoWhatsApp} setAutoWhatsApp={setAutoWhatsApp}
              dailyReservations={dailyReservations}
              reservaPedidoMap={reservaPedidoMap}
              loadProductos={loadProductos} openPedidoDetalle={openPedidoDetalle}
              crearPedidoRes={crearPedidoRes} setCrearPedidoRes={setCrearPedidoRes}
              setSelectedReservaConsumo={setSelectedReservaConsumo}
              setReservaConsumoModal={setReservaConsumoModal}
              loadReservaConsumos={loadReservaConsumos}
              updateReservaEstado={updateReservaEstado}
              sendWhatsApp={sendWhatsApp}
              deleteReserva={deleteReserva}
              crearPedidoLoading={crearPedidoLoading}
              handleCrearPedidoDesdeReserva={handleCrearPedidoDesdeReserva}
              setIsNewResModalOpen={setIsNewResModalOpen}
            />
          )}

          {/* ── CLIENTES ── */}
          {activeTab === 'Clientes' && (
            <ClientesPage
              filteredClientes={filteredClientes}
              setClienteForm={setClienteForm}
              setClienteFormOpen={setClienteFormOpen}
              setSelectedCustomer={setSelectedCustomer}
              isAdmin={isAdmin}
              deleteCliente={deleteCliente}
            />
          )}

          {/* ── INVENTARIO ── */}
          {activeTab === 'Inventario' && (
            <InventarioPage
              inventarioTab={inventarioTab}
              setInventarioTab={setInventarioTab}
              exportInventarioExcel={exportInventarioExcel}
              productos={productos}
              setMovimientoForm={setMovimientoForm}
              setIsMovModalOpen={setIsMovModalOpen}
              proveedores={proveedores}
              movStats={movStats}
              movFiltros={movFiltros}
              setMovFiltros={setMovFiltros}
              invLoading={invLoading}
              movimientos={movimientos}
              movTotal={movTotal}
              setProveedorForm={setProveedorForm}
              setIsProvModalOpen={setIsProvModalOpen}
              deleteProveedor={deleteProveedor}
            />
          )}

          {/* ── VENTAS ── */}
          {activeTab === 'Ventas' && (
            <VentasPage
              ventasFecha={ventasFecha}
              setVentasFecha={setVentasFecha}
              ventasDia={ventasDia}
              exportReportePDF={exportReportePDF}
              exportVentasExcel={exportVentasExcel}
              setVentaItems={setVentaItems}
              setVentaMetodo={setVentaMetodo}
              setVentaTicket={setVentaTicket}
              setVentaProductos={setVentaProductos}
              setVentaModal={setVentaModal}
              api={api}
              cajaHoy={cajaHoy}
              cajaMonto={cajaMonto}
              setCajaMonto={setCajaMonto}
              setCajaModal={setCajaModal}
              cajaModal={cajaModal}
              cajaLoading={cajaLoading}
              setCajaLoading={setCajaLoading}
              setCajaHoy={setCajaHoy}
              ventasResumen={ventasResumen}
              downloadPDF={downloadPDF}
              printTicket={printTicket}
              isAdmin={isAdmin}
              deleteVenta={deleteVenta}
              loadVentasDia={loadVentasDia}
              loadVentas={loadVentas}
              ventaItems={ventaItems}
              ventaProductos={ventaProductos}
              ventaMetodo={ventaMetodo}
              config={config}
              ventaLoading={ventaLoading}
              setVentaLoading={setVentaLoading}
              ventaTicket={ventaTicket}
              ventaModal={ventaModal}
              user={user}
            />
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'Analytics' && (
            <AnalyticsPage
              loadAnalytics={loadAnalytics}
              analytics={analytics}
              analyticsError={analyticsQ.error}
            />
          )}

          {/* ── CONFIGURACIÓN ── */}
          {activeTab === 'Configuración' && (
            <motion.div key="config" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Configuración <span style={{ color: 'var(--purple)' }}>General</span></h2>
                  <p className="text-zinc-500 text-sm mt-1">Ajusta tu restaurante y preferencias del sistema</p>
                </div>
                {(configTab === 'negocio' || configTab === 'facturacion') && (
                  <button onClick={saveConfig} disabled={configSaving}
                    className={`btn-primary flex items-center gap-2 transition-colors ${configSaved ? '!bg-green-500 !text-white' : ''} disabled:opacity-60`}>
                    <Save size={15}/> {configSaving ? 'Guardando…' : configSaved ? '¡Guardado!' : 'Guardar cambios'}
                  </button>
                )}
              </div>

              {/* Tabs config */}
              <div className="tab-group w-fit">
                {[
                  { key:'negocio',     label:'Negocio',     icon:Building2, adminOnly: false },
                  { key:'facturacion', label:'Facturación', icon:Receipt,   adminOnly: true  },
                  { key:'usuarios',    label:'Usuarios',    icon:Shield,    adminOnly: true  },
                  { key:'menu',        label:'Menú',        icon:Utensils,  adminOnly: false },
                ].filter(t => !t.adminOnly || isAdmin)
                 .map(({ key, label, icon:Icon }) => (
                  <button key={key} onClick={() => setConfigTab(key)}
                    className={`tab-item flex items-center gap-1.5 ${configTab === key ? 'active' : ''}`}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>

              {/* Negocio */}
              {configTab === 'negocio' && (
                <div className="flex flex-col gap-4">
                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Building2 size={14} className="text-amber-400"/>Datos del Negocio</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Logo en negocio tab */}
                      <div className="col-span-2 flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden bg-zinc-800">
                          {(logoPreview || config.logoUrl)
                            ? <img src={logoPreview || config.logoUrl} alt="logo" className="w-full h-full object-contain p-1"/>
                            : <Building2 size={24} className="text-zinc-600"/>
                          }
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Logo del negocio</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                            id="logo-file-input-negocio"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setLogoFile(file);
                              if (logoPreview) URL.revokeObjectURL(logoPreview);
                              setLogoPreview(URL.createObjectURL(file));
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <label htmlFor="logo-file-input-negocio"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-semibold text-zinc-300 cursor-pointer transition-colors">
                              <Upload size={13}/> {config.logoUrl || logoFile ? 'Cambiar logo' : 'Subir logo'}
                            </label>
                            {logoFile && <span className="text-[11px] text-amber-400 flex items-center gap-1"><Check size={11}/>Lista — guarda para aplicar</span>}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nombre del Restaurante</label>
                        <input type="text" value={config.restaurantName} onChange={e=>setConfig({...config,restaurantName:e.target.value})} className="input"/>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">RUT</label>
                        <input type="text" value={config.rut} onChange={e=>setConfig({...config,rut:e.target.value})} placeholder="76.543.210-K" className="input font-mono"/>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Moneda</label>
                        <select value={config.currencyCode} onChange={e=>{const m={USD:'$',EUR:'€',CLP:'$',DOP:'RD$'};setConfig({...config,currencyCode:e.target.value,currency:m[e.target.value]})}} className="input bg-zinc-800">
                          <option value="USD">🇺🇸 USD</option>
                          <option value="EUR">🇪🇺 EUR</option>
                          <option value="CLP">🇨🇱 CLP</option>
                          <option value="DOP">🇩🇴 DOP</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Dirección</label>
                        <input type="text" value={config.direccion} onChange={e=>setConfig({...config,direccion:e.target.value})} className="input"/>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Clock size={14} className="text-amber-400"/>Horario</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Apertura</label>
                        <input type="time" value={config.openTime} onChange={e=>setConfig({...config,openTime:e.target.value})} className="input"/>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Cierre</label>
                        <input type="time" value={config.closeTime} onChange={e=>setConfig({...config,closeTime:e.target.value})} className="input"/>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2"><CreditCard size={14} className="text-amber-400"/>Métodos de Pago</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ key:'cash',label:'Efectivo',icon:Banknote},{key:'card',label:'Tarjeta',icon:CreditCard},{key:'transfer',label:'Transferencia',icon:Smartphone},{key:'qr',label:'Código QR',icon:QrCode}].map(({key,label,icon:Icon})=>(
                        <div key={key} onClick={()=>setConfig({...config,paymentMethods:{...config.paymentMethods,[key]:!config.paymentMethods[key]}})}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${config.paymentMethods[key]?'bg-[#8B5CF6]/10 border-[#8B5CF6]/20':'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={config.paymentMethods[key]?'text-[#8B5CF6]':'text-zinc-500'}/>
                            <span className={`text-sm font-semibold ${config.paymentMethods[key]?'text-white':'text-zinc-400'}`}>{label}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.paymentMethods[key]?'bg-[#8B5CF6] border-[#8B5CF6]':'border-zinc-600'}`}>
                            {config.paymentMethods[key]&&<Check size={10} className="text-white"/>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferencias Avanzadas */}
                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap size={14} className="text-amber-400"/>Preferencias Avanzadas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">

                      {/* Timezone */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Zona horaria</label>
                        <select value={config.timezone} onChange={e => setConfig({...config, timezone: e.target.value})} className="input bg-zinc-800">
                          <option value="America/Santiago">🇨🇱 America/Santiago (CLT)</option>
                          <option value="America/Santo_Domingo">🇩🇴 America/Santo_Domingo (AST)</option>
                          <option value="America/Bogota">🇨🇴 America/Bogota (COT)</option>
                          <option value="America/Lima">🇵🇪 America/Lima (PET)</option>
                          <option value="America/Argentina/Buenos_Aires">🇦🇷 America/Buenos_Aires (ART)</option>
                          <option value="America/Mexico_City">🇲🇽 America/Mexico_City (CST)</option>
                          <option value="America/New_York">🇺🇸 America/New_York (ET)</option>
                          <option value="Europe/Madrid">🇪🇸 Europe/Madrid (CET)</option>
                          <option value="UTC">🌐 UTC</option>
                        </select>
                      </div>

                      {/* Idioma */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Idioma del sistema</label>
                        <select value={config.idioma} onChange={e => setConfig({...config, idioma: e.target.value})} className="input bg-zinc-800">
                          <option value="es">🇪🇸 Español</option>
                          <option value="en">🇺🇸 English</option>
                          <option value="fr">🇫🇷 Français</option>
                          <option value="pt">🇧🇷 Português</option>
                        </select>
                      </div>

                      {/* Formato fecha */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Formato de fecha</label>
                        <select value={config.formatoFecha} onChange={e => setConfig({...config, formatoFecha: e.target.value})} className="input bg-zinc-800">
                          <option value="DD/MM/YYYY">DD/MM/YYYY &nbsp;(10/04/2026)</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY &nbsp;(04/10/2026)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (2026-04-10)</option>
                          <option value="DD-MM-YYYY">DD-MM-YYYY (10-04-2026)</option>
                        </select>
                      </div>

                      {/* IVA / Impuesto */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">IVA / Impuesto (%)</label>
                        <div className="relative">
                          <input
                            type="number" min="0" max="100" step="0.1"
                            value={config.taxRate}
                            onChange={e => setConfig({...config, taxRate: parseFloat(e.target.value) || 0})}
                            className="input pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-zinc-600">
                          Ejemplo: precio $1.000 → con IVA ${((1000 * (1 + config.taxRate / 100))).toLocaleString('es-CL', {maximumFractionDigits:0})}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Facturación */}
              {configTab === 'facturacion' && (
                <div className="flex flex-col gap-4">

                  {/* Tickets */}
                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Receipt size={14} className="text-amber-400"/>Configuración de Tickets
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Prefijo del ticket</label>
                        <input
                          type="text" maxLength={8}
                          value={config.prefijoTicket}
                          onChange={e => setConfig({...config, prefijoTicket: e.target.value.toUpperCase()})}
                          placeholder="TKT"
                          className="input font-mono"
                        />
                        <p className="text-[10px] text-zinc-600">Ejemplo: {config.prefijoTicket || 'TKT'}-000123</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Número inicial</label>
                        <input
                          type="number" min="1" step="1"
                          value={config.numeroInicial}
                          onChange={e => setConfig({...config, numeroInicial: parseInt(e.target.value) || 1})}
                          className="input"
                        />
                        <p className="text-[10px] text-zinc-600">El próximo ticket será #{config.numeroInicial}</p>
                      </div>
                    </div>
                  </div>

                  {/* Impuesto */}
                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-amber-400"/>Impuesto en documentos
                    </h3>
                    <div
                      onClick={() => setConfig({...config, impuestoActivo: !config.impuestoActivo})}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${config.impuestoActivo ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${config.impuestoActivo ? 'text-white' : 'text-zinc-400'}`}>
                          Mostrar IVA / impuesto en tickets
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {config.impuestoActivo ? `Se mostrará ${config.taxRate}% en cada documento` : 'El impuesto no aparecerá en los tickets'}
                        </p>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${config.impuestoActivo ? 'bg-[#8B5CF6]' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.impuestoActivo ? 'left-5' : 'left-1'}`}/>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="card p-6 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon size={14} className="text-amber-400"/>Logo del negocio
                    </h3>
                    <div className="flex gap-5 items-start">
                      {/* Preview */}
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden bg-zinc-800/50">
                        {(logoPreview || config.logoUrl)
                          ? <img src={logoPreview || config.logoUrl} alt="logo" className="w-full h-full object-contain p-1.5"/>
                          : <Building2 size={32} className="text-zinc-600"/>
                        }
                      </div>

                      {/* Controles */}
                      <div className="flex flex-col gap-3 flex-1">
                        <div>
                          <p className="text-sm font-semibold text-white mb-0.5">
                            {logoFile ? logoFile.name : (config.logoUrl ? 'Logo guardado' : 'Sin logo')}
                          </p>
                          <p className="text-[11px] text-zinc-500">PNG, JPG, WEBP o SVG · Máx. 2 MB</p>
                        </div>

                        {/* Input file oculto */}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                          id="logo-file-input"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setLogoFile(file);
                            if (logoPreview) URL.revokeObjectURL(logoPreview);
                            setLogoPreview(URL.createObjectURL(file));
                          }}
                        />

                        <div className="flex gap-2 flex-wrap">
                          <label
                            htmlFor="logo-file-input"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-sm font-semibold text-zinc-300 cursor-pointer transition-colors"
                          >
                            <Upload size={14}/> Subir imagen
                          </label>

                          {(logoPreview || config.logoUrl) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (logoPreview) URL.revokeObjectURL(logoPreview);
                                setLogoFile(null);
                                setLogoPreview(null);
                                setConfig(prev => ({ ...prev, logoUrl: '' }));
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-sm font-semibold text-red-400 cursor-pointer transition-colors"
                            >
                              <X size={14}/> Quitar logo
                            </button>
                          )}
                        </div>

                        {logoFile && (
                          <p className="text-[11px] text-amber-400 flex items-center gap-1">
                            <Check size={12}/> Imagen lista — presiona "Guardar cambios" para aplicar
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-600">Se mostrará en el sidebar y en los tickets impresos.</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Usuarios */}
              {configTab === 'usuarios' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-zinc-300">Usuarios del sistema</h3>
                    {user.rol === 'admin' && (
                      <button onClick={() => setUserFormOpen(v=>!v)} className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={14}/> Agregar usuario
                      </button>
                    )}
                  </div>

                  {userFormOpen && (
                    <div className="card p-5 flex flex-col gap-4 border-amber-500/20">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nuevo Usuario</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-zinc-500">Nombre</label>
                          <input type="text" value={newUser.nombre} onChange={e=>setNewUser({...newUser,nombre:e.target.value})} className="input" placeholder="Nombre completo"/>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-zinc-500">Email</label>
                          <input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} className="input" placeholder="email@restaurante.com"/>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-zinc-500">Contraseña</label>
                          <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} className="input" placeholder="Mínimo 6 caracteres"/>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-zinc-500">Rol</label>
                          <select value={newUser.rol} onChange={e=>setNewUser({...newUser,rol:e.target.value})} className="input bg-zinc-800">
                            <option value="staff">Personal / Staff</option>
                            <option value="chef">Chef</option>
                            <option value="gerente">Gerente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setUserFormOpen(false); setNewUser({nombre:'',email:'',password:'',rol:'staff'}); }} className="btn-ghost text-sm">Cancelar</button>
                        <button onClick={createUsuario} className="btn-primary text-sm">Crear usuario</button>
                      </div>
                    </div>
                  )}

                  <div className="card overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                          {['Usuario','Email','Rol','Estado','Acción'].map(h=>(
                            <th key={h} className="px-5 py-3.5 text-[10px] font-black text-zinc-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map(u => (
                          <tr key={u.id} className="border-b border-zinc-800 hover:bg-zinc-900/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-sm text-amber-400">
                                  {u.nombre.charAt(0)}
                                </div>
                                <span className="font-semibold text-sm text-white">{u.nombre}</span>
                                {u.id === user.id && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">Tú</span>}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-zinc-400 font-mono">{u.email}</td>
                            <td className="px-5 py-4">
                              <span className="text-xs font-bold uppercase text-zinc-300">{rolLabel[u.rol]||u.rol}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${u.activo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {u.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {u.id !== user.id && user.rol === 'admin' && (
                                <button onClick={() => toggleUsuarioActivo(u)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${u.activo ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-black'}`}>
                                  {u.activo ? 'Desactivar' : 'Activar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Menú */}
              {configTab === 'menu' && (
                <div className="flex flex-col gap-4">
                  {/* Form nuevo producto */}
                  {/* Gestión de categorías */}
                  <div className="card p-5 flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Tag size={13}/> Categorías del menú
                    </h3>

                    {/* Chips de categorías existentes */}
                    <div className="flex flex-wrap gap-2">
                      {categorias.map(cat => (
                        <div key={cat.id} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5">
                          {editCategoria?.id === cat.id ? (
                            <>
                              <input
                                autoFocus
                                value={editCategoria.nombre}
                                onChange={e => setEditCategoria({ ...editCategoria, nombre: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') guardarEditCategoria(); if (e.key === 'Escape') setEditCategoria(null); }}
                                className="bg-transparent text-white text-xs font-bold w-24 focus:outline-none border-b border-amber-500"
                              />
                              <button onClick={guardarEditCategoria} className="text-amber-400 hover:text-amber-300 transition-colors ml-1">
                                <Check size={12}/>
                              </button>
                              <button onClick={() => setEditCategoria(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                <X size={12}/>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-zinc-300 capitalize">{cat.nombre}</span>
                              <span className="text-[10px] text-zinc-600 ml-1">({productos.filter(p => p.categoria === cat.nombre).length})</span>
                              {canEditMenu && (
                                <button
                                  onClick={() => setEditCategoria({ id: cat.id, nombre: cat.nombre, nombreOriginal: cat.nombre })}
                                  className="ml-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                                  title="Renombrar"
                                >
                                  <Pencil size={11}/>
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => eliminarCategoria(cat)}
                                  className="text-zinc-600 hover:text-red-400 transition-colors"
                                  title="Eliminar categoría"
                                >
                                  <X size={11}/>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Input nueva categoría */}
                    {canEditMenu && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={nuevaCategoria}
                          onChange={e => setNuevaCategoria(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && agregarCategoria()}
                          placeholder="Nueva categoría (ej: café, alcohol...)"
                          className="input text-sm flex-1"
                          maxLength={30}
                        />
                        <button
                          onClick={agregarCategoria}
                          disabled={!nuevaCategoria.trim()}
                          className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <Plus size={14}/> Agregar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form nuevo/editar producto */}
                  <div className="card p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{editProduct ? 'Editar producto' : 'Agregar producto al menú'}</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Nombre</label>
                        <input type="text" value={editProduct ? editProduct.nombre : newProduct.nombre}
                          onChange={e => editProduct ? setEditProduct({...editProduct,nombre:e.target.value}) : setNewProduct({...newProduct,nombre:e.target.value})}
                          className="input" placeholder="Ej. Lomo Saltado"/>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Categoría</label>
                        <select value={editProduct ? editProduct.categoria : newProduct.categoria}
                          onChange={e => editProduct ? setEditProduct({...editProduct,categoria:e.target.value}) : setNewProduct({...newProduct,categoria:e.target.value})}
                          className="input bg-zinc-800 capitalize">
                          {categorias.map(c => <option key={c.id} value={c.nombre} className="capitalize">{c.nombre}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Precio</label>
                        <input type="number" value={editProduct ? editProduct.precio : newProduct.precio}
                          onChange={e => editProduct ? setEditProduct({...editProduct,precio:e.target.value}) : setNewProduct({...newProduct,precio:e.target.value})}
                          className="input" placeholder="0.00" min="0" step="0.01"/>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {editProduct ? (
                        <>
                          <button onClick={() => setEditProduct(null)} className="btn-ghost text-sm">Cancelar</button>
                          <button onClick={updateProductoSave} className="btn-primary text-sm">Guardar cambios</button>
                        </>
                      ) : (
                        <button onClick={saveProducto} disabled={categorias.length === 0} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40">
                          <Plus size={14}/>Agregar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs categorías */}
                  <div className="flex gap-1 flex-wrap">
                    {categorias.map(cat => (
                      <button key={cat.id} onClick={() => setActiveMenuCategory(cat.nombre)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${activeMenuCategory===cat.nombre ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'}`}>
                        {cat.nombre}
                        <span className="ml-1.5 text-[10px]">({productos.filter(p=>p.categoria===cat.nombre).length})</span>
                      </button>
                    ))}
                  </div>

                  <div className="card overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                          {['Producto','Categoría','Precio','Stock','Acciones'].map(h=>(
                            <th key={h} className="px-5 py-3.5 text-[10px] font-black text-zinc-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {productos.filter(p => p.categoria === activeMenuCategory).map(p => (
                          <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-900/40">
                            <td className="px-5 py-3.5 font-semibold text-sm text-white">{p.nombre}</td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-bold uppercase text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md">{p.categoria}</span>
                            </td>
                            <td className="px-5 py-3.5 font-black text-amber-400">${Number(p.precio).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-zinc-300 font-bold">{p.stock}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-2">
                                <button onClick={() => setEditProduct({...p})}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-colors">Editar</button>
                                <button onClick={() => deleteProducto(p)}
                                  className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-colors">
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {productos.filter(p=>p.categoria===activeMenuCategory).length===0 && (
                      <div className="py-10 text-center text-zinc-600 text-sm">
                        {activeMenuCategory ? 'Sin productos en esta categoría' : 'Crea una categoría para comenzar'}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: Nueva Reserva ── */}
        <AnimatePresence>
          {isNewResModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setIsNewResModalOpen(false)} className="absolute inset-0 bg-black/85"/>
              <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
                className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white">Nueva <span style={{ color: 'var(--purple)' }}>Reserva</span></h3>
                  </div>
                  <button onClick={() => setIsNewResModalOpen(false)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><X size={16}/></button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'Nombre', key:'name', type:'text', placeholder:'Juan Pérez', full:true },
                    { label:'Email (opcional)', key:'email', type:'email', placeholder:'juan@email.com', full:true },
                    { label:'Teléfono/WhatsApp', key:'phone', type:'tel', placeholder:'+56 9 0000 0000', full:false },
                    { label:'Personas', key:'people', type:'number', placeholder:'2', full:false },
                    { label:'Mesa (opcional)', key:'table', type:'text', placeholder:'Mesa 12', full:false },
                    { label:'Fecha', key:'date', type:'date', full:false },
                    { label:'Hora', key:'time', type:'time', full:false },
                  ].map(({ label, key, type, placeholder, full }) => (
                    <div key={key} className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
                      <input type={type} value={newResData[key]} onChange={e => setNewResData({...newResData, [key]:e.target.value})}
                        placeholder={placeholder} className="input"/>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setIsNewResModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button onClick={addReservation} disabled={!newResData.name || addResLoading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    {addResLoading ? 'Guardando...' : 'Crear Reservación'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── TOAST: WhatsApp post-reserva ── */}
        <AnimatePresence>
          {lastCreatedRes && (
            <motion.div
              initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:24 }}
              className="fixed bottom-6 right-6 z-[300] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Reserva guardada</p>
                <p className="text-xs text-zinc-400 truncate">{lastCreatedRes.nombre} · {(lastCreatedRes.fecha || '').toString().split('T')[0]} {lastCreatedRes.hora}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lastCreatedRes.telefono && (
                  <button
                    onClick={() => { sendWhatsApp(lastCreatedRes.telefono, lastCreatedRes.nombre, lastCreatedRes.fecha, lastCreatedRes.hora, 'confirmacion'); setLastCreatedRes(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                )}
                <button onClick={() => setLastCreatedRes(null)} className="text-zinc-600 hover:text-white transition-colors p-1">
                  <X size={14}/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: Historial Cliente ── */}
        <AnimatePresence>
          {selectedCustomer && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-black/85"/>
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-black border border-amber-500/20">
                      {selectedCustomer.nombre?.charAt(0) || selectedCustomer.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{selectedCustomer.nombre || selectedCustomer.name}</h3>
                      <p className="text-sm text-zinc-500">{selectedCustomer.email}</p>
                      <div className="flex gap-2 mt-1">
                        {selectedCustomer.rut && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-bold">{selectedCustomer.rut}</span>
                        )}
                        {selectedCustomer.tipo_cliente === 'empresa' && selectedCustomer.razon_social && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">{selectedCustomer.razon_social}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"><X size={16}/></button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="card p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Visitas</p>
                    <p className="text-xl font-black mt-1">{selectedCustomer.visitas ?? selectedCustomer.visits}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ticket promedio</p>
                    <p className="text-xl font-black text-amber-400 mt-1">
                      ${((selectedCustomer.total_gastado ?? selectedCustomer.totalSpent) / Math.max(1, selectedCustomer.visitas ?? selectedCustomer.visits)).toFixed(2)}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total gastado</p>
                    <p className="text-xl font-black mt-1">${Number(selectedCustomer.total_gastado ?? selectedCustomer.totalSpent).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Historial</h4>
                  {(selectedCustomer.pedidos || selectedCustomer.orders || []).map((o,i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
                      <div>
                        <p className="text-sm font-semibold">{o.numero || o.id}</p>
                        <p className="text-[11px] text-zinc-500">{o.items || o.item} · {o.fecha || o.date}</p>
                      </div>
                      <span className="font-black text-white">${Number(o.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => setSelectedCustomer(null)} className="btn-primary w-full">Cerrar</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL: Editar Cliente ── */}
        <AnimatePresence>
          {clienteFormOpen && clienteForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setClienteFormOpen(false)} className="absolute inset-0 bg-black/85"/>
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black">{clienteForm.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                  <button onClick={() => setClienteFormOpen(false)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"><X size={16}/></button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nombre</label>
                    <input type="text" value={clienteForm.nombre} onChange={e=>setClienteForm({...clienteForm,nombre:e.target.value})} className="input" placeholder="Nombre completo"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">RUT</label>
                    <input type="text" value={clienteForm.rut} onChange={e=>setClienteForm({...clienteForm,rut:e.target.value})} className="input font-mono" placeholder="12.345.678-9"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tipo</label>
                    <select value={clienteForm.tipo_cliente} onChange={e=>setClienteForm({...clienteForm,tipo_cliente:e.target.value})} className="input bg-zinc-800">
                      <option value="persona">Persona natural</option>
                      <option value="empresa">Empresa / Factura</option>
                    </select>
                  </div>
                  {clienteForm.tipo_cliente === 'empresa' && (
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Razón Social</label>
                      <input type="text" value={clienteForm.razon_social} onChange={e=>setClienteForm({...clienteForm,razon_social:e.target.value})} className="input" placeholder="Empresa SpA"/>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Email</label>
                    <input type="email" value={clienteForm.email} onChange={e=>setClienteForm({...clienteForm,email:e.target.value})} className="input" placeholder="email@ejemplo.com"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Teléfono</label>
                    <input type="tel" value={clienteForm.telefono} onChange={e=>setClienteForm({...clienteForm,telefono:e.target.value})} className="input" placeholder="+56 9 0000 0000"/>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setClienteFormOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button onClick={saveCliente} disabled={!clienteForm.nombre} className="btn-primary flex-1 disabled:opacity-50">Guardar</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

        {/* ── MODAL: Registro de Movimiento ── */}
        <AnimatePresence>
          {isMovModalOpen && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setIsMovModalOpen(false)} className="absolute inset-0 bg-black/88"/>
              <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
                className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                  <h3 className="font-black text-white">REGISTRAR MOVIMIENTO</h3>
                  <button onClick={() => setIsMovModalOpen(false)} className="text-white/60 hover:text-white"><X size={18}/></button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Producto</label>
                    <select value={movimientoForm.producto_id} onChange={e=>setMovimientoForm({...movimientoForm, producto_id: e.target.value})} className="input bg-zinc-800">
                      <option value="">Seleccione un producto...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</label>
                      <select value={movimientoForm.tipo} onChange={e=>setMovimientoForm({...movimientoForm, tipo: e.target.value})} className="input bg-zinc-800">
                        <option value="entrada">Entrada (+)</option>
                        <option value="salida">Salida (-)</option>
                        <option value="ajuste">Ajuste (Manual)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cantidad</label>
                      <input type="number" value={movimientoForm.cantidad} onChange={e=>setMovimientoForm({...movimientoForm, cantidad: e.target.value})} className="input" placeholder="0"/>
                    </div>
                  </div>
                  {movimientoForm.tipo === 'entrada' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Proveedor (Opcional)</label>
                      <select value={movimientoForm.proveedor_id} onChange={e=>setMovimientoForm({...movimientoForm, proveedor_id: e.target.value})} className="input bg-zinc-800">
                        <option value="">Ninguno</option>
                        {proveedores.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notas / Referencia</label>
                    <textarea value={movimientoForm.notas} onChange={e=>setMovimientoForm({...movimientoForm, notas: e.target.value})} className="input min-h-[80px]" placeholder="Ej: Compra mensual, Merma, etc."/>
                  </div>
                  <button 
                    onClick={saveMovimiento} 
                    disabled={isSavingMov}
                    className={`btn-primary w-full py-4 font-black uppercase tracking-widest mt-2 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 ${isSavingMov ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isSavingMov ? (
                      <>
                        <Spinner size="sm" color="white" /> PROCESANDO...
                      </>
                    ) : (
                      'Procesar Movimiento'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── TOAST GLOBAL ── */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] bg-zinc-900 border border-green-500/30 text-white px-6 py-3 rounded-full flex items-center gap-3" style={{ boxShadow: 'var(--shadow-xl)' }}
            >
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black">
                <Check size={14} strokeWidth={4}/>
              </div>
              <span className="font-bold text-sm tracking-tight">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: Nuevo/Editar Proveedor ── */}
        <AnimatePresence>
          {isProvModalOpen && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setIsProvModalOpen(false)} className="absolute inset-0 bg-black/88"/>
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-black text-white">{proveedorForm.id ? 'Editar' : 'Nuevo'} <span style={{ color: 'var(--purple)' }}>Proveedor</span></h3>
                  <button onClick={() => setIsProvModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre de la Empresa</label>
                    <input type="text" value={proveedorForm.nombre} onChange={e=>setProveedorForm({...proveedorForm, nombre: e.target.value})} className="input" placeholder="Ej: Distribuidora Central"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Persona de Contacto</label>
                    <input type="text" value={proveedorForm.contacto} onChange={e=>setProveedorForm({...proveedorForm, contacto: e.target.value})} className="input" placeholder="Juan Pérez"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Teléfono</label>
                    <input type="tel" value={proveedorForm.telefono} onChange={e=>setProveedorForm({...proveedorForm, telefono: e.target.value})} className="input" placeholder="+56 9..."/>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</label>
                    <input type="email" value={proveedorForm.email} onChange={e=>setProveedorForm({...proveedorForm, email: e.target.value})} className="input" placeholder="proveedor@email.com"/>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dirección</label>
                    <input type="text" value={proveedorForm.direccion} onChange={e=>setProveedorForm({...proveedorForm, direccion: e.target.value})} className="input"/>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsProvModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button onClick={saveProveedor} className="btn-primary flex-1 font-black uppercase tracking-widest">Guardar Proveedor</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
 
        {/* ── MODAL: Consumo de Reserva (Comandero) ── */}
        <AnimatePresence>
          {reservaConsumoModal && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setReservaConsumoModal(null)} className="absolute inset-0 bg-black/88"/>
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="px-6 py-4 flex justify-between items-center shrink-0" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                  <div>
                    <h3 className="font-black text-white leading-none uppercase">GESTIONAR CONSUMO</h3>
                    <p className="text-white/60 text-[10px] font-bold mt-1 uppercase">Mesa {reservaConsumoModal.mesa} • {reservaConsumoModal.nombre}</p>
                  </div>
                  <button onClick={() => setReservaConsumoModal(null)} className="text-black/60 hover:text-black"><X size={18}/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Buscador de Productos */}
                  <div className="w-1/2 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                    <div className="p-4 border-b border-zinc-800">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14}/>
                        <input
                          type="text"
                          value={resConsumoBusqueda}
                          onChange={(e) => setResConsumoBusqueda(e.target.value)}
                          placeholder="Buscar producto..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                      <div className="grid grid-cols-1 gap-1">
                        {productos
                          .filter(p => p.nombre.toLowerCase().includes(resConsumoBusqueda.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddConsumo(p)}
                              className="w-full p-3 rounded-lg hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all flex justify-between items-center group"
                            >
                              <div className="text-left">
                                <p className="text-sm font-bold text-white group-hover:text-[#8B5CF6]">{p.nombre}</p>
                                <p className="text-[10px] text-zinc-500">Stock: {p.stock} • {p.categoria}</p>
                              </div>
                              <span className="text-amber-500 font-black text-sm">{config.currency}{p.precio}</span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  </div>

                  {/* Detalle de Consumo */}
                  <div className="w-1/2 flex flex-col">
                    <div className="p-4 bg-zinc-800/20 border-b border-zinc-800">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={12}/> Detalle de la Mesa
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
                      {reservaItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-10 text-center">
                          <ShoppingBag size={30} className="opacity-20 mb-2"/>
                          <p className="text-xs font-medium">No hay consumos registrados</p>
                        </div>
                      ) : (
                        reservaItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{item.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-black">x{item.cantidad}</span>
                                <span className="text-[10px] text-zinc-500">{config.currency}{Number(item.precio_unitario).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-sm font-black text-white">{config.currency}{Number(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                              <button onClick={() => handleDeleteConsumo(item.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Acumulado</span>
                        <span className="text-2xl font-black text-white">{config.currency}{reservaItems.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setReservaConsumoModal(null)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-colors">
                          Cerrar
                        </button>
                        <button 
                          onClick={ejecutarCierreCuentaReserva}
                          disabled={reservaItems.length === 0 || resConsumoLoading}
                          className="flex-1 py-3 rounded-xl text-white font-black text-sm hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50" style={{ background:'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}
                        >
                          {resConsumoLoading ? 'Cerrando...' : 'PAGAR Y CERRAR'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Modal global: conversión pedido → venta ── */}
        {pedidoConvertModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/88" onClick={() => !convertLoading && setPedidoConvertModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm flex flex-col"
              style={{
                background: '#0F172A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                    Registrar venta
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    {pedidoConvertModal.numero} · {pedidoConvertModal.cliente_nombre}
                  </p>
                </div>
                <button
                  onClick={() => !convertLoading && setPedidoConvertModal(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94A3B8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Items */}
              <div className="px-6 py-4 flex flex-col gap-2.5">
                {(pedidoConvertModal.items||[]).length > 0 ? (
                  pedidoConvertModal.items.map(it => (
                    <div key={it.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#94A3B8' }}>
                        {it.nombre}
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B' }}>×{it.cantidad}</span>
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#E2E8F0', fontVariantNumeric: 'tabular-nums' }}>
                        ${(it.cantidad * it.precio_unitario).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#94A3B8' }}>{pedidoConvertModal.item}</span>
                    <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>—</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mx-6 mb-5 flex items-center justify-between rounded-xl px-4 py-4"
                style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <span className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Total a cobrar</span>
                <span className="text-2xl font-black" style={{ color: '#10B981', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  ${Number(pedidoConvertModal.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* Payment method */}
              <div className="px-6 pb-4 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
                  Método de pago
                </span>
                <div className="flex gap-2">
                  {[
                    { id: 'efectivo',      label: 'Efectivo',       icon: Banknote },
                    { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard },
                    { id: 'transferencia', label: 'Transferencia',  icon: Smartphone },
                  ].map(m => {
                    const active = convertMetodo === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setConvertMetodo(m.id)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: active ? 'rgba(248,250,252,0.09)' : 'rgba(255,255,255,0.03)',
                          border: active ? '1px solid rgba(248,250,252,0.18)' : '1px solid rgba(255,255,255,0.05)',
                          color: active ? '#F8FAFC' : '#475569',
                        }}
                      >
                        <m.icon size={15} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning caja cerrada */}
              {cajaHoy?.estado !== 'abierta' && (
                <div className="mx-6 mb-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.18)', color: '#CA8A04' }}>
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  La caja no está abierta. La venta se registrará igual.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 px-6 pb-5">
                <button
                  disabled={convertLoading}
                  onClick={() => setPedidoConvertModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748B' }}
                  onMouseEnter={e => { if (!convertLoading) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  Cancelar
                </button>
                <button
                  disabled={convertLoading}
                  onClick={ejecutarConversionVenta}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: '#10B981', color: '#fff' }}
                  onMouseEnter={e => { if (!convertLoading) e.currentTarget.style.background = '#059669'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; }}
                >
                  <Receipt size={14} />
                  {convertLoading ? 'Registrando...' : 'Confirmar venta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Modal global: gestión de ítems de pedido ── */}
        <AnimatePresence>
        {pedidoDetalle && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              key="pedido-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/88"
              onClick={() => { setPedidoDetalle(null); setPedidoDetalleItems([]); }}
            />

            {/* Modal card */}
            <motion.div
              key="pedido-modal"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden rounded-3xl"
              style={{
                background: '#09090D',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.12), 0 32px 80px rgba(0,0,0,0.85), 0 0 80px rgba(139,92,246,0.07)',
              }}
            >
              {/* ── Header ── */}
              <div
                className="relative flex items-center justify-between px-6 py-5 overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg,rgba(139,92,246,.14) 0%,rgba(109,40,217,.05) 100%)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* ambient glow */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle,#8B5CF6 0%,transparent 70%)' }} />

                <div className="relative flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 8px 20px rgba(245,158,11,.3)' }}
                  >
                    <ChefHat size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-amber-400 text-base leading-tight tracking-tight">{pedidoDetalle.numero}</span>
                      <span className="text-zinc-600 text-sm">—</span>
                      <span className="font-bold text-white text-base">{pedidoDetalle.cliente_nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {pedidoDetalle.mesa && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/80">
                          <Utensils size={9}/>{pedidoDetalle.mesa}
                        </span>
                      )}
                      {pedidoDetalle.personas > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                          <Users size={9}/>{pedidoDetalle.personas} pers.
                        </span>
                      )}
                      {pedidoDetalle.reserva_id && (
                        <span className="text-[10px] font-black text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(99,102,241,.08)' }}>RESERVA</span>
                      )}
                      <StatusBadge status={pedidoDetalle.estado}/>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setPedidoDetalle(null); setPedidoDetalleItems([]); }}
                  className="relative w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                >
                  <X size={14}/>
                </button>
              </div>

              {/* ── Body scrollable ── */}
              <div className="flex flex-col gap-5 overflow-y-auto flex-1 px-6 py-5">

                {/* Section: productos del pedido */}
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.14em] mb-3">
                    Productos del pedido
                  </p>

                  {pedidoDetalleItems.length === 0 ? (
                    <div className="py-8 flex flex-col items-center text-zinc-700 rounded-2xl"
                      style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
                      <Package size={26} className="mb-2 opacity-25"/>
                      <p className="text-sm">Sin productos — agrega del menú</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {pedidoDetalleItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-colors cursor-default"
                          style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.055)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.nombre}</p>
                            <p className="text-[11px] text-zinc-600 mt-0.5">
                              ${item.precio_unitario.toLocaleString('es-CL', { minimumFractionDigits:0 })} c/u
                            </p>
                          </div>

                          {/* Qty pill */}
                          <div
                            className="flex items-center gap-0.5 flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,.06)', borderRadius: '12px', padding: '3px' }}
                          >
                            <button
                              onClick={() => handleUpdatePedidoItemQty(item.id, item.cantidad - 1)}
                              className="w-7 h-7 rounded-[9px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer font-bold text-base leading-none"
                            >−</button>
                            <span data-testid="item-cantidad"
                              className="text-white font-black text-sm w-6 text-center tabular-nums select-none">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleUpdatePedidoItemQty(item.id, item.cantidad + 1)}
                              className="w-7 h-7 rounded-[9px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer font-bold text-base leading-none"
                            >+</button>
                          </div>

                          <span className="text-amber-400 font-black text-sm w-20 text-right tabular-nums flex-shrink-0">
                            ${(item.cantidad * item.precio_unitario).toLocaleString('es-CL', { minimumFractionDigits:0 })}
                          </span>

                          <button
                            onClick={() => handleDeletePedidoItem(item.id)}
                            className="text-zinc-700 hover:text-red-400 transition-colors cursor-pointer p-1 flex-shrink-0"
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      ))}

                      {/* Total row */}
                      <div
                        className="flex justify-between items-center pt-3.5 mt-1 px-1"
                        style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}
                      >
                        <span className="text-zinc-500 text-sm font-semibold">Total del pedido</span>
                        <span className="text-white font-black text-xl tabular-nums">
                          ${pedidoDetalleItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0).toLocaleString('es-CL', { minimumFractionDigits:0 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: agregar del menú */}
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.14em] mb-3">
                    Agregar del menú
                  </p>

                  {/* Search input */}
                  <div className="relative mb-3">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    <input
                      value={addItemSearch}
                      onChange={e => setAddItemSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,.04)',
                        border: '1px solid rgba(255,255,255,.07)',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid rgba(139,92,246,.45)'; e.target.style.background = 'rgba(139,92,246,.04)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,.07)'; e.target.style.background = 'rgba(255,255,255,.04)'; }}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
                    {productosLoading ? (
                      <div className="flex items-center justify-center py-7 gap-2 text-sm text-zinc-600">
                        <Spinner size="sm" color="violet" />
                        Cargando menú...
                      </div>
                    ) : (() => {
                      const list = productos.filter(p => p.activo !== 0 && (addItemSearch === '' || p.nombre.toLowerCase().includes(addItemSearch.toLowerCase())));
                      if (list.length === 0) return <p className="text-center text-zinc-600 text-sm py-6">Sin resultados</p>;
                      return list.map(prod => {
                        const isLoading = addItemLoading === prod.id;
                        const inCart = pedidoDetalleItems.find(i => i.producto_id === prod.id);
                        return (
                          <button
                            key={prod.id}
                            disabled={isLoading}
                            onClick={() => handleAddPedidoItem(prod)}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50 group"
                            style={{ border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,.08)'; e.currentTarget.style.border = '1px solid rgba(139,92,246,.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {inCart ? (
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                  style={{ background: 'rgba(139,92,246,.2)', color: '#A78BFA' }}
                                >{inCart.cantidad}</span>
                              ) : (
                                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'rgba(255,255,255,.04)' }}>
                                  <Plus size={10} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{prod.nombre}</p>
                                <p className="text-[10px] text-zinc-600 capitalize">{prod.categoria} · Stock: {prod.stock}</p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              {isLoading
                                ? <Spinner size="sm" color="violet" />
                                : <span className="text-amber-400 font-black text-sm tabular-nums">${prod.precio.toLocaleString('es-CL', { minimumFractionDigits:0 })}</span>
                              }
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div
                className="px-6 pb-6 pt-4 flex gap-2.5 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}
              >
                {pedidoDetalle.estado !== 'confirmado' && pedidoDetalle.estado !== 'entregado' && (
                  <button
                    onClick={async () => {
                      const flow = ['pendiente','en preparación','entregado'];
                      const ni = flow.indexOf(pedidoDetalle.estado) + 1;
                      if (ni < flow.length) {
                        await updatePedidoEstado(pedidoDetalle.id, flow[ni]);
                        setPedidoDetalle(prev => ({ ...prev, estado: flow[ni] }));
                        if (pedidoMesaView) loadMesasPedidos();
                      }
                    }}
                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', boxShadow: '0 8px 24px rgba(139,92,246,.3)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,.5)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,.3)'}
                  >
                    <ChevronRight size={16}/>
                    {pedidoDetalle.estado === 'pendiente' ? 'Pasar a preparación' : 'Marcar entregado'}
                  </button>
                )}
                {pedidoDetalle.estado === 'entregado' && (
                  <button
                    onClick={() => { const p = pedidoDetalle; setPedidoDetalle(null); setPedidoDetalleItems([]); confirmarConversionVenta(p); }}
                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,.3)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,.5)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,.3)'}
                  >
                    <Receipt size={15}/> Cobrar y registrar venta
                  </button>
                )}
                {pedidoDetalle.estado === 'confirmado' && (
                  <div
                    className="flex-1 py-3 rounded-2xl text-emerald-400 font-black text-sm flex items-center justify-center gap-2"
                    style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.15)' }}
                  >
                    <Check size={15}/> Venta registrada
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* Confirm dialog global */}
        <ConfirmDialog
          open={!!confirmDialog}
          title={confirmDialog?.title || ''}
          message={confirmDialog?.message || ''}
          onConfirm={confirmDialog?.onConfirm || (() => setConfirmDialog(null))}
          onCancel={() => setConfirmDialog(null)}
          danger={confirmDialog?.danger !== false}
        />

      {/* Modal de código de administrador para acciones críticas */}
      <AdminCodeModal
        open={!!adminModal}
        title={adminModal?.title || ''}
        message={adminModal?.message || ''}
        onConfirm={adminModal?.onConfirm || (() => {})}
        onCancel={() => setAdminModal(null)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showOnboarding && (
        <OnboardingWizard
          user={user}
          onComplete={() => { setShowOnboarding(false); loadProductos(); loadCategorias(); }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-around px-2 h-[60px]"
        style={{ background: '#0D0D14', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { icon: LayoutDashboard, label: 'Dashboard' },
          { icon: ShoppingBag,     label: 'Pedidos'   },
          { icon: Receipt,         label: 'Ventas'    },
          { icon: Calendar,        label: 'Reservas'  },
          { icon: Menu,            label: 'Más'       },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => label === 'Más' ? setSidebarOpen(true) : setActiveTab(label)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors cursor-pointer min-w-0"
            style={{ color: activeTab === label ? '#8B5CF6' : '#94A3B8' }}
          >
            <Icon size={20} strokeWidth={activeTab === label ? 2.2 : 1.8} />
            <span className="text-[9px] font-medium truncate">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
