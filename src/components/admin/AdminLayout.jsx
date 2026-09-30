import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import DemoBackendNotice from '../auth/DemoBackendNotice';

/**
 * Admin shell.
 *
 * Shares the brand tokens but deliberately does NOT look like the storefront:
 * the display serif is replaced by the sans face, spacing is tighter, and the
 * layout is data-dense. Navigation is derived from `can()` so a staff member
 * never sees a link they cannot use.
 */

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: PERMISSIONS.ORDERS_READ },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
  { to: '/admin/products', label: 'Products', icon: Package, permission: PERMISSIONS.CATALOG_VIEW },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, permission: PERMISSIONS.INVENTORY_READ },
  { to: '/admin/customers', label: 'Customers', icon: Users, permission: PERMISSIONS.CUSTOMERS_READ },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: PERMISSIONS.REPORTS_READ },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
];

function NavItems({ onNavigate }) {
  const { can } = useAuth();

  return (
    <ul className="flex flex-col gap-0.5">
      {NAV.filter((item) => can(item.permission)).map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 text-[0.8125rem] transition-colors duration-150',
                isActive
                  ? 'bg-ink text-paper'
                  : 'text-ink-60 hover:bg-sand hover:text-ink',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={16} strokeWidth={1.75} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
                {isActive && <span className="sr-only">(current page)</span>}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminLayout() {
  const { user, roleLabel } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const sidebar = (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <Link
          to="/admin"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5"
          aria-label="Admin dashboard home"
        >
          <span className="flex size-7 items-center justify-center bg-ink text-[0.6875rem] font-semibold text-paper">
            BC
          </span>
          <span className="text-[0.8125rem] font-semibold tracking-tight text-ink">Admin</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="-mr-2 p-2 text-ink-40 hover:text-ink lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin sections">
        <NavItems onNavigate={() => setMenuOpen(false)} />
      </nav>

      <div className="border-t border-line p-4">
        <p className="text-[0.8125rem] font-medium text-ink">{user?.name}</p>
        <p className="text-[0.75rem] text-ink-40">{user?.email}</p>
        <p className="t-eyebrow mt-2 text-ink-25">{roleLabel}</p>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-sand/40 font-sans">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-paper lg:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper animate-slide-left">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-2 p-2 text-ink-60 hover:text-ink lg:hidden"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>

          <p className="t-eyebrow truncate text-ink-40">
            {NAV.find((item) =>
              item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
            )?.label ?? 'Admin'}
          </p>

          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 text-[0.75rem] font-medium text-ink-60 transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
            View storefront
          </Link>
        </header>

        <DemoBackendNotice className="mx-4 mt-4 lg:mx-8" />

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Consistent page heading for every admin screen. */
export function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-[0.8125rem] text-ink-60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
