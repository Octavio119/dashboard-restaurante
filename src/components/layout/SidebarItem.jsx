import { cn } from "@/lib/utils"

export default function SidebarItem({ icon: Icon, label, active, onClick, badge, collapsed, planBadge }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg text-left",
        "transition-all duration-[150ms] ease-in-out",
        collapsed ? "justify-center p-3" : "gap-2.5 px-3 py-3",
        active
          ? "bg-[#7C3AED]/[0.16] text-[#F8F8FF]"
          : "text-[#6B6B88] hover:bg-white/[0.03] hover:text-[#A0A0BC]"
      )}
    >
      {/* Left accent bar — only when expanded */}
      {!collapsed && (
        <span
          className="absolute left-0 h-5 w-[3px] rounded-r transition-all duration-200"
          style={{ background: "#A78BFA", opacity: active ? 1 : 0 }}
        />
      )}

      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.8}
        className="shrink-0 transition-colors duration-150"
        style={{ color: active ? "#C4B5FD" : "inherit" }}
      />

      {!collapsed && (
        <span
          className="flex-1 truncate text-[15px] transition-all duration-150"
          style={{ fontWeight: active ? 600 : 500 }}
        >
          {label}
        </span>
      )}

      {/* Badge expanded */}
      {!collapsed && badge > 0 && (
        <span
          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ background: "rgba(139,92,246,0.14)", color: "#A78BFA" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {/* Badge dot collapsed */}
      {collapsed && badge > 0 && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}

      {/* Plan badge (PRO / BUSINESS) — shown when feature requires upgrade */}
      {!collapsed && planBadge && (
        <span
          className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
          style={{
            background: planBadge === 'BUSINESS' ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)',
            color:      planBadge === 'BUSINESS' ? '#10B981' : '#A78BFA',
            border:     planBadge === 'BUSINESS' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(139,92,246,0.2)',
          }}
        >
          {planBadge}
        </span>
      )}

      {/* Active dot expanded */}
      {!collapsed && active && !planBadge && (
        <span className="h-1 w-1 shrink-0 rounded-full opacity-60" style={{ background: "#A78BFA" }} />
      )}
    </button>
  )
}
