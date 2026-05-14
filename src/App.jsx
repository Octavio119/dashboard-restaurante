import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { api } from './api';

// Domain hooks
import { useToast }         from './hooks/useToast';
import { useNavigation }    from './hooks/useNavigation';
import { useWebSocket }     from './hooks/useWebSocket';
import { useConfig }        from './hooks/useConfig';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePedidos }    from './hooks/usePedidos';
import { useReservas }   from './hooks/useReservas';
import { useVentas }     from './hooks/useVentas';
import { useInventario } from './hooks/useInventario';
import { useClientes }   from './hooks/useClientes';
import { useProductos }  from './hooks/useProductos';

// Layout shell + global overlay layer
import AppLayout    from './layouts/AppLayout';
import GlobalModals from './components/modals/GlobalModals';

// Pages
import DashboardPage     from './pages/DashboardPage';
import PedidosPage       from './pages/PedidosPage';
import ReservasPage      from './pages/ReservasPage';
import ClientesPage      from './pages/ClientesPage';
import InventarioPage    from './pages/InventarioPage';
import VentasPage        from './pages/VentasPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import Landing           from './pages/Landing';
import Register          from './pages/Register';
import Login             from './pages/Login';
import Billing           from './pages/Billing';
import ApiKeysPage       from './pages/ApiKeysPage';
import BillingSuccess    from './pages/BillingSuccess';
import Spinner           from './components/ui/Spinner';
import SyncBanner        from './components/SyncBanner';

