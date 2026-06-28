import { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, X, Check, Pencil, Trash2, Utensils,
  Package, Search, ChevronRight, AlertCircle, Grid3X3,
  ShoppingBag, TrendingUp, Layers,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { surface, color, text, border, radius, shadow, alpha, palette } from '../lib/tokens';

// ─── Stock status config ──────────────────────────────────────────────────────
const stockStatus = (stock) => {
  if (stock === 0)  return { label: 'Agotado',    fg: color.red,   bg: alpha(color.red, 0.08),   bd: alpha(color.red, 0.18)   };
  if (stock <= 5)   return { label: 'Stock bajo',  fg: color.amber, bg: alpha(color.amber, 0.08), bd: alpha(color.amber, 0.18) };
  return               { label: 'Disponible',  fg: color.green, bg: alpha(color.green, 0.08), bd: alpha(color.green, 0.18) };
};

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp   = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };
const stagger  = { show: { transition: { staggerChildren: 0.05 } } };
const rowAnim  = { hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.18, ease: 'easeOut' } } };

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatPill = memo(({ icon: Icon, label, value, accent }) => (
  <div
    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
    style={{ background: alpha(accent, 0.08), border: `1px solid ${alpha(accent, 0.16)}` }}
  >
    <Icon size={14} style={{ color: accent }} />
    <span className="text-[12px] font-semibold" style={{ color: text.secondary }}>{label}</span>
    <span className="text-[13px] font-black ml-0.5" style={{ color: accent }}>{value}</span>
  </div>
));

const CategoryChip = memo(({ cat, count, isActive, canEdit, isAdmin, editCategoria, setEditCategoria, guardarEditCategoria, eliminarCategoria, onClick }) => {
  const editing = editCategoria?.id === cat.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={!editing ? onClick : undefined}
      className={cn(
        'group flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer select-none',
        isActive && !editing ? 'border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]' : 'hover:border-white/12'
      )}
      style={{
        background: isActive && !editing ? alpha(color.purple, 0.12) : surface.raised,
        borderColor: isActive && !editing ? alpha(color.purple, 0.35) : border.base,
      }}
    >
      {editing ? (
        <>
          <input
            autoFocus
            value={editCategoria.nombre}
            onChange={e => setEditCategoria({ ...editCategoria, nombre: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter')  guardarEditCategoria();
              if (e.key === 'Escape') setEditCategoria(null);
            }}
            onClick={e => e.stopPropagation()}
            className="bg-transparent outline-none w-24 text-xs font-semibold border-b border-amber-500/60 pb-0.5 text-white"
          />
          <button
            onClick={e => { e.stopPropagation(); guardarEditCategoria(); }}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Check size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditCategoria(null); }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <span
            className="text-[12px] font-semibold capitalize leading-none"
            style={{ color: isActive ? color.purple : text.secondary }}
          >
            {cat.nombre}
          </span>
          <span
            className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md leading-none"
            style={{
              background: isActive ? alpha(color.purple, 0.15) : 'rgba(255,255,255,0.06)',
              color: isActive ? color.purple : text.muted,
            }}
          >
            {count}
          </span>

          {/* Hover action buttons */}
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); setEditCategoria({ id: cat.id, nombre: cat.nombre, nombreOriginal: cat.nombre }); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-zinc-600 hover:text-zinc-300"
              title="Renombrar"
            >
              <Pencil size={10} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); eliminarCategoria(cat); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
              title="Eliminar"
            >
              <X size={10} />
            </button>
          )}
        </>
      )}
    </motion.div>
  );
});

