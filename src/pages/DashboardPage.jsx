import { useMemo, useState, useEffect, useRef } from "react"
import { motion, animate } from "framer-motion"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "../lib/i18nFormatters"
import {
  Download, Plus, DollarSign, ShoppingBag,
  Calendar, Activity, ArrowRight, ChefHat,
  Flame, Clock, CheckCircle2,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, CartesianGrid,
  XAxis, YAxis, Tooltip, Area,
} from "recharts"
import AIInsightsWidget from "../features/dashboard/components/AIInsightsWidget"
import MetricCard from "../components/ui/MetricCard"
import StatusBadge from "../components/ui/StatusBadge"
import { MagicCard } from "../components/ui/magic-card"
import { ShineBorder } from "../components/ui/shine-border"
import { AnimatedBeam } from "../components/ui/animated-beam"
import {
  DEMO_PEDIDOS,
  DEMO_VENTAS_RESUMEN,
  DEMO_RESERVAS,
  DEMO_SALES_DATA,
} from "../lib/demoData"

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.04]", className)} />
}

function AnimatedNumber({ value }) {
  const { i18n } = useTranslation()
  const numLocale = i18n.language?.startsWith("en") ? "en-US" : "es-CL"
  const ref = useRef(null)
  useEffect(() => {
    const str    = String(value)
    const prefix = (str.match(/^[^0-9]*/) || [""])[0]
    const num    = parseInt(str.replace(/[^0-9]/g, ""), 10)
    if (!ref.current || isNaN(num) || num === 0) { if (ref.current) ref.current.textContent = value; return }
    const ctrl = animate(Math.max(0, Math.round(num * 0.55)), num, {
      duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(v) { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString(numLocale) },
    })
    return ctrl.stop
  }, [value, numLocale])
  return <span ref={ref}>{value}</span>
}

// ─── Kitchen card ───────────────────────────────────────────────────────────────
function KitchenCard({ order, index }) {
  const { t } = useTranslation("dashboard")
  const KITCHEN_STATUS = {
    pendiente:      { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  icon: Clock,  label: t("kitchen_status.waiting") },
    en_preparacion: { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  icon: Flame,  label: t("kitchen_status.in_kitchen") },
  }
  const cfg = KITCHEN_STATUS[order.estado] || KITCHEN_STATUS.pendiente
  const StatusIcon = cfg.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.22, ease: "easeOut" }}
      className="flex-shrink-0 w-[168px] rounded-[10px] border p-3.5 flex flex-col gap-2.5"
      style={{ background: cfg.bg, borderColor: `${cfg.color}25` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[13px] font-bold" style={{ color: cfg.color }}>
          {order.mesa ? `Mesa ${order.mesa}` : order.cliente_nombre?.split("·")[0]?.trim()}
        </span>
        <span className="flex items-center gap-1 rounded-md px-1.5 py-[2px] text-[10px] font-semibold"
          style={{ background: `${cfg.color}18`, color: cfg.color }}>
          <StatusIcon size={9} strokeWidth={2.5} />
          {cfg.label}
        </span>
      </div>
      <p className="text-[11px] leading-snug line-clamp-2" style={{ color: "var(--text-2)" }}>
        {order.item || "—"}
      </p>
      <p className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
        {order.total ? `$${(order.total || 0).toLocaleString()}` : "—"}
      </p>
    </motion.div>
  )
}

// ─── Metric skeleton ────────────────────────────────────────────────────────────
function MetricSkeleton() {
  return (
    <div className="rounded-[12px] border border-white/[0.05] bg-[#16162A] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
    </div>
  )
}

