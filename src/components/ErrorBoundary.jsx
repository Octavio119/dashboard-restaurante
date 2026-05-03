import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#071525',
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>¡Ups! Algo salió mal.</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
            La aplicación ha encontrado un error inesperado.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              background: '#0066CC',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Volver al inicio
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '20px',
              padding: '10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: '100%',
              overflow: 'auto',
              color: '#ff4444'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