const ProductRow = memo(({ prod, onEdit, onDelete, canEdit }) => {
  const st = stockStatus(prod.stock ?? 0);

  return (
    <motion.tr
      variants={rowAnim}
      className="group border-b transition-colors duration-150"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Producto */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: alpha(color.purple, 0.08), border: `1px solid ${alpha(color.purple, 0.14)}` }}
          >
            <Utensils size={13} style={{ color: alpha(color.purple, 0.7) }} />
          </div>
          <span className="text-[14px] font-semibold leading-none" style={{ color: text.primary }}>
            {prod.nombre}
          </span>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-5 py-3.5">
        <span
          className="inline-flex items-center text-[11px] font-semibold capitalize px-2.5 py-1 rounded-md"
          style={{ background: alpha(color.indigo, 0.09), color: '#818CF8', border: `1px solid ${alpha(color.indigo, 0.16)}` }}
        >
          {prod.categoria}
        </span>
      </td>

      {/* Precio */}
      <td className="px-5 py-3.5">
        <span className="text-[14px] font-black tabular-nums" style={{ color: color.amber }}>
          ${Number(prod.precio).toFixed(2)}
        </span>
      </td>

      {/* Stock */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
            style={{ background: st.bg, color: st.fg, borderColor: st.bd }}
          >
            {st.label}
          </span>
          <span className="text-[14px] font-semibold tabular-nums" style={{ color: text.secondary }}>
            {prod.stock ?? 0}
          </span>
        </div>
      </td>

      {/* Acciones */}
      <td className="px-5 py-3.5">
        {canEdit && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => onEdit(prod)}
              className="p-1.5 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: text.secondary }}
              onMouseEnter={e => { e.currentTarget.style.background = alpha(color.purple, 0.12); e.currentTarget.style.color = color.purple; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = text.secondary; }}
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(prod)}
              className="p-1.5 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: text.secondary }}
              onMouseEnter={e => { e.currentTarget.style.background = alpha(color.red, 0.10); e.currentTarget.style.color = color.red; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = text.secondary; }}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </td>
    </motion.tr>
  );
});