// ─── Stagger animation ─────────────────────────────────────────────────────────
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.055 } } },
  item: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } } },
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage({
  user,
  todayReservations,
  exportCSV,
  setIsNewResModalOpen,
  ventasResumen,
  pedidos,
  salesData,
  setActiveTab,
}) {
  const { t, i18n } = useTranslation(["dashboard", "common"])
  const numLocale = i18n.language?.startsWith("en") ? "en-US" : "es-CL"

  // Detect real data vs empty state
  const hasRealData = (ventasResumen?.total || 0) > 0 || pedidos.length > 0 || salesData.length > 0

  // Brief skeleton on first mount when no real data
  const [mounted, setMounted] = useState(hasRealData)
  useEffect(() => {
    if (!mounted) {
      const t = setTimeout(() => setMounted(true), 650)
      return () => clearTimeout(t)
    }
  }, [mounted])

  const isLoading = !mounted

  // Use real data or inject demo data
  const displayPedidos   = hasRealData ? pedidos          : DEMO_PEDIDOS
  const displayVentas    = hasRealData ? ventasResumen    : DEMO_VENTAS_RESUMEN
  const displaySalesData = hasRealData ? salesData        : DEMO_SALES_DATA
  const displayReservas  = hasRealData ? todayReservations : DEMO_RESERVAS

  // Derived
  const ticketProm = displayPedidos.length
    ? formatCurrency(
        Math.round(displayPedidos.reduce((s, o) => s + (o.total || 0), 0) / displayPedidos.length),
        i18n.language
      )
    : "$0"

  const activeOrders = useMemo(
    () => displayPedidos.filter(p => ["pendiente", "en_preparacion"].includes(p.estado)),
    [displayPedidos]
  )

  // AnimatedBeam refs — KPI grid
  const kpiContainerRef = useRef(null)
  const kpiRef0 = useRef(null)
  const kpiRef1 = useRef(null)
  const kpiRef2 = useRef(null)
  const kpiRef3 = useRef(null)
  const kpiRefs = [kpiRef0, kpiRef1, kpiRef2, kpiRef3]

  const ops = useMemo(() => {
    const pending  = displayPedidos.filter(p => p.estado === "pendiente").length
    const inPrep   = displayPedidos.filter(p => p.estado === "en_preparacion").length
    const done     = displayPedidos.filter(p => ["completado", "pagado"].includes(p.estado)).length
    const rate     = displayPedidos.length > 0 ? Math.round((done / displayPedidos.length) * 100) : 0
    return { pending, inPrep, done, rate }
  }, [displayPedidos])

  const todayLabel = formatDate(new Date(), i18n.language, {
    weekday: "long", day: "numeric", month: "long",
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="flex flex-col gap-5 p-5 sm:p-7 max-w-[1440px] w-full mx-auto"
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="text-[21px] font-bold tracking-tight leading-none"
            style={{ color: "var(--text-1)" }}
          >
            {t("greeting", { ns: "dashboard" })}{" "}
            <span style={{ color: "#8B5CF6" }}>
              {user?.nombre?.split(" ")[0] || t("fallback_user", { ns: "dashboard" })}
            </span>
          </h2>

          <div
            className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
            style={{ color: "var(--text-3)" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="font-medium text-emerald-400">{t("live", { ns: "dashboard" })}</span>
            </span>

            <span className="opacity-25">·</span>
            <span className="capitalize">{todayLabel}</span>

            {displayReservas.length > 0 && (
              <>
                <span className="opacity-25">·</span>
                <span>
                  <span style={{ color: "var(--text-2)" }}>{displayReservas.length}</span>{" "}
                  {t("reservations_label", { ns: "dashboard" })}
                </span>
              </>
            )}

            {!hasRealData && (
              <>
                <span className="opacity-25">·</span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
                >
                  {t("demo_data", { ns: "dashboard" })}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-5 text-[14px] font-medium h-[40px] min-w-fit transition-[opacity,transform] duration-150 hover:opacity-85 hover:border-white/[0.12] hover:text-white active:scale-[0.97]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-2)" }}
          >
            <Download size={12} />
            {t("export", { ns: "common" })}
          </button>
          <ShineBorder color={["#A78BFA", "#7C3AED"]} borderWidth={1} className="rounded-lg">
            <button
              onClick={() => setIsNewResModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-5 text-[14px] font-medium h-[40px] min-w-fit transition-[opacity,transform] duration-150 hover:opacity-85 hover:brightness-110 active:scale-[0.97]"
              style={{ background: "#8B5CF6", color: "white" }}
            >
              <Plus size={12} />
              {t("new_reservation", { ns: "dashboard" })}
            </button>
          </ShineBorder>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div ref={kpiContainerRef} className="relative">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <motion.div key={i} variants={stagger.item}><MetricSkeleton /></motion.div>
              ))
            : [
                {
                  title: t("kpi.daily_sales", { ns: "dashboard" }),
                  value: formatCurrency(displayVentas?.total || 0, i18n.language),
                  trend: 12.5, icon: DollarSign, iconColor: "#10B981",
                  beamFrom: "#7C3AED", beamTo: "#4F46E5", beamDuration: 8, beamDelay: 0,
                },
                {
                  title: t("kpi.total_orders", { ns: "dashboard" }),
                  value: displayPedidos.length,
                  trend: 8.2, icon: ShoppingBag, iconColor: "#8B5CF6",
                  beamFrom: "#2563EB", beamTo: "#7C3AED", beamDuration: 10, beamDelay: 2,
                },
                {
                  title: t("kpi.reservations_today", { ns: "dashboard" }),
                  value: displayReservas.length,
                  trend: 4.0, icon: Calendar, iconColor: "#3B82F6",
                  beamFrom: "#16A34A", beamTo: "#2563EB", beamDuration: 12, beamDelay: 4,
                },
                {
                  title: t("kpi.avg_ticket", { ns: "dashboard" }),
                  value: ticketProm,
                  trend: 4.1, icon: Activity, iconColor: "#F59E0B",
                  beamFrom: "#D97706", beamTo: "#7C3AED", beamDuration: 9, beamDelay: 6,
                },
              ].map((card, i) => (
                <motion.div key={i} variants={stagger.item} ref={kpiRefs[i]}>
                  <MetricCard {...card} />
                </motion.div>
              ))
          }
        </motion.div>

        {/* AnimatedBeam — desktop only, connects KPIs in order */}
        {!isLoading && (
          <div className="hidden lg:block pointer-events-none" aria-hidden="true">
            <AnimatedBeam containerRef={kpiContainerRef} fromRef={kpiRef0} toRef={kpiRef1} colorFrom="#7C3AED" colorTo="#4F46E5" duration={3} />
            <AnimatedBeam containerRef={kpiContainerRef} fromRef={kpiRef1} toRef={kpiRef2} colorFrom="#7C3AED" colorTo="#4F46E5" duration={3} />
            <AnimatedBeam containerRef={kpiContainerRef} fromRef={kpiRef2} toRef={kpiRef3} colorFrom="#7C3AED" colorTo="#4F46E5" duration={3} />
          </div>
        )}
      </div>

      {/* ── AI Insights ─────────────────────────────────────────────────────── */}
      <AIInsightsWidget />

      {/* ── Kitchen Strip ───────────────────────────────────────────────────── */}
      {!isLoading && activeOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.22 }}
          className="flex flex-col gap-3"
        >
          {/* Strip header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat size={13} style={{ color: "var(--text-3)" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-3)" }}
              >
                {t("kitchen.title", { ns: "dashboard" })}
              </span>
              <span
                className="flex items-center justify-center rounded-full px-1.5 py-[1px] text-[10px] font-bold"
                style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
              >
                {t("kitchen.active_other", { ns: "dashboard", count: activeOrders.length })}
              </span>
            </div>
            <button
              onClick={() => setActiveTab("Pedidos")}
              className="flex cursor-pointer items-center gap-1 text-[11px] font-medium transition-colors duration-150 hover:text-white"
              style={{ color: "var(--text-3)" }}
            >
              {t("kitchen.view_orders", { ns: "dashboard" })}
              <ArrowRight size={10} />
            </button>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-0.5 scrollbar-none">
            {activeOrders.map((order, i) => (
              <KitchenCard key={order.id || i} order={order} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Charts + Activity ────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Area chart ── 2/3 */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <MagicCard className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
                  {t("chart.section_label", { ns: "dashboard" })}
                </p>
                <h3 className="mt-0.5 text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
                  {t("chart.title", { ns: "dashboard" })}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                <span className="inline-block h-[2px] w-4 rounded bg-violet-500/50" />
                {t("chart.legend_income", { ns: "dashboard" })}
              </div>
            </div>

            <div className="h-[200px] sm:h-[226px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displaySalesData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.035)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#50506A", fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#50506A", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1A2E",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        color: "#F0F0FF",
                        fontSize: "12px",
                        padding: "7px 12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}
                      cursor={{ stroke: "rgba(255,255,255,0.04)", strokeWidth: 1 }}
                      formatter={v => [
                        formatCurrency(Number(v), i18n.language),
                        t("chart.tooltip_sales", { ns: "dashboard" }),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#8B5CF6"
                      strokeWidth={1.5}
                      fill="url(#salesGrad)"
                      dot={false}
                      activeDot={{ r: 3.5, fill: "#8B5CF6", stroke: "#0A0A12", strokeWidth: 2 }}
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </MagicCard>
        </motion.div>

        {/* Activity feed ── 1/3 */}
        <motion.div variants={stagger.item}>
          <MagicCard className="p-5 flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
                  {t("activity.section_label", { ns: "dashboard" })}
                </p>
                <h3 className="mt-0.5 text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
                  {t("activity.title", { ns: "dashboard" })}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("Pedidos")}
                className="flex cursor-pointer items-center gap-1 text-[11px] font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "var(--text-3)" }}
              >
                {t("view_all", { ns: "common" })} <ArrowRight size={10} />
              </button>
            </div>

            <div className="flex flex-col">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-2.5">
                      <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
                      <Skeleton className="h-3 flex-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))
                : displayPedidos.slice(0, 7).map((order, i) => (
                    <motion.div
                      key={order.id || i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.18 }}
                      className="flex cursor-default items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-white/[0.025]"
                    >
                      <StatusBadge status={order.estado} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium leading-snug" style={{ color: "var(--text-1)" }}>
                          {order.cliente_nombre}
                        </p>
                        {order.item && (
                          <p className="truncate text-[11px]" style={{ color: "var(--text-3)" }}>{order.item}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums" style={{ color: "var(--text-2)" }}>
                        {formatCurrency(order.total || 0, i18n.language)}
                      </span>
                    </motion.div>
                  ))
              }

              {!isLoading && displayPedidos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--text-3)" }}>
                  <ShoppingBag size={20} className="opacity-30" />
                  <p className="text-[12px]">{t("activity.empty", { ns: "dashboard" })}</p>
                </div>
              )}
            </div>
          </MagicCard>
        </motion.div>
      </motion.div>

      {/* ── Operational Stats Strip ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.22 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: t("ops.pending",      { ns: "dashboard" }), value: ops.pending,        color: "#F59E0B", icon: Clock        },
          { label: t("ops.in_prep",      { ns: "dashboard" }), value: ops.inPrep,          color: "#3B82F6", icon: Flame        },
          { label: t("ops.completed",    { ns: "dashboard" }), value: ops.done,            color: "#10B981", icon: CheckCircle2 },
          { label: t("ops.success_rate", { ns: "dashboard" }), value: `${ops.rate}%`,      color: "#8B5CF6", icon: Activity     },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="flex cursor-default items-center gap-3 rounded-[10px] border px-4 py-3 transition-colors duration-150 hover:border-white/[0.09]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <Icon size={13} style={{ color, opacity: 0.7 }} className="shrink-0" />
            <span className="flex-1 text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
              {label}
            </span>
            <span className="text-[15px] font-bold tabular-nums" style={{ color }}>
              {isLoading ? <Skeleton className="h-4 w-8 inline-block" /> : value}
            </span>
          </div>
        ))}
      </motion.div>

    </motion.div>
  )
}
