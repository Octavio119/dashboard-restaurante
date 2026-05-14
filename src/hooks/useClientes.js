import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

export const useClientes = ({ user }) => {
  const queryClient = useQueryClient();

  const [clientes, setClientes]       = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [clienteForm, setClienteForm] = useState(null);
  const [clienteFormOpen, setClienteFormOpen] = useState(false);
  const [adminModal, setAdminModal]   = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const clientesQ = useQuery({
    queryKey: qk.clientes(''),
    queryFn:  () => api.getClientes(''),
    enabled:  !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (clientesQ.data) setClientes(clientesQ.data);
  }, [clientesQ.data]);

  const loadClientes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.clientes('') });
  }, [queryClient]);

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

  const deleteCliente = (cliente, isAdmin) => {
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

  return {
    clientes, setClientes,
    selectedCustomer, setSelectedCustomer,
    clienteForm, setClienteForm,
    clienteFormOpen, setClienteFormOpen,
    adminModal, setAdminModal,
    confirmDialog, setConfirmDialog,
    loadClientes,
    saveCliente, deleteCliente,
  };
};
