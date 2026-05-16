# TODOS

Deferred items from engineering reviews. Each has context, motivation, and prerequisites.

---

## TODO-1: God Component refactor — split App.jsx

**What:** Split `src/App.jsx` (3,311 lines) so that each page owns its data via `useQuery` hooks instead of receiving all state as props from App.jsx.

**Why:** App.jsx is load-bearing as a God Component — all state, all loading functions, all business logic in one file. This makes it untestable, hard to change, and prevents TanStack Query from being fully useful (queries should live near their consumers, not centrally).

**Pros:** Co-located state, no prop-drilling, pages independently testable, TanStack Query benefits fully realized, App.jsx reduced to routing + shared modals only.

**Cons:** Large scope (~500–800 line refactor), high regression risk without careful extraction, requires dedicated session.

**How to start:** Pick one page (start with `AnalyticsPage` — fewest props), extract its queries with `useQuery`, remove its props from App.jsx. Validate. Repeat per page. Do NOT do structure + behavior changes in the same commit.

**Depends on:** The TanStack Query cache PR (this PR must be merged first so the QueryClient is available).

---

## TODO-2: useMutation migration for action handlers

**What:** Replace the 20+ `optimisticSetState + invalidateQueries` patterns with TanStack Query's `useMutation` using `onMutate`/`onError`/`onSettled` for true optimistic updates with automatic rollback on error.

**Why:** The current pattern has a race condition: optimistic `setState` runs, then `invalidateQueries` fires a background refetch, then the refetch result can override in-flight optimistic state. Under slow network, this causes a visible flash of reordering. `useMutation` with `onMutate`/`onSettled` makes this race-free and adds automatic rollback when the server returns an error.

**Pros:** Eliminates optimistic state race, adds rollback on mutation failure, mutation logic co-located with query logic.

**Cons:** Requires TODO-1 first (mutations must live near their queries, not in App.jsx). 2+ sessions of work.

**How to start:** After TODO-1, convert `handleCreatePedido` first as the reference implementation, then do the rest.

**Depends on:** TODO-1 (God Component refactor).

---

## TODO-3: Error UI for failed queries

**What:** When a TanStack Query fails (backend down, network error, expired token), show a clear error message to the user — e.g., "No se pudieron cargar los pedidos. Verifica tu conexión." — instead of silent empty state.

**Why:** Current loaders silently catch errors; users see empty tables with no explanation when the backend is unreachable. This is confusing for restaurant staff during a busy service.

**Pros:** Directly improves observability; staff know when the app is broken vs. when there are legitimately no orders.

**Cons:** Requires updating page components to accept and render an `error` prop. Error message design (copy, placement, retry button) is a real UX decision that deserves its own design session.

**How to start:** Design error states first (empty state + error state for each page). Then add `error` prop to `PedidosPage`, `VentasPage`, `AnalyticsPage`. Reuse a single `<QueryError />` component.

**Depends on:** None — can be done independently, but easier after TODO-1.
