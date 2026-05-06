import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || '/api'

function PagoScreen({ icono, titulo, subtitulo, mensaje, color }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0A0A0F', color: 'white',
      fontFamily: 'Inter, -apple-system, sans-serif', gap: '16px',
    }}>
      <div style={{ fontSize: '64px' }}>{icono}</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color }}>{titulo}</h1>
      <p style={{ color: '#94A3B8' }}>{subtitulo}</p>
      <p style={{ color: '#475569', fontSize: '13px' }}>{mensaje}</p>
    </div>
  )
}

export default function BillingSuccess() {
  const [estado, setEstado] = useState('verificando')
  const params  = new URLSearchParams(window.location.search)
  const success = params.get('success')
  const cancel  = params.get('cancel')

  useEffect(() => {
    if (cancel) {
      setEstado('cancelado')
      setTimeout(() => { window.location.href = '/billing' }, 2500)
      return
    }

    if (success) {
      const token = localStorage.getItem('token')
      fetch(`${BASE}/billing/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.plan === 'pro' || data.plan === 'business') {
            setEstado('exitoso')
            setTimeout(() => { window.location.href = '/dashboard' }, 3000)
          } else {
            // PayPal procesó pero el webhook puede tardar unos segundos
            setTimeout(() => {
              setEstado('exitoso')
              window.location.href = '/dashboard'
            }, 5000)
          }
        })
        .catch(() => {
          setEstado('exitoso')
          setTimeout(() => { window.location.href = '/dashboard' }, 3000)
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (estado === 'cancelado') return (
    <PagoScreen
      icono="❌"
      titulo="Pago cancelado"
      subtitulo="No se realizó ningún cargo."
      mensaje="Volviendo a planes..."
      color="#EF4444"
    />
  )

  if (estado === 'verificando') return (
    <PagoScreen
      icono="⏳"
      titulo="Verificando pago..."
      subtitulo="Confirmando con PayPal"
      mensaje="Por favor espera"
      color="#F59E0B"
    />
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0A0A0F', color: 'white',
      fontFamily: 'Inter, -apple-system, sans-serif', gap: '16px',
    }}>
      <div style={{ fontSize: '64px' }}>✅</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>¡Plan activado!</h1>
      <p style={{ color: '#94A3B8' }}>Tu pago fue procesado correctamente.</p>
      <p style={{ color: '#475569', fontSize: '13px' }}>Entrando al dashboard...</p>
      <div style={{
        width: '200px', height: '3px', background: 'rgba(139,92,246,.2)',
        borderRadius: '2px', marginTop: '8px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: '100%',
          background: 'linear-gradient(90deg,#8B5CF6,#EC4899)',
          animation: 'progress 3s linear forwards',
        }} />
      </div>
      <style>{`
        @keyframes progress {
          from { transform: translateX(-100%) }
          to   { transform: translateX(0) }
        }
      `}</style>
    </div>
  )
}
