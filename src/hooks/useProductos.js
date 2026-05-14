import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

export const useProductos = ({ user }) => {
  const queryClient = useQueryClient();

  const [productos,   setProductos]   = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [categorias,  setCategorias]  = useState([]);
  const [activeMenuCategory, setActiveMenuCategory] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editCategoria,  setEditCategoria]  = useState(null);
  const [newProduct,  setNewProduct]  = useState({ nombre:'', categoria:'', precio:'', stock:'' });
  const [editProduct, setEditProduct] = useState(null);
  const [usuarios,    setUsuarios]    = useState([]);
  const [newUser, setNewUser] = useState({ nombre:'', email:'', password:'', rol:'staff' });
  const [userFormOpen, setUserFormOpen] = useState(false);

  const productosQ = useQuery({
    queryKey: qk.productos(),
    queryFn:  () => api.getProductos(),
    enabled:  !!user,
    staleTime: 15 * 60_000,
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

  const loadProductos  = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.productos() }), [queryClient]);
  const loadCategorias = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.categorias() }), [queryClient]);
  const loadUsuarios   = useCallback(() => queryClient.invalidateQueries({ queryKey: qk.usuarios() }), [queryClient]);

  // ── Categorías ────────────────────────────────────────────────────────────────
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

  const eliminarCategoria = (cat, setConfirmDialog) => {
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

  // ── Productos ─────────────────────────────────────────────────────────────────
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

  const deleteProducto = (prod, setConfirmDialog) => {
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

  // ── Usuarios ──────────────────────────────────────────────────────────────────
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

  return {
    productos, setProductos, productosLoading,
    categorias, setCategorias,
    activeMenuCategory, setActiveMenuCategory,
    nuevaCategoria, setNuevaCategoria,
    editCategoria, setEditCategoria,
    newProduct, setNewProduct,
    editProduct, setEditProduct,
    usuarios, setUsuarios,
    newUser, setNewUser,
    userFormOpen, setUserFormOpen,
    loadProductos, loadCategorias, loadUsuarios,
    agregarCategoria, guardarEditCategoria, eliminarCategoria,
    saveProducto, updateProductoSave, changeStock, deleteProducto,
    createUsuario, toggleUsuarioActivo,
  };
};