// Pure utility functions (no React state)
import { exportCSV, exportReportePDF, exportVentasExcel, exportInventarioExcel } from './lib/exportUtils';
import { printPedido, printTicket, downloadPDF } from './lib/printUtils';

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const { user, loading: authLoading, logout } = useAuth();

  // Filter state shared across hooks
  const [dateFilter,      setDateFilter]      = useState(new Date().toISOString().split('T')[0]);
  const [salesFilter,     setSalesFilter]     = useState('dia');
  const [selectedDate,    setSelectedDate]    = useState(new Date().toISOString().split('T')[0]);
  const [reservasPeriodo, setReservasPeriodo] = useState('dia');
  const [showOnboarding,  setShowOnboarding]  = useState(false);

  // All hooks called unconditionally (Rules of Hooks)
  const { toasts, addToast, removeToast } = useToast();
  const nav   = useNavigation();
  useWebSocket({ user, addToast });
  const cfg   = useConfig({ user });
  const peds  = usePedidos({ user, dateFilter, salesFilter });
  const { isOnline, pendingCount, isSyncing, syncNow, refreshPendingCount } = useNetworkStatus({
    addToast,
    onSyncComplete: () => peds.loadPedidos(),
  });
  const ress  = useReservas({ user, selectedDate, setSelectedDate, reservasPeriodo, setReservasPeriodo });
  const vtas  = useVentas({ user, salesFilter });
  const inv   = useInventario({ user });
  const clts  = useClientes({ user });
  const prods = useProductos({ user });

  // Merge adminModal / confirmDialog from the hook that currently owns one
  const adminModal    = peds.adminModal || ress.adminModal || clts.adminModal || vtas.adminModal;
  const clearAdmin    = () => { peds.setAdminModal(null); ress.setAdminModal(null); clts.setAdminModal(null); vtas.setAdminModal(null); };
  const confirmDialog = peds.confirmDialog || clts.confirmDialog;
  const clearConfirm  = () => { peds.setConfirmDialog(null); clts.setConfirmDialog(null); };

  // ── Cross-cutting effects ─────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) api.backfillClientes().catch(() => {}); }, [user]);

  useEffect(() => { // Onboarding wizard for new empty restaurants
    if (!user || user.rol !== 'admin') return;
    if (localStorage.getItem(`onboarding_dismissed_${user.restaurante_id}`)) return;
    Promise.all([api.getProductos(), api.getCategorias()]).then(([p, c]) => {
      if (p.length === 0 && c.length === 0) setShowOnboarding(true);
    }).catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // Low-perf device: disable backdrop-filter globally
    const lowPerf = navigator.hardwareConcurrency <= 4 || /Android/.test(navigator.userAgent);
    if (lowPerf) document.documentElement.classList.add('no-blur');
    return () => document.documentElement.classList.remove('no-blur');
  }, []);

  useEffect(() => { // Plan-gate toast + nav:billing event
    const handler = (e) => {
      const { feature, plan_requerido } = e.detail || {};
      const label = feature === 'analytics' ? 'Analytics' : feature === 'pdf' ? 'PDF de tickets' : (feature || 'esta función');
      addToast(`${label} requiere plan ${plan_requerido ?? 'Pro'}. Actualiza en Facturación.`, 'warning', { icon: '🔒', title: 'Plan requerido' });
    };
    const navBilling = () => nav.setActiveTab('Billing');
    window.addEventListener('upgrade_required', handler);
    window.addEventListener('nav:billing', navBilling);
    return () => { window.removeEventListener('upgrade_required', handler); window.removeEventListener('nav:billing', navBilling); };
  }, [addToast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // PayPal / Stripe redirect query-string toasts
    if (!user) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('upgraded') === 'true') {
      addToast('¡Plan actualizado con éxito! Bienvenido al nuevo plan.', 'success', { icon: '🎉', title: 'Pago exitoso' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (p.get('cancelled') === 'true') {
      addToast('El pago fue cancelado. Puedes intentarlo de nuevo desde Facturación.', 'warning', { icon: '⚠️', title: 'Pago cancelado' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (p.get('error')) {
      addToast('Hubo un problema con el pago. Contacta soporte si el problema persiste.', 'error', { icon: '❌', title: 'Error en el pago' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab-triggered data loads ──────────────────────────────────────────────────
  useEffect(() => {
    if (user && nav.activeTab === 'Ventas') {
      vtas.loadVentasDia();
      api.getCajaHoy().then(vtas.setCajaHoy).catch(() => vtas.setCajaHoy(null));
    }
  }, [user, nav.activeTab, vtas.ventasFecha]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && nav.activeTab === 'Inventario') {
      inv.loadInventario(inv.movFiltros);
      prods.loadProductos();
    }
  }, [user, nav.activeTab, inv.movFiltros]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && nav.activeTab === 'Pedidos') {
      prods.loadProductos();
      if (peds.pedidoMesaView) peds.loadMesasPedidos();
    }
  }, [user, nav.activeTab, peds.pedidoMesaView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Routing guards (placed after hooks — Rules of Hooks) ──────────────────────
  const _qs = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/billing' && (_qs.get('success') === '1' || _qs.get('cancel') === '1')) {
    return <BillingSuccess />;
  }
  if (authLoading) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Spinner size="lg" color="violet" /></div>;
  }
  if (!user) {
    const path = window.location.pathname;
    if (path === '/' || path === '') return <Landing />;
    if (path === '/register') return <Register />;
    return <Login />;
  }
  if (window.location.pathname === '/billing') return _qs.get('success') === '1' ? <BillingSuccess /> : <Billing />;
  if (window.location.pathname === '/apikeys') return <ApiKeysPage user={user} />;

  // ── Derived values ────────────────────────────────────────────────────────────
  const safeReservas = Array.isArray(ress.reservas) ? ress.reservas : [];
  const safePedidos  = Array.isArray(peds.pedidos)  ? peds.pedidos  : [];
  const safeClientes = Array.isArray(clts.clientes) ? clts.clientes : [];
  const isAdmin      = user?.rol === 'admin' || user?.rol === 'super_admin';
  const isGerente    = isAdmin || user?.rol === 'gerente';
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayReservations = safeReservas.filter(r => r.fecha === todayStr);
  const dailyReservations = safeReservas.filter(r => reservasPeriodo === 'dia' ? r.fecha === selectedDate : true);
  const filteredOrders    = safePedidos.filter(o =>
    o.cliente_nombre?.toLowerCase().includes(nav.searchQuery.toLowerCase()) ||
    o.numero?.toLowerCase().includes(nav.searchQuery.toLowerCase()));
  const filteredClientes  = safeClientes.filter(c =>
    c.nombre?.toLowerCase().includes(nav.searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(nav.searchQuery.toLowerCase()) ||
    c.rut?.toLowerCase().includes(nav.searchQuery.toLowerCase()));
  const reservaPedidoMap  = {};
  for (const p of peds.pedidos) {
    if (p.reserva_id && !['confirmado','cancelado'].includes(p.estado)) reservaPedidoMap[p.reserva_id] = p;
  }

  // ── Cross-domain adapters ─────────────────────────────────────────────────────
  const deletePedidoAdapter            = (pedido)  => peds.deletePedido(pedido, isAdmin);
  const deleteClienteAdapter           = (cliente) => clts.deleteCliente(cliente, isAdmin);
  const eliminarCategoriaAdapter       = (cat)     => prods.eliminarCategoria(cat, peds.setConfirmDialog);
  const deleteProductoAdapter          = (prod)    => prods.deleteProducto(prod, peds.setConfirmDialog);
  const handleCrearPedidoDesdeReserva  = (reserva) => ress.handleCrearPedidoDesdeReserva(reserva, peds.openPedidoDetalle, prods.loadProductos);
  const saveMovimientoAdapter          = ()        => inv.saveMovimiento(user.id, prods.loadProductos);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <SyncBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        syncNow={syncNow}
      />
      <AppLayout
        user={user} logout={logout} config={cfg.config}
        activeTab={nav.activeTab} setActiveTab={nav.setActiveTab}
        pedidos={peds.pedidos}
        sidebarOpen={nav.sidebarOpen}       setSidebarOpen={nav.setSidebarOpen}
        sidebarCollapsed={nav.sidebarCollapsed} setSidebarCollapsed={nav.setSidebarCollapsed}
        searchQuery={nav.searchQuery}       setSearchQuery={nav.setSearchQuery}
        bellOpen={nav.bellOpen}             setBellOpen={nav.setBellOpen}
      >
        <AnimatePresence mode="wait">

          {nav.activeTab === 'Dashboard' && (
            <DashboardPage
              user={user}
              todayReservations={todayReservations}
              exportCSV={() => exportCSV(peds.pedidos, ress.reservas)}
              setIsNewResModalOpen={ress.setIsNewResModalOpen}
              ventasResumen={vtas.ventasResumen}
              pedidos={peds.pedidos}
              salesData={vtas.salesData}
              setActiveTab={nav.setActiveTab}
            />
          )}

          {nav.activeTab === 'Pedidos' && (
            <PedidosPage
              pedidoMesaView={peds.pedidoMesaView}   setPedidoMesaView={peds.setPedidoMesaView}
              loadMesasPedidos={peds.loadMesasPedidos} mesasPedidos={peds.mesasPedidos}
              salesFilter={salesFilter}               setSalesFilter={setSalesFilter}
              dateFilter={dateFilter}                 setDateFilter={setDateFilter}
              filteredOrders={filteredOrders}         ventasFiltro={vtas.ventasFiltro}
              pedidoForm={peds.pedidoForm}             setPedidoForm={peds.setPedidoForm}
              pedidoItems={peds.pedidoItems}           setPedidoItems={peds.setPedidoItems}
              pedidoSearch={peds.pedidoSearch}         setPedidoSearch={peds.setPedidoSearch}
              pedidoCatFilter={peds.pedidoCatFilter}   setPedidoCatFilter={peds.setPedidoCatFilter}
              pedidoModal={peds.pedidoModal}           setPedidoModal={peds.setPedidoModal}
              openPedidoDetalle={peds.openPedidoDetalle}
              printPedido={(o) => printPedido(o, cfg.config)}
              confirmarConversionVenta={peds.confirmarConversionVenta}
              updatePedidoEstado={peds.updatePedidoEstado}
              deletePedido={deletePedidoAdapter}
              productos={prods.productos}             loadProductos={prods.loadProductos}
              productosLoading={prods.productosLoading}
              clienteSearchResults={peds.clienteSearchResults}
              setClienteSearchResults={peds.setClienteSearchResults}
              isSearchingClientes={peds.isSearchingClientes}
              pedidoLoading={peds.pedidoLoading}       setPedidoLoading={peds.setPedidoLoading}
              pedidosLoading={peds.pedidosLoading}
              setPedidos={peds.setPedidos}              api={api}
              isOnline={isOnline}
              addToast={addToast}
              refreshPendingCount={refreshPendingCount}
            />
          )}

          {nav.activeTab === 'Reservas' && (
            <ReservasPage
              getDaysInMonth={ress.getDaysInMonth}
              reservas={ress.reservas}
              selectedDate={selectedDate}           setSelectedDate={setSelectedDate}
              reservasPeriodo={reservasPeriodo}     setReservasPeriodo={setReservasPeriodo}
              autoReminder={ress.autoReminder}      setAutoReminder={ress.setAutoReminder}
              autoWhatsApp={ress.autoWhatsApp}      setAutoWhatsApp={ress.setAutoWhatsApp}
              dailyReservations={dailyReservations}
              reservaPedidoMap={reservaPedidoMap}
              loadProductos={prods.loadProductos}   openPedidoDetalle={peds.openPedidoDetalle}
              crearPedidoRes={ress.crearPedidoRes}  setCrearPedidoRes={ress.setCrearPedidoRes}
              setSelectedReservaConsumo={ress.setSelectedReservaConsumo}
              setReservaConsumoModal={ress.setReservaConsumoModal}
              loadReservaConsumos={ress.loadReservaConsumos}
              updateReservaEstado={ress.updateReservaEstado}
              sendWhatsApp={ress.sendWhatsApp}
              deleteReserva={ress.deleteReserva}
              crearPedidoLoading={ress.crearPedidoLoading}
              handleCrearPedidoDesdeReserva={handleCrearPedidoDesdeReserva}
              setIsNewResModalOpen={ress.setIsNewResModalOpen}
            />
          )}

          {nav.activeTab === 'Clientes' && (
            <ClientesPage
              filteredClientes={filteredClientes}
              setClienteForm={clts.setClienteForm}
              setClienteFormOpen={clts.setClienteFormOpen}
              setSelectedCustomer={clts.setSelectedCustomer}
              isAdmin={isAdmin}
              deleteCliente={deleteClienteAdapter}
            />
          )}

          {nav.activeTab === 'Inventario' && (
            <InventarioPage
              inventarioTab={inv.inventarioTab}   setInventarioTab={inv.setInventarioTab}
              exportInventarioExcel={exportInventarioExcel}
              productos={prods.productos}
              productosLoading={prods.productosLoading}
              loadProductos={prods.loadProductos}
              setMovimientoForm={inv.setMovimientoForm} setIsMovModalOpen={inv.setIsMovModalOpen}
              proveedores={inv.proveedores}
              movStats={inv.movStats}             movFiltros={inv.movFiltros}
              setMovFiltros={inv.setMovFiltros}
              invLoading={inv.invLoading}         movimientos={inv.movimientos}
              movTotal={inv.movTotal}
              setProveedorForm={inv.setProveedorForm} setIsProvModalOpen={inv.setIsProvModalOpen}
              deleteProveedor={inv.deleteProveedor}
            />
          )}

          {nav.activeTab === 'Ventas' && (
            <VentasPage
              ventasFecha={vtas.ventasFecha}         setVentasFecha={vtas.setVentasFecha}
              ventasDia={vtas.ventasDia}
              exportReportePDF={(l, f) => exportReportePDF(l, f, cfg.config)}
              exportVentasExcel={exportVentasExcel}
              setVentaItems={vtas.setVentaItems}     setVentaMetodo={vtas.setVentaMetodo}
              setVentaTicket={vtas.setVentaTicket}   setVentaProductos={vtas.setVentaProductos}
              setVentaModal={vtas.setVentaModal}
              api={api}
              cajaHoy={vtas.cajaHoy}                cajaMonto={vtas.cajaMonto}
              setCajaMonto={vtas.setCajaMonto}       setCajaModal={vtas.setCajaModal}
              cajaModal={vtas.cajaModal}             cajaLoading={vtas.cajaLoading}
              setCajaLoading={vtas.setCajaLoading}   setCajaHoy={vtas.setCajaHoy}
              ventasResumen={vtas.ventasResumen}
              downloadPDF={(v) => downloadPDF(v, cfg.config)}
              printTicket={(v) => printTicket(v, cfg.config)}
              isAdmin={isAdmin}                      deleteVenta={vtas.deleteVenta}
              loadVentasDia={vtas.loadVentasDia}     loadVentas={vtas.loadVentas}
              ventaItems={vtas.ventaItems}           ventaProductos={vtas.ventaProductos}
              ventaMetodo={vtas.ventaMetodo}         config={cfg.config}
              ventaLoading={vtas.ventaLoading}       setVentaLoading={vtas.setVentaLoading}
              ventaTicket={vtas.ventaTicket}         ventaModal={vtas.ventaModal}
              user={user}
            />
          )}

          {nav.activeTab === 'Analytics' && (
            <AnalyticsPage
              loadAnalytics={vtas.loadAnalytics}
              analytics={vtas.analytics}
              analyticsError={vtas.analyticsError}
            />
          )}

          {nav.activeTab === 'Configuración' && (
            <ConfiguracionPage
              config={cfg.config}             setConfig={cfg.setConfig}
              configSaved={cfg.configSaved}   configSaving={cfg.configSaving}
              configTab={cfg.configTab}       setConfigTab={cfg.setConfigTab}
              logoFile={cfg.logoFile}         setLogoFile={cfg.setLogoFile}
              logoPreview={cfg.logoPreview}   setLogoPreview={cfg.setLogoPreview}
              saveConfig={cfg.saveConfig}
              categorias={prods.categorias}   productos={prods.productos}
              productosLoading={prods.productosLoading}
              nuevaCategoria={prods.nuevaCategoria}   setNuevaCategoria={prods.setNuevaCategoria}
              editCategoria={prods.editCategoria}     setEditCategoria={prods.setEditCategoria}
              newProduct={prods.newProduct}           setNewProduct={prods.setNewProduct}
              editProduct={prods.editProduct}         setEditProduct={prods.setEditProduct}
              activeMenuCategory={prods.activeMenuCategory}
              setActiveMenuCategory={prods.setActiveMenuCategory}
              agregarCategoria={prods.agregarCategoria}
              guardarEditCategoria={prods.guardarEditCategoria}
              eliminarCategoria={eliminarCategoriaAdapter}
              saveProducto={prods.saveProducto}
              updateProductoSave={prods.updateProductoSave}
              deleteProducto={deleteProductoAdapter}
              usuarios={prods.usuarios}
              newUser={prods.newUser}         setNewUser={prods.setNewUser}
              userFormOpen={prods.userFormOpen} setUserFormOpen={prods.setUserFormOpen}
              createUsuario={prods.createUsuario}
              toggleUsuarioActivo={prods.toggleUsuarioActivo}
              user={user} isAdmin={isAdmin} canEditMenu={isGerente}
              setConfirmDialog={peds.setConfirmDialog}
            />
          )}

        </AnimatePresence>
      </AppLayout>

      <GlobalModals
        // Reservas
        isNewResModalOpen={ress.isNewResModalOpen}   setIsNewResModalOpen={ress.setIsNewResModalOpen}
        newResData={ress.newResData}                 setNewResData={ress.setNewResData}
        addResLoading={ress.addResLoading}           addReservation={ress.addReservation}
        lastCreatedRes={ress.lastCreatedRes}         setLastCreatedRes={ress.setLastCreatedRes}
        sendWhatsApp={ress.sendWhatsApp}
        reservaConsumoModal={ress.reservaConsumoModal} setReservaConsumoModal={ress.setReservaConsumoModal}
        selectedReservaConsumo={ress.selectedReservaConsumo}
        reservaItems={ress.reservaItems}
        resConsumoBusqueda={ress.resConsumoBusqueda} setResConsumoBusqueda={ress.setResConsumoBusqueda}
        resConsumoLoading={ress.resConsumoLoading}
        handleAddConsumo={ress.handleAddConsumo}
        handleDeleteConsumo={ress.handleDeleteConsumo}
        ejecutarCierreCuentaReserva={ress.ejecutarCierreCuentaReserva}
        // Clientes
        selectedCustomer={clts.selectedCustomer}     setSelectedCustomer={clts.setSelectedCustomer}
        clienteFormOpen={clts.clienteFormOpen}       setClienteFormOpen={clts.setClienteFormOpen}
        clienteForm={clts.clienteForm}               setClienteForm={clts.setClienteForm}
        saveCliente={clts.saveCliente}
        // Inventario
        isMovModalOpen={inv.isMovModalOpen}         setIsMovModalOpen={inv.setIsMovModalOpen}
        movimientoForm={inv.movimientoForm}         setMovimientoForm={inv.setMovimientoForm}
        isSavingMov={inv.isSavingMov}               saveMovimiento={saveMovimientoAdapter}
        successMessage={inv.successMessage}
        isProvModalOpen={inv.isProvModalOpen}       setIsProvModalOpen={inv.setIsProvModalOpen}
        proveedorForm={inv.proveedorForm}           setProveedorForm={inv.setProveedorForm}
        saveProveedor={inv.saveProveedor}
        // Pedidos
        pedidoConvertModal={peds.pedidoConvertModal}   setPedidoConvertModal={peds.setPedidoConvertModal}
        convertMetodo={peds.convertMetodo}             setConvertMetodo={peds.setConvertMetodo}
        convertLoading={peds.convertLoading}           ejecutarConversionVenta={peds.ejecutarConversionVenta}
        pedidoDetalle={peds.pedidoDetalle}             setPedidoDetalle={peds.setPedidoDetalle}
        pedidoDetalleItems={peds.pedidoDetalleItems}   setPedidoDetalleItems={peds.setPedidoDetalleItems}
        addItemSearch={peds.addItemSearch}             setAddItemSearch={peds.setAddItemSearch}
        addItemLoading={peds.addItemLoading}
        handleAddPedidoItem={peds.handleAddPedidoItem}
        handleUpdatePedidoItemQty={peds.handleUpdatePedidoItemQty}
        handleDeletePedidoItem={peds.handleDeletePedidoItem}
        updatePedidoEstado={peds.updatePedidoEstado}
        confirmarConversionVenta={peds.confirmarConversionVenta}
        pedidoMesaView={peds.pedidoMesaView}           loadMesasPedidos={peds.loadMesasPedidos}
        // Shared data
        config={cfg.config}
        productos={prods.productos}                    productosLoading={prods.productosLoading}
        proveedores={inv.proveedores}
        cajaHoy={vtas.cajaHoy}
        // Global dialogs + overlays
        confirmDialog={confirmDialog}                  setConfirmDialog={clearConfirm}
        adminModal={adminModal}                        setAdminModal={clearAdmin}
        toasts={toasts}                                removeToast={removeToast}
        showOnboarding={showOnboarding}                setShowOnboarding={setShowOnboarding}
        user={user}
        loadProductos={prods.loadProductos}            loadCategorias={prods.loadCategorias}
      />
    </>
  );
};

export default App;
