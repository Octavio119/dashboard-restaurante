import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../AuthContext';
import { api } from '../../api';

// Componente auxiliar que expone el contexto
function AuthDisplay() {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user)   return <div>Sin sesión</div>;
  return <div>Usuario: {user.nombre}</div>;
}

describe('AuthContext — estado inicial', () => {
  it('muestra "Sin sesión" cuando no hay token', async () => {
    api.me.mockRejectedValue(new Error('no token'));

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sin sesión')).toBeInTheDocument();
    });
  });

  it('restaura sesión si hay token válido en localStorage', async () => {
    localStorage.setItem('token', 'valid-token');
    api.me.mockResolvedValue({ nombre: 'Ana', rol: 'admin', restaurante_id: 1 });

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Usuario: Ana')).toBeInTheDocument();
    });
  });

  it('hace logout si api.me falla y no hay refresh_token', async () => {
    localStorage.setItem('token', 'expired');
    api.me.mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sin sesión')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('useAuth — login', () => {
  function LoginButton() {
    const { login, user } = useAuth();
    return (
      <>
        <button onClick={() => login('test@t.com', 'pw')}>Login</button>
        {user && <span>Bienvenido {user.nombre}</span>}
      </>
    );
  }

  beforeEach(() => {
    // sin token inicial: me() falla → sesión limpia
    api.me.mockRejectedValue(new Error('no token'));
  });

  it('guarda token en localStorage y actualiza estado tras login exitoso', async () => {
    api.login.mockResolvedValueOnce({
      token: 'token-abc',
      refresh_token: 'refresh-abc',
      user: { nombre: 'Carlos', rol: 'admin', restaurante_id: 1 },
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );

    // Esperar que termine la carga inicial
    await waitFor(() => screen.getByText('Login'));

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Bienvenido Carlos')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBe('token-abc');
  });

  it('no actualiza usuario si api.login falla', async () => {
    api.login.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    function LoginWithError() {
      const { login, user } = useAuth();
      const [err, setErr] = React.useState(null);
      return (
        <>
          <button onClick={() => login('x@x.com', 'pw').catch(e => setErr(e.message))}>Login</button>
          {user && <span>Sesión activa</span>}
          {err && <span>Error: {err}</span>}
        </>
      );
    }

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginWithError />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Login'));
    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Error: Credenciales inválidas')).toBeInTheDocument();
    });
    expect(screen.queryByText('Sesión activa')).toBeNull();
  });
});

describe('useAuth — logout', () => {
  function LogoutButton() {
    const { logout, user } = useAuth();
    return (
      <>
        {user ? <span>Sesión activa</span> : <span>Sesión cerrada</span>}
        <button onClick={() => logout()}>Logout</button>
      </>
    );
  }

  it('limpia localStorage al hacer logout', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify({ nombre: 'Bob' }));
    api.me.mockResolvedValue({ nombre: 'Bob', rol: 'staff', restaurante_id: 1 });
    api.logout.mockResolvedValue({ ok: true });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Sesión activa'));

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByText('Sesión cerrada')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
