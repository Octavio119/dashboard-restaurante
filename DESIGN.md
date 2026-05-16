# Design System — MastexoPOS

## Product Context
- **What this is:** SaaS dashboard for restaurant management (orders, sales, reservations, inventory, analytics)
- **Who it's for:** Restaurant owners and staff in Chile/LatAm — often used on tablets and counter-mounted displays
- **Space/industry:** Restaurant POS / SaaS
- **Project type:** Web app / dashboard

## Memorable Thing
> "Fast and professional — polished software that rivals Stripe-level UI quality."

Every design decision serves this. Elegance through precision, not decoration.

---

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian Elevated
- **Decoration level:** Minimal — typography, borders, and shadow layers do all the work
- **Mood:** Data-dense, crisp, 60fps on every device. Like opening Linear or Vercel: nothing surprises you, everything works. No frosted glass, no gradients, no decorative effects. Depth comes from border contrast and precise shadow stacking.

---

## Color System
- **Approach:** Restrained — 2 accent colors + semantic palette on neutral dark base
- **Base background:** `#0A0A12` (near-black with cool blue undertone)
- **Surface L1:** `#111118` (cards, sidebars)
- **Surface L2:** `#1A1A24` (modals, popovers, dropdowns)
- **Border:** `rgba(255,255,255,0.08)` (standard) / `rgba(255,255,255,0.12)` (hover/active)
- **Primary accent:** `#8B5CF6` (violet — primary actions, active states)
- **Success accent:** `#10B981` (emerald — live indicators, confirmed states)
- **Warning accent:** `#F59E0B` (amber — warnings, destructive action spinners)
- **Error:** `#EF4444` (red — errors, delete actions)
- **Text primary:** `#F1F5F9`
- **Text muted:** `#8892A4`
- **Dark mode:** This IS dark mode. No light mode planned.

---

## Typography
- **Display/Hero:** Current heading stack — keep as-is (font-black, tracking-tight)
- **Body:** System stack — `ui-sans-serif, system-ui, -apple-system` (fast loading, no CDN dep)
- **Data/Tables:** `font-variant-numeric: tabular-nums` on all number cells
- **Code/Tickets:** `Courier New, monospace` (receipt formatting, PDF tickets)
- **Scale:** `text-xs(12)`, `text-sm(14)`, `text-base(16)`, `text-lg(18)`, `text-2xl(24)`, `text-3xl(30)`

---

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (restaurant staff use touch targets — min 44px tap targets)
- **Scale:** `2(8px)`, `3(12px)`, `4(16px)`, `5(20px)`, `6(24px)`, `8(32px)`, `10(40px)`, `12(48px)`

---

## Backdrop-Filter / GPU Rendering Rules

**RULE: No backdrop-filter on modal overlays. Ever.**

On a dark background, the blur effect behind an overlay is invisible — the overlay darkens the content below, making the blur irrelevant. The GPU cost remains. The visual benefit does not.

| Element | Allowed | Reason |
|---|---|---|
| Sticky header | No (removed) | Always rendered, kills scroll fps on mobile |
| Modal overlays | No | Content behind is dark; blur is invisible |
| Toast notifications | No | Dark card on dark bg; blur undetectable |
| POS order modal | No | Most expensive moment in the UX (peak usage) |
| Landing page nav | Yes (desktop only) | Light background content, blur is visible |

**Alternative pattern:**
```css
/* Instead of: bg-black/70 backdrop-blur-sm */
/* Use: */
background: rgba(0, 0, 0, 0.85);

/* Instead of: backdrop-filter: blur(16px) on header */
/* Use: */
background: #0A0A12;
border-bottom: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
```

**Low-perf device detection:**
```js
// In App.jsx root — add once at mount
if (navigator.hardwareConcurrency <= 4 || /Android/.test(navigator.userAgent)) {
  document.documentElement.classList.add('no-blur');
}
```

```css
/* In dashboard-theme.css */
.no-blur * {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

---

## Print System

**RULE: Never use `window.open()` for printing.**

`window.open()` triggers popup blockers on POS tablets and kiosk browsers. It causes a visible tab flash. It requires `window.close()` which can fail.

**Use `silentPrint()` instead** — a hidden iframe that mounts, prints, and self-destructs:

```js
// src/lib/silentPrint.js
export function silentPrint(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };
}
```

---

## Loader / Spinner System

**RULE: One `<Spinner>` component. No ad-hoc `animate-spin` divs.**

| Size | Dimension | Use case |
|---|---|---|
| `sm` | `w-3.5 h-3.5` | Inline button loading states |
| `md` | `w-5 h-5` | Card/section loading |
| `lg` | `w-8 h-8` | Full-page loading |

| Color | Token | Use case |
|---|---|---|
| `violet` | `#8B5CF6` | Primary actions (default) |
| `amber` | `#F59E0B` | Destructive / warning states |
| `white` | `#FFFFFF` | On colored backgrounds |

---

## Motion
- **Approach:** Minimal-functional — transitions aid comprehension, never decorate
- **Standard spring:** `duration: 0.2, ease: [0.16, 1, 0.3, 1]`
- **Page entrance:** `{ opacity: 0, y: 8 }` → `{ opacity: 1, y: 0 }` — normalized across all pages (no y: 16, no y: 6)
- **Modal entrance:** `{ opacity: 0, scale: 0.97 }` → `{ opacity: 1, scale: 1 }` with the same spring
- **Max stagger delay:** 0.07s per item (already correct in DashboardPage)
- **Accessibility:** Always wrap with `@media (prefers-reduced-motion: reduce)` — set `duration: 0, delay: 0`

---

## Layout
- **Approach:** Grid-disciplined — strict columns, predictable alignment
- **Max content width:** 1400px
- **Sidebar:** 256px (desktop), slide-over (mobile)
- **Header height:** 60px
- **Border radius:** `sm: 6px`, `md: 10px`, `lg: 16px`, `full: 9999px`

---

## Shadow Layers (replace blur with these for depth)
```css
--shadow-xs:  0 1px 2px rgba(0,0,0,0.4);
--shadow-sm:  0 2px 8px rgba(0,0,0,0.5);
--shadow-md:  0 4px 16px rgba(0,0,0,0.6);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.7);
--shadow-xl:  0 16px 48px rgba(0,0,0,0.8);
```

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-09 | Remove all backdrop-filter from dashboard modals/header | GPU cost on mobile without visual benefit on dark surfaces |
| 2026-05-09 | Replace window.open() print with silent iframe | Popup blockers break print on kiosk tablets |
| 2026-05-09 | Unified Spinner component (violet/amber/white) | 7 ad-hoc implementations → 1 source of truth |
| 2026-05-09 | Lock motion to 0.2s spring everywhere | Eliminates lag on low-end Android tablets |
| 2026-05-09 | No-blur class via hardwareConcurrency detection | Blanket GPU relief for 4-core-or-less devices |
