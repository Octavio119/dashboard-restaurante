import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSocket } from '../socket/client';

export const useWebSocket = ({ user, addToast }) => {
  const socketRef    = useRef(null);
  const queryClient  = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const token  = localStorage.getItem('token');
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('pedido:creado', data => {
      addToast(
        `${data.numero} · ${data.cliente_nombre}${data.mesa ? ` · Mesa ${data.mesa}` : ''}`,
        'info',
        { icon: '🛎️', title: 'Nuevo pedido' }
      );
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
      addToast(
        `Venta $${data.total?.toFixed(0)} · ${data.metodo_pago}`,
        'success',
        { icon: '💵', title: 'Venta registrada' }
      );
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    });

    socket.on('stock:alerta', data => {
      addToast(
        `${data.nombre}: ${data.stock} uds restantes (mín: ${data.minimo})`,
        'warning',
        { icon: '⚠️', title: 'Stock bajo' }
      );
    });

    socket.on('connect_error', (err) => {
      if (err.message === 'AUTH_MISSING' || err.message === 'AUTH_INVALID') {
        socket.io.opts.reconnection = false;
        socket.disconnect();
        window.dispatchEvent(new Event('auth:logout'));
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user, addToast, queryClient]);

  return socketRef;
};
