const CONFIG = {
  pendiente:       { bg: "rgba(245,158,11,0.08)",  text: "#F59E0B", label: "Pendiente"   },
  en_preparacion:  { bg: "rgba(59,130,246,0.08)",  text: "#3B82F6", label: "En prep."    },
  "en preparación":{ bg: "rgba(59,130,246,0.08)",  text: "#3B82F6", label: "En prep."    },
  listo:           { bg: "rgba(139,92,246,0.08)",  text: "#8B5CF6", label: "Listo"       },
  completado:      { bg: "rgba(16,185,129,0.08)",  text: "#10B981", label: "Completado"  },
  pagado:          { bg: "rgba(16,185,129,0.08)",  text: "#10B981", label: "Pagado"      },
  entregado:       { bg: "rgba(16,185,129,0.08)",  text: "#10B981", label: "Entregado"   },
  confirmado:      { bg: "rgba(16,185,129,0.08)",  text: "#10B981", label: "Confirmado"  },
  confirmada:      { bg: "rgba(16,185,129,0.08)",  text: "#10B981", label: "Confirmada"  },
  cancelado:       { bg: "rgba(239,68,68,0.08)",   text: "#EF4444", label: "Cancelado"   },
  cancelada:       { bg: "rgba(239,68,68,0.08)",   text: "#EF4444", label: "Cancelada"   },
  "asistió":       { bg: "rgba(99,102,241,0.08)",  text: "#6366F1", label: "Asistió"     },
  no_asistio:      { bg: "rgba(239,68,68,0.08)",   text: "#EF4444", label: "No asistió"  },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { bg: "rgba(144,144,176,0.1)", text: "#9090B0", label: status }

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md px-2 py-[3px] text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}
