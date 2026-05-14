import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Utensils, Calendar, Users, BarChart3, Settings, LogOut,
  ChevronRight, Search, Bell, Menu, Package, ShoppingBag, Receipt,
} from 'lucide-react';
import SidebarItem from '../components/layout/SidebarItem';
import UsageBanner from '../components/UsageBanner';
import LanguageSwitcher from '../components/LanguageSwitcher';

const rolColor = {
  admin:       'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
  gerente:     'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  chef:        'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30',
  staff:       'bg-white/5 text-[#94A3B8] border-white/10',
  super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function AppLayout({
  user,
  logout,
  config,
  activeTab,
  setActiveTab,
  pedidos,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  searchQuery,
  setSearchQuery,
  bellOpen,
  setBellOpen,
  children,
}) {
  const { t } = useTranslation('common');
  const pendingBadge = (pedidos || []).filter(p => p.estado === 'pendiente').length || null;

  const NAV_ITEMS = [
    { icon: LayoutDashboard, key: 'Dashboard',    roles: null },
    { icon: ShoppingBag,    key: 'Pedidos',       roles: null, badge: pendingBadge },
    { icon: Receipt,        key: 'Ventas',        roles: null },
    { icon: Calendar,       key: 'Reservas',      roles: null },
    { icon: Users,          key: 'Clientes',      roles: null },
    { icon: Package,        key: 'Inventario',    roles: ['admin', 'gerente', 'super_admin'] },
    { icon: BarChart3,      key: 'Analytics',     roles: ['admin', 'gerente', 'super_admin'] },
  ];

  return (
    <div className="flex min-h-screen font-jakarta" style={{ background: '#090911', color: '#E4E4F0' }}>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen border-r flex flex-col z-[100]
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-[64px] px-2 py-4' : 'w-[220px] px-4 py-5'}
        `}
        style={{ background: '#0C0C15', borderColor: 'rgba(255,255,255,0.055)' }}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 mb-7 cursor-pointer select-none min-h-[40px] ${sidebarCollapsed ? 'justify-center' : 'px-1'}`}
          onClick={() => setActiveTab('Dashboard')}
        >
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="logo"
              className="w-9 h-9 rounded-xl object-contain bg-zinc-800 border border-zinc-700/50 p-0.5 shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #5B21B6)' }}
            >
              <Utensils size={17} className="text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="flex items-baseline gap-1 leading-none">
                <span className="font-black tracking-tight text-[15px] text-[#F0F0FF]">Mastexo</span>
                <span className="font-black text-[15px] text-[#A78BFA]">POS</span>
              </div>
              {(() => {
                const p = user?.restaurante?.plan?.toLowerCase();
                return (
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#7878A0', border: '1px solid rgba(139,92,246,0.15)' }}
                  >
                    {p === 'free' ? 'Starter' : p === 'pro' ? 'Pro' : p === 'business' ? 'Business' : 'Starter'}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-0.5 flex-grow">
          {NAV_ITEMS
            .filter(({ roles }) => !roles || roles.includes(user?.rol))
            .map(({ icon, key, badge }) => (
              <SidebarItem
                key={key}
                icon={icon}
                label={t(`nav.${key}`)}
                active={activeTab === key}
                badge={badge}
                collapsed={sidebarCollapsed}
                onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
              />
            ))}
        </nav>

        <div className="border-t pt-3 flex flex-col gap-0.5" style={{ borderColor: 'rgba(255,255,255,0.055)' }}>
          <SidebarItem
            icon={Settings}
            label={t('nav.Configuración')}
            active={activeTab === 'Configuración'}
            collapsed={sidebarCollapsed}
            onClick={() => { setActiveTab('Configuración'); setSidebarOpen(false); }}
          />
          <button
            onClick={logout}
            title={sidebarCollapsed ? t('logout') : undefined}
            className={`flex items-center rounded-lg text-[#6B6B88] hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer transition-all duration-150 ${sidebarCollapsed ? 'justify-center p-[9px] w-full' : 'gap-2.5 px-3 py-[9px]'}`}
          >
            <LogOut size={sidebarCollapsed ? 17 : 15} strokeWidth={1.8} />
            {!sidebarCollapsed && <span className="font-semibold text-[13px]">{t('logout')}</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? t('expand') : t('collapse')}
            className={`hidden lg:flex items-center rounded-lg text-[#50506A] hover:text-[#7878A0] hover:bg-white/[0.03] cursor-pointer transition-all duration-150 mt-0.5 ${sidebarCollapsed ? 'justify-center p-[9px] w-full' : 'gap-2.5 px-3 py-[9px]'}`}
          >
            <ChevronRight
              size={14}
              strokeWidth={2}
              className={`shrink-0 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`}
            />
            {!sidebarCollapsed && <span className="text-[12px] font-medium">{t('collapse')}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-grow flex flex-col pb-16 lg:pb-0 main-content-area">
        {/* Header */}
        <header
          className="h-[58px] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50"
          style={{
            background: 'rgba(10,10,18,0.82)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center border cursor-pointer transition-colors text-[#7878A0] hover:text-[#F0F0FF]"
              style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <Menu size={18} />
            </button>
            <div className="relative w-36 sm:w-56 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#50506A] pointer-events-none" size={14} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 pr-4 text-sm w-full"
                style={{ paddingTop: '7px', paddingBottom: '7px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(v => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-150 relative cursor-pointer text-[#7878A0] hover:text-[#D0D0E8] hover:bg-white/[0.04]"
                style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.07)' }}
                aria-label={t('notifications')}
              >
                <Bell size={16} />
                <span className="notification-dot absolute top-[9px] right-[9px] w-1.5 h-1.5 rounded-full" style={{ background: '#7C3AED' }} />
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity:0, y:6, scale:0.97 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:6, scale:0.97 }}
                    transition={{ duration: 0.15, ease: [0.16,1,0.3,1] }}
                    className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl z-[200] overflow-hidden"
                    style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B88]">{t('notifications')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(139,92,246,0.12)', color: '#9090B0' }}>{t('new_badge')}</span>
                    </div>
                    <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                      <Bell size={20} className="text-[#30304A]" />
                      <p className="text-xs text-[#50506A]">{t('no_new_notifications')}</p>
                    </div>
                    <button
                      className="w-full py-2.5 text-center text-[11px] text-[#50506A] hover:text-[#9090B0] transition-colors font-medium border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => setBellOpen(false)}
                    >
                      {t('close')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-7" style={{ background: 'rgba(255,255,255,0.07)' }} />

            {/* User chip */}
            <div className="flex items-center gap-2.5 cursor-default">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-[13px]"
                style={{ background: 'linear-gradient(135deg, #6D28D9, #5B21B6)', boxShadow: '0 0 0 2px rgba(109,40,217,0.25)' }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col gap-0.5">
                <span className="font-semibold leading-none text-[13px] text-[#D8D8F0]">{user.nombre}</span>
                <span className={`text-[9px] font-bold px-1.5 py-[2px] rounded border uppercase tracking-wider w-fit ${rolColor[user.rol] || rolColor.staff}`}>
                  {t(`roles.${user.rol}`) || user.rol}
                </span>
              </div>
            </div>
          </div>
        </header>

        <UsageBanner />

        {/* Page content */}
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-around px-2 h-[60px]"
        style={{ background: '#0D0D14', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { icon: LayoutDashboard, key: 'Dashboard' },
          { icon: ShoppingBag,     key: 'Pedidos', badge: pendingBadge },
          { icon: Receipt,         key: 'Ventas' },
          { icon: Calendar,        key: 'Reservas' },
          { icon: Menu,            key: 'Más' },
        ].map(({ icon: Icon, key, badge }) => (
          <button
            key={key}
            onClick={() => key === 'Más' ? setSidebarOpen(true) : setActiveTab(key)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer min-w-0"
            style={{ color: activeTab === key ? '#8B5CF6' : '#6B7280' }}
          >
            {activeTab === key && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-b-full bg-violet-500" />
            )}
            <div className="relative">
              <Icon size={19} strokeWidth={activeTab === key ? 2.2 : 1.6} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium truncate">{t(`nav.${key}`)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