// ─── Input / Select shared styles ─────────────────────────────────────────────
const fieldStyle = {
  background: surface.input,
  border: `1px solid ${border.base}`,
  borderRadius: radius.sm,
  color: text.primary,
  fontSize: '13px',
  height: '40px',
  padding: '0 12px',
  outline: 'none',
  width: '100%',
  transition: 'border-color 150ms ease',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MenuPage = ({
  categorias,
  productos,
  productosLoading,
  nuevaCategoria,
  setNuevaCategoria,
  editCategoria,
  setEditCategoria,
  newProduct,
  setNewProduct,
  editProduct,
  setEditProduct,
  activeMenuCategory,
  setActiveMenuCategory,
  agregarCategoria,
  guardarEditCategoria,
  eliminarCategoria,
  saveProducto,
  updateProductoSave,
  deleteProducto,
  canEditMenu,
  isAdmin,
}) => {
  const [tableSearch, setTableSearch] = useState('');

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    let list = activeMenuCategory
      ? productos.filter(p => p.categoria === activeMenuCategory)
      : productos;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(p => p.nombre.toLowerCase().includes(q));
    }
    return list;
  }, [productos, activeMenuCategory, tableSearch]);

  // Stats
  const stats = useMemo(() => ({
    total:      productos.length,
    cats:       categorias.length,
    disponible: productos.filter(p => (p.stock ?? 0) > 5).length,
    agotado:    productos.filter(p => (p.stock ?? 0) === 0).length,
  }), [productos, categorias]);

  const handleFocus  = useCallback(e => { e.target.style.borderColor = alpha(color.purple, 0.55); }, []);
  const handleBlur   = useCallback(e => { e.target.style.borderColor = border.base; }, []);

  const isFormValid  = editProduct
    ? editProduct.nombre && editProduct.precio
    : newProduct.nombre && newProduct.precio;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="menu-page"
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5" style={{ color: text.muted, fontSize: '13px' }}>
          <span>Configuración</span>
          <ChevronRight size={13} />
          <span style={{ color: text.secondary, fontWeight: 600 }}>Menú</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tight leading-none" style={{ color: text.primary }}>
              Carta del{' '}
              <span style={{ color: color.purple }}>Menú</span>
            </h2>
            <p className="mt-1.5 text-[15px]" style={{ color: text.muted }}>
              Administra categorías y productos que aparecen en tus pedidos
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill icon={Package}     label="Productos"   value={stats.total}      accent={color.purple} />
            <StatPill icon={Layers}      label="Categorías"  value={stats.cats}       accent={color.blue}   />
            <StatPill icon={TrendingUp}  label="Disponibles" value={stats.disponible} accent={color.green}  />
            {stats.agotado > 0 && (
              <StatPill icon={AlertCircle} label="Agotados" value={stats.agotado} accent={color.red} />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Categories Panel ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl overflow-hidden"
        style={{ background: surface.card, border: `1px solid ${border.base}` }}
      >
        {/* Panel header */}
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: alpha(color.blue, 0.10), border: `1px solid ${alpha(color.blue, 0.18)}` }}
          >
            <Tag size={12} style={{ color: color.blue }} />
          </div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: text.muted }}>
            Categorías del menú
          </h3>
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: alpha(color.blue, 0.10), color: color.blue, border: `1px solid ${alpha(color.blue, 0.18)}` }}
          >
            {categorias.length}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Chips */}
          <motion.div layout className="flex flex-wrap gap-2" style={{ minHeight: '36px' }}>
            <AnimatePresence mode="popLayout">
              {categorias.length === 0 ? (
                <motion.span
                  key="no-cats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[12px] italic"
                  style={{ color: text.muted, alignSelf: 'center' }}
                >
                  Sin categorías aún — crea la primera abajo
                </motion.span>
              ) : (
                categorias.map(cat => (
                  <CategoryChip
                    key={cat.id}
                    cat={cat}
                    count={productos.filter(p => p.categoria === cat.nombre).length}
                    isActive={activeMenuCategory === cat.nombre}
                    canEdit={canEditMenu}
                    isAdmin={isAdmin}
                    editCategoria={editCategoria}
                    setEditCategoria={setEditCategoria}
                    guardarEditCategoria={guardarEditCategoria}
                    eliminarCategoria={eliminarCategoria}
                    onClick={() => setActiveMenuCategory(cat.nombre)}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {/* Add category input */}
          {canEditMenu && (
            <div className="flex gap-2 pt-1" style={{ width: '100%', overflow: 'hidden' }}>
              <div className="relative flex-1" style={{ minWidth: 0 }}>
                <Plus
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: text.muted }}
                />
                <input
                  type="text"
                  value={nuevaCategoria}
                  onChange={e => setNuevaCategoria(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarCategoria()}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Nueva categoría  (Ej: postres, bebidas…)"
                  maxLength={30}
                  style={{ ...fieldStyle, paddingLeft: '32px' }}
                />
              </div>
              <button
                onClick={agregarCategoria}
                disabled={!nuevaCategoria.trim()}
                className="flex items-center gap-1.5 px-6 rounded-lg text-[15px] font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: color.purpleDark, color: '#fff', height: '44px', whiteSpace: 'nowrap', flexShrink: 0 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = color.purpleDeep; }}
                onMouseLeave={e => { e.currentTarget.style.background = color.purpleDark; }}
              >
                <Plus size={17} /> Agregar
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Product Form ── */}
      <motion.div
        variants={fadeUp}
        layout
        className="rounded-2xl overflow-hidden"
        style={{ background: surface.card, border: `1px solid ${border.base}` }}
      >
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: alpha(color.purple, 0.10), border: `1px solid ${alpha(color.purple, 0.18)}` }}
          >
            {editProduct ? <Pencil size={12} style={{ color: color.purple }} /> : <Plus size={12} style={{ color: color.purple }} />}
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: text.muted }}>
            {editProduct ? 'Editar producto' : 'Agregar producto al menú'}
          </h3>
          {editProduct && (
            <span
              className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: alpha(color.amber, 0.10), color: color.amber, border: `1px solid ${alpha(color.amber, 0.18)}` }}
            >
              Editando: {editProduct.nombre}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Nombre */}
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: text.muted }}>
                Nombre del producto
              </label>
              <input
                type="text"
                value={editProduct ? editProduct.nombre : newProduct.nombre}
                onChange={e => editProduct
                  ? setEditProduct({ ...editProduct, nombre: e.target.value })
                  : setNewProduct({ ...newProduct, nombre: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Ej. Lomo Saltado"
                style={fieldStyle}
              />
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: text.muted }}>
                Categoría
              </label>
              <select
                value={editProduct ? editProduct.categoria : newProduct.categoria}
                onChange={e => editProduct
                  ? setEditProduct({ ...editProduct, categoria: e.target.value })
                  : setNewProduct({ ...newProduct, categoria: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                {categorias.map(c => (
                  <option key={c.id} value={c.nombre} className="capitalize bg-zinc-900">
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: text.muted }}>
                Precio
              </label>
              <input
                type="number"
                value={editProduct ? editProduct.precio : newProduct.precio}
                onChange={e => editProduct
                  ? setEditProduct({ ...editProduct, precio: e.target.value })
                  : setNewProduct({ ...newProduct, precio: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 mt-4">
            {editProduct ? (
              <>
                <button
                  onClick={() => setEditProduct(null)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-95 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', color: text.secondary, border: `1px solid ${border.base}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = text.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = text.secondary; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProductoSave}
                  disabled={!isFormValid}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: color.purpleDark, color: '#fff' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = color.purpleDeep; }}
                  onMouseLeave={e => { e.currentTarget.style.background = color.purpleDark; }}
                >
                  <Check size={14} /> Guardar cambios
                </button>
              </>
            ) : (
              <button
                onClick={saveProducto}
                disabled={!isFormValid || categorias.length === 0}
                className="flex items-center gap-1.5 px-6 rounded-lg text-[15px] font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: color.purpleDark, color: '#fff', height: '44px', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = color.purpleDeep; }}
                onMouseLeave={e => { e.currentTarget.style.background = color.purpleDark; }}
              >
                <Plus size={17} /> Agregar producto
              </button>
            )}
            {categorias.length === 0 && !editProduct && (
              <span className="text-[12px]" style={{ color: text.muted }}>
                Crea una categoría primero
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Products Table ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl overflow-hidden"
        style={{ background: surface.card, border: `1px solid ${border.base}` }}
      >
        {/* Table header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
        >
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: alpha(color.green, 0.10), border: `1px solid ${alpha(color.green, 0.18)}` }}
              >
                <Grid3X3 size={12} style={{ color: color.green }} />
              </div>
              <h3 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: text.muted }}>
                Productos
              </h3>
            </div>

            {/* Category filter tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setActiveMenuCategory(null)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer"
                style={{
                  background: activeMenuCategory === null ? alpha(color.purple, 0.12) : 'rgba(255,255,255,0.04)',
                  color: activeMenuCategory === null ? color.purple : text.muted,
                  border: `1px solid ${activeMenuCategory === null ? alpha(color.purple, 0.30) : 'transparent'}`,
                }}
              >
                Todos
                <span className="ml-1 opacity-70">{productos.length}</span>
              </button>
              {categorias.map(cat => {
                const count = productos.filter(p => p.categoria === cat.nombre).length;
                const active = activeMenuCategory === cat.nombre;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveMenuCategory(cat.nombre)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all duration-150 cursor-pointer"
                    style={{
                      background: active ? alpha(color.purple, 0.12) : 'rgba(255,255,255,0.04)',
                      color: active ? color.purple : text.muted,
                      border: `1px solid ${active ? alpha(color.purple, 0.30) : 'transparent'}`,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = text.secondary; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = text.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                  >
                    {cat.nombre}
                    <span className="ml-1 opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: text.muted }} />
            <input
              type="text"
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Buscar producto…"
              style={{
                ...fieldStyle,
                height: '34px',
                paddingLeft: '30px',
                width: '180px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Table */}
        {productosLoading ? (
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.04)', opacity: 1 - i * 0.15 }}
              >
                <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="flex-1 h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', maxWidth: '180px' }} />
                <div className="w-16 h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="w-12 h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="w-20 h-5 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                  {['Producto', 'Categoría', 'Precio', 'Stock', canEditMenu ? 'Acciones' : ''].filter(Boolean).map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[14px] font-black uppercase tracking-widest"
                      style={{ color: text.muted, background: 'rgba(255,255,255,0.02)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(p => (
                    <ProductRow
                      key={p.id}
                      prod={p}
                      onEdit={setEditProduct}
                      onDelete={deleteProducto}
                      canEdit={canEditMenu}
                    />
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: alpha(color.purple, 0.08), border: `1px solid ${alpha(color.purple, 0.15)}` }}
                >
                  <ShoppingBag size={20} style={{ color: alpha(color.purple, 0.5) }} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold" style={{ color: text.secondary }}>
                    {tableSearch ? 'Sin resultados para esa búsqueda' : activeMenuCategory ? `Sin productos en "${activeMenuCategory}"` : 'Aún no hay productos'}
                  </p>
                  <p className="text-[14px] mt-1" style={{ color: text.muted }}>
                    {tableSearch ? 'Prueba otro término' : 'Agrega el primer producto usando el formulario de arriba'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Table footer */}
        {filteredProducts.length > 0 && (
          <div
            className="px-5 py-2.5 flex items-center justify-between"
            style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}
          >
            <span className="text-[14px]" style={{ color: text.muted }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              {activeMenuCategory && <> en <strong style={{ color: text.secondary }}>{activeMenuCategory}</strong></>}
            </span>
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="flex items-center gap-1 text-[14px] cursor-pointer transition-colors"
                style={{ color: text.muted }}
                onMouseEnter={e => { e.currentTarget.style.color = text.secondary; }}
                onMouseLeave={e => { e.currentTarget.style.color = text.muted; }}
              >
                <X size={10} /> Limpiar filtro
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default memo(MenuPage);
