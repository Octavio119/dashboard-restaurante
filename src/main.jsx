import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { AuthProvider } from './AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.jsx'
import './index.css'
import './styles/dashboard-theme.css'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           30_000,   // 30 s global default
      gcTime:              5 * 60_000, // 5 min
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (err?.message === 'Sesión expirada') return false;
        return count < 1;
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </PayPalScriptProvider>
  </React.StrictMode>,
)
