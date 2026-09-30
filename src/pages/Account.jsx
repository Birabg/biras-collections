import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Heart, User, MapPin, LogOut, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../auth/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { PERMISSIONS, roleLabel as labelForRole } from '../auth/roles';
import {
  fetchOrders,
  STATUS_META,
  STATUS_TONE_CLASS,
  formatOrderDate,
  orderItemCount,
} from '../data/customerOrders';
import { formatPrice } from '../utils/currency';

const SHORTCUTS = [
  { title: 'Orders', description: 'Track, return or reorder', to: '/account/orders', icon: Package, permission: PERMISSIONS.ORDERS_OWN_READ },
  { title: 'Wishlist', description: 'Pieces you have saved', to: '/wishlist', icon: Heart, permission: PERMISSIONS.WISHLIST_MANAGE },
  { title: 'Profile', description: 'Your name and contact details', to: '/account/profile', icon: User, permission: PERMISSIONS.PROFILE_READ },
  { title: 'Addresses', description: 'Where we deliver', to: '/account/addresses', icon: MapPin, permission: PERMISSIONS.ADDRESSES_MANAGE },
];

export default function Account() {
  const { user, role, logout, can, isDemoBackend } = useAuth();
  const { wishlist } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOrders().then((result) => {
      if (!cancelled) setOrders(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const initials = (user?.name ?? 'B')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsSignOutOpen(false);
      toast.success('Signed out', { message: 'Your session on this device has ended.' });
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-14">
          <p className="t-eyebrow text-ink-40">Your account</p>
          <h1 className="t-page mt-3">
            Welcome back, {firstName}
          </h1>
        </div>
      </header>

      <div className="shell py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          {/* Identity + sign out */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-4 border-b border-line pb-6">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-[1.0625rem] font-medium text-paper"
                aria-hidden="true"
              >
                {initials || 'B'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] font-medium text-ink">{user?.name}</p>
                <p className="truncate text-[0.8125rem] text-ink-40">{user?.email}</p>
                <p className="t-eyebrow mt-1.5 text-ink-25">{labelForRole(role)}</p>
              </div>
            </div>

            {isDemoBackend && (
              <p className="mt-6 flex items-start gap-2.5 border border-line bg-sand px-4 py-3 text-[0.75rem] leading-relaxed text-ink-60">
                <ShieldCheck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  This account lives in your browser only. Clearing site data removes it.
                </span>
              </p>
            )}

            <Button
              variant="tertiary"
              size="sm"
              className="mt-6"
              onClick={() => setIsSignOutOpen(true)}
              iconLeft={<LogOut size={14} strokeWidth={1.75} aria-hidden="true" />}
            >
              Sign out
            </Button>
          </aside>

          <div className="min-w-0">
            {/* Shortcuts */}
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {SHORTCUTS.filter((item) => can(item.permission)).map((item) => (
                <li key={item.to} className="bg-paper">
                  <Link
                    to={item.to}
                    className="group flex items-start gap-4 p-6 transition-colors hover:bg-sand"
                  >
                    <item.icon
                      size={20}
                      strokeWidth={1.4}
                      className="mt-0.5 shrink-0 text-ink-40 transition-colors group-hover:text-ink"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-medium text-ink">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] text-ink-40">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight
                      size={15}
                      strokeWidth={1.75}
                      className="ml-auto mt-1 shrink-0 text-ink-25 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* At a glance */}
            <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
              <div className="bg-paper p-5">
                <dt className="t-eyebrow text-ink-40">Orders</dt>
                <dd className="mt-2 text-xl tabular-nums text-ink">{orders.length}</dd>
              </div>
              <div className="bg-paper p-5">
                <dt className="t-eyebrow text-ink-40">Saved</dt>
                <dd className="mt-2 text-xl tabular-nums text-ink">{wishlist.length}</dd>
              </div>
              <div className="bg-paper p-5">
                <dt className="t-eyebrow text-ink-40">Member since</dt>
                <dd className="mt-2 text-[0.9375rem] text-ink">
                  {user?.createdAt ? formatOrderDate(user.createdAt) : 'Today'}
                </dd>
              </div>
            </dl>

            {/* Recent orders */}
            <section className="mt-10" aria-labelledby="recent-orders-heading">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="recent-orders-heading" className="t-section !text-xl">
                  Recent orders
                </h2>
                {orders.length > 0 && (
                  <Link
                    to="/account/orders"
                    className="link-underline inline-flex items-center gap-1.5 text-[0.8125rem] text-ink"
                  >
                    View all
                    <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                  </Link>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <p className="t-body mt-4 border border-line px-5 py-6">
                  No orders yet. Anything you place will appear here.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
                  {recentOrders.map((order) => {
                    const meta = STATUS_META[order.status];

                    return (
                      <li key={order.id}>
                        <Link
                          to={`/account/orders/${order.id}`}
                          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 transition-colors hover:bg-sand"
                        >
                          <span className="flex items-baseline gap-3">
                            <span className="text-[0.875rem] font-medium text-ink">{order.id}</span>
                            <span className="text-[0.8125rem] text-ink-40">
                              {formatOrderDate(order.placedAt)}
                            </span>
                          </span>

                          <span className="flex items-center gap-4">
                            <span
                              className={`px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.1em] ${STATUS_TONE_CLASS[meta.tone]}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[0.875rem] tabular-nums text-ink">
                              {formatPrice(order.total)}
                            </span>
                            <span className="t-caption hidden sm:inline">
                              {orderItemCount(order)}{' '}
                              {orderItemCount(order) === 1 ? 'item' : 'items'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        title="Sign out?"
      >
        <p className="t-body">
          Your bag and wishlist stay on this device. You will need to sign in again to see
          your account.
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setIsSignOutOpen(false)}>
            Stay signed in
          </Button>
          <Button loading={isLoggingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Modal>
    </>
  );
}
