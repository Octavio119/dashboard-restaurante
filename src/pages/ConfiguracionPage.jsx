import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Building2, Receipt, Shield, Utensils,
  Clock, CreditCard, Banknote, Smartphone, QrCode,
  Zap, Save, Check, Upload, X, ImageIcon, Plus, FileText
} from 'lucide-react';
import MenuPage from './MenuPage';

const ConfiguracionPage = ({
  // Config state
  config, setConfig,
  configSaved, configSaving,
  configTab, setConfigTab,
  logoFile, setLogoFile,
  logoPreview, setLogoPreview,
  saveConfig,
  // Productos/categorías
  categorias, productos, productosLoading,
  nuevaCategoria, setNuevaCategoria,
  editCategoria, setEditCategoria,
  newProduct, setNewProduct,
  editProduct, setEditProduct,
  activeMenuCategory, setActiveMenuCategory,
  agregarCategoria, guardarEditCategoria, eliminarCategoria,
  saveProducto, updateProductoSave, deleteProducto,
  // Usuarios
  usuarios,
  newUser, setNewUser,
  userFormOpen, setUserFormOpen,
  createUsuario, toggleUsuarioActivo,
  // Permisos
  user, isAdmin, canEditMenu,
  // Confirm dialog (para eliminarCategoria/deleteProducto)
  setConfirmDialog,
}) => {
  const rolLabel = { admin:'Administrador', chef:'Chef', staff:'Personal', gerente:'Gerente', super_admin:'Super Admin' };

  return (
    <motion.div key="config" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(139,92,246,.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.2)' }}>
              <Settings size={9} className="inline" /> Configuración
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Configuración <span style={{ color: 'var(--purple)' }}>General</span></h2>
          <p className="text-zinc-500 text-sm mt-1">Ajusta tu restaurante y preferencias del sistema</p>
        </div>
        {(configTab === 'negocio' || configTab === 'facturacion') && (
          <button onClick={saveConfig} disabled={configSaving}
            className={`btn-primary flex items-center gap-2 transition-all active:scale-[0.97] ${configSaved ? '!bg-green-500 !text-white' : 'hover:opacity-90'} disabled:opacity-60`}
            style={{ height: '40px', padding: '0 22px', fontSize: '14px', fontWeight: 500, borderRadius: '8px' }}>
            <Save size={15}/> {configSaving ? 'Guardando…' : configSaved ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-0.5 w-fit" style={{ background: 'rgba(10,10,18,.8)', border: '1px solid rgba(139,92,246,.12)', borderRadius: '10px', padding: '4px' }}>
        {[
          { key:'negocio',     label:'Negocio',     icon:Building2, adminOnly: false },
          { key:'facturacion', label:'Facturación', icon:Receipt,   adminOnly: true  },
          { key:'usuarios',    label:'Usuarios',    icon:Shield,    adminOnly: true  },
          { key:'menu',        label:'Menú',        icon:Utensils,  adminOnly: false },
        ].filter(t => !t.adminOnly || isAdmin)
         .map(({ key, label, icon:Icon }) => (
          <button key={key} onClick={() => setConfigTab(key)}
            className="flex items-center gap-1.5 transition-all"
            style={{
              fontSize: '13px', padding: '7px 16px', borderRadius: '8px',
              ...(configTab === key
                ? { background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.28)', color: '#C4B5FD', fontWeight: 600 }
                : { background: 'transparent', border: '1px solid transparent', color: '#52525B' })
            }}
            onMouseEnter={e => { if (configTab !== key) { e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.background = 'rgba(139,92,246,.05)'; } }}
            onMouseLeave={e => { if (configTab !== key) { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'transparent'; } }}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── NEGOCIO ── */}
      {configTab === 'negocio' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4" style={{ background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#7C6A9E', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(139,92,246,.12)', marginBottom: '4px' }}><Building2 size={14} style={{ color: '#8B5CF6' }}/>Datos del Negocio</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Logo en negocio tab */}
              <div className="col-span-2 flex items-center gap-5">
                <div
                  className="flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer transition-all"
                  style={{ width: '80px', height: '80px', background: '#111113', border: '1.5px dashed #27272A', borderRadius: '12px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.background = '#1A0D2E'; e.currentTarget.querySelector('svg')?.setAttribute('style','color:#A78BFA'); }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.background = '#111113'; e.currentTarget.querySelector('svg')?.setAttribute('style','color:#3F3F46'); }}
                >
                  {(logoPreview || config.logoUrl)
                    ? <img src={logoPreview || config.logoUrl} alt="logo" className="w-full h-full object-contain p-1.5"/>
                    : <Building2 size={22} style={{ color: '#3F3F46' }}/>
                  }
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <span style={{ fontSize: '11px', color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Logo del negocio</span>
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    id="logo-file-input-negocio" className="hidden"
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
                      className="flex items-center gap-1.5 cursor-pointer transition-colors"
                      style={{ fontSize: '13px', color: '#7C3AED' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#7C3AED'; }}
                    >
                      <Upload size={13}/> {config.logoUrl || logoFile ? 'Cambiar logo' : 'Subir logo'}
                    </label>
                    {logoFile && <span className="text-[11px] text-amber-400 flex items-center gap-1"><Check size={11}/>Lista — guarda para aplicar</span>}
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nombre del Restaurante</label>
                <input type="text" value={config.restaurantName} onChange={e=>setConfig({...config,restaurantName:e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>RUT</label>
                <input type="text" value={config.rut} onChange={e=>setConfig({...config,rut:e.target.value})} placeholder="76.543.210-K" className="input font-mono" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Moneda</label>
                <select value={config.currencyCode} onChange={e=>{const m={USD:'$',EUR:'€',CLP:'$',DOP:'RD$'};setConfig({...config,currencyCode:e.target.value,currency:m[e.target.value]})}} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="CLP">🇨🇱 CLP</option>
                  <option value="DOP">🇩🇴 DOP</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input type="text" value={config.direccion} onChange={e=>setConfig({...config,direccion:e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4" style={{ background: 'rgba(99,102,241,.04)', border: '1px solid rgba(99,102,241,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#6059A0', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(99,102,241,.12)', marginBottom: '4px' }}><Clock size={14} style={{ color: '#6366F1' }}/>Horario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Apertura</label>
                <input type="time" value={config.openTime} onChange={e=>setConfig({...config,openTime:e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Cierre</label>
                <input type="time" value={config.closeTime} onChange={e=>setConfig({...config,closeTime:e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4" style={{ background: 'rgba(20,184,166,.04)', border: '1px solid rgba(20,184,166,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#2A7A70', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(20,184,166,.12)', marginBottom: '4px' }}><CreditCard size={14} style={{ color: '#14B8A6' }}/>Métodos de Pago</h3>
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

          <div className="flex flex-col gap-4" style={{ background: 'rgba(245,158,11,.03)', border: '1px solid rgba(245,158,11,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#7A6020', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(245,158,11,.12)', marginBottom: '4px' }}>
              <Zap size={14} style={{ color: '#F59E0B' }}/>Preferencias Avanzadas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Zona horaria</label>
                <select value={config.timezone} onChange={e => setConfig({...config, timezone: e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}>
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
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Idioma del sistema</label>
                <select value={config.idioma} onChange={e => setConfig({...config, idioma: e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}>
                  <option value="es">🇪🇸 Español</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="pt">🇧🇷 Português</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Formato de fecha</label>
                <select value={config.formatoFecha} onChange={e => setConfig({...config, formatoFecha: e.target.value})} className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (10/04/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (04/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-04-10)</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY (10-04-2026)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>IVA / Impuesto (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.1" value={config.taxRate}
                    onChange={e => setConfig({...config, taxRate: parseFloat(e.target.value) || 0})}
                    className="input pr-8" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
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

      {/* ── FACTURACIÓN ── */}
      {configTab === 'facturacion' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4" style={{ background: 'rgba(59,130,246,.04)', border: '1px solid rgba(59,130,246,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#2A4A7A', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(59,130,246,.12)', marginBottom: '4px' }}>
              <Receipt size={14} style={{ color: '#3B82F6' }}/>Configuración de Tickets
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Prefijo del ticket</label>
                <input type="text" maxLength={8} value={config.prefijoTicket}
                  onChange={e => setConfig({...config, prefijoTicket: e.target.value.toUpperCase()})}
                  placeholder="TKT" className="input font-mono"
                  style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
                <p className="text-[10px] text-zinc-600">Ejemplo: {config.prefijoTicket || 'TKT'}-000123</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#52525B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Número inicial</label>
                <input type="number" min="1" step="1" value={config.numeroInicial}
                  onChange={e => setConfig({...config, numeroInicial: parseInt(e.target.value) || 1})}
                  className="input" style={{ background: '#111113', border: '1px solid #1F1F23', borderRadius: '8px', color: '#F4F4F5', fontSize: '14px', height: '44px' }}/>
                <p className="text-[10px] text-zinc-600">El próximo ticket será #{config.numeroInicial}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4" style={{ background: 'rgba(16,185,129,.04)', border: '1px solid rgba(16,185,129,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#1E6A50', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(16,185,129,.12)', marginBottom: '4px' }}>
              <FileText size={14} style={{ color: '#10B981' }}/>Impuesto en documentos
            </h3>
            <div onClick={() => setConfig({...config, impuestoActivo: !config.impuestoActivo})}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${config.impuestoActivo ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
              <div>
                <p className={`text-sm font-semibold ${config.impuestoActivo ? 'text-white' : 'text-zinc-400'}`}>Mostrar IVA / impuesto en tickets</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {config.impuestoActivo ? `Se mostrará ${config.taxRate}% en cada documento` : 'El impuesto no aparecerá en los tickets'}
                </p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${config.impuestoActivo ? 'bg-[#8B5CF6]' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.impuestoActivo ? 'left-5' : 'left-1'}`}/>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4" style={{ background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.18)', borderRadius: '12px', padding: '24px' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600, color: '#7C6A9E', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '16px', borderBottom: '1px solid rgba(139,92,246,.12)', marginBottom: '4px' }}>
              <ImageIcon size={14} style={{ color: '#8B5CF6' }}/>Logo del negocio
            </h3>
            <div className="flex gap-5 items-start">
              <div className="flex items-center justify-center flex-shrink-0 overflow-hidden transition-all"
                style={{ width: '80px', height: '80px', background: '#111113', border: '1.5px dashed #27272A', borderRadius: '12px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.background = '#1A0D2E'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.background = '#111113'; }}>
                {(logoPreview || config.logoUrl)
                  ? <img src={logoPreview || config.logoUrl} alt="logo" className="w-full h-full object-contain p-1.5"/>
                  : <Building2 size={28} style={{ color: '#3F3F46' }}/>
                }
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{logoFile ? logoFile.name : (config.logoUrl ? 'Logo guardado' : 'Sin logo')}</p>
                  <p className="text-[11px] text-zinc-500">PNG, JPG, WEBP o SVG · Máx. 2 MB</p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  id="logo-file-input" className="hidden"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setLogoFile(file);
                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                    setLogoPreview(URL.createObjectURL(file));
                  }}
                />
                <div className="flex gap-2 flex-wrap">
                  <label htmlFor="logo-file-input" className="flex items-center gap-2 cursor-pointer transition-colors"
                    style={{ fontSize: '13px', color: '#7C3AED' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#7C3AED'; }}>
                    <Upload size={14}/> Subir imagen
                  </label>
                  {(logoPreview || config.logoUrl) && (
                    <button type="button" onClick={() => {
                      if (logoPreview) URL.revokeObjectURL(logoPreview);
                      setLogoFile(null); setLogoPreview(null);
                      setConfig(prev => ({ ...prev, logoUrl: '' }));
                    }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-sm font-semibold text-red-400 cursor-pointer transition-colors">
                      <X size={14}/> Quitar logo
                    </button>
                  )}
                </div>
                {logoFile && <p className="text-[11px] text-amber-400 flex items-center gap-1"><Check size={12}/> Imagen lista — presiona "Guardar cambios" para aplicar</p>}
                <p className="text-[10px] text-zinc-600">Se mostrará en el sidebar y en los tickets impresos.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USUARIOS ── */}
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
                    <td className="px-5 py-4"><span className="text-xs font-bold uppercase text-zinc-300">{rolLabel[u.rol]||u.rol}</span></td>
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

      {/* ── MENÚ (delegado) ── */}
      {configTab === 'menu' && (
        <MenuPage
          categorias={categorias} productos={productos} productosLoading={productosLoading}
          nuevaCategoria={nuevaCategoria} setNuevaCategoria={setNuevaCategoria}
          editCategoria={editCategoria} setEditCategoria={setEditCategoria}
          newProduct={newProduct} setNewProduct={setNewProduct}
          editProduct={editProduct} setEditProduct={setEditProduct}
          activeMenuCategory={activeMenuCategory} setActiveMenuCategory={setActiveMenuCategory}
          agregarCategoria={agregarCategoria} guardarEditCategoria={guardarEditCategoria}
          eliminarCategoria={(cat) => eliminarCategoria(cat, setConfirmDialog)}
          saveProducto={saveProducto} updateProductoSave={updateProductoSave}
          deleteProducto={(prod) => deleteProducto(prod, setConfirmDialog)}
          canEditMenu={canEditMenu} isAdmin={isAdmin}
        />
      )}
    </motion.div>
  );
};

export default ConfiguracionPage;
