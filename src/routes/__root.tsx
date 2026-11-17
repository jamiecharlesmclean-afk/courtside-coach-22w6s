import { createRootRoute, Outlet } from "@tanstack/react-router"

// The shell every route renders inside. Put app-wide chrome here (a nav bar, a
// providers wrapper, an error boundary) — it stays mounted across navigations.
export const Route = createRootRoute({
  component: () => <Outlet />,
})
