import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, User, LogOut, ChevronRight, CreditCard, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const accountSections = [
  {
    title: 'My Orders',
    items: [
      { label: 'Orders', href: '/account/orders', icon: Package },
      { label: 'Returns', href: '/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'Account Settings',
    items: [
      { label: 'Profile', href: '/account/profile', icon: User },
      { label: 'Addresses', href: '/account/addresses', icon: MapPin },
      { label: 'Payment Methods', href: '/account/payment', icon: CreditCard },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Wishlist', href: '/wishlist', icon: Heart },
      { label: 'Newsletter', href: '/account/newsletter', icon: Mail },
    ],
  },
];

// Need to import RotateCcw and Mail
import { RotateCcw, Mail } from 'lucide-react';

export default function Account() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    // In a real app, this would call an auth logout API
    toast.success('Logged out', { message: 'You have been logged out successfully' });
    navigate('/login');
  };

  // Mock user data
  const user = {
    name: 'Bira User',
    email: 'bira@example.com',
    avatar: null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <h1 className="text-3xl font-medium tracking-tight">My Account</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-medium text-gray-500">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-gray-900 truncate">{user.name}</h2>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                {accountSections.flatMap((section) =>
                  section.items.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <item.icon size={18} strokeWidth={1.7} className="text-gray-400 group-hover:text-gray-600" />
                      {item.label}
                      <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
                    </Link>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button variant="ghost" fullWidth onClick={handleLogout} className="text-red-600 hover:bg-red-50 justify-start">
                  <LogOut size={18} strokeWidth={1.7} />
                  Sign out
                </Button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-medium">Welcome back, {user.name.split(' ')[0]}!</h2>
                <p className="mt-1 text-gray-500">Manage your account, track orders, and update your preferences.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Quick Actions */}
                <Link to="/account/orders" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <Package size={24} strokeWidth={1.7} className="text-gray-600 group-hover:text-black" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">My Orders</h3>
                  <p className="text-sm text-gray-500">Track, return, or reorder items</p>
                </Link>

                <Link to="/wishlist" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <Heart size={24} strokeWidth={1.7} className="text-gray-600 group-hover:text-red-500" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Wishlist</h3>
                  <p className="text-sm text-gray-500">View your saved items</p>
                </Link>

                <Link to="/account/profile" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <User size={24} strokeWidth={1.7} className="text-gray-600 group-hover:text-black" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Profile</h3>
                  <p className="text-sm text-gray-500">Update your personal information</p>
                </Link>

                <Link to="/account/addresses" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <MapPin size={24} strokeWidth={1.7} className="text-gray-600 group-hover:text-black" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Addresses</h3>
                  <p className="text-sm text-gray-500">Manage shipping addresses</p>
                </Link>

                <Link to="/account/payment" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <CreditCard size={24} strokeWidth={1.7} className="text-gray-600 group-hover:text-black" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Payment Methods</h3>
                  <p className="text-sm text-gray-500">Manage saved payment methods</p>
                </Link>

                <Link to="/shop" className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <svg className="h-6 w-6 text-gray-600 group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Continue Shopping</h3>
                  <p className="text-sm text-gray-500">Browse our latest collection</p>
                </Link>
              </div>

              {/* Recent Orders */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Recent Orders</h3>
                  <Link to="/account/orders" className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">
                    View all
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Total</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <Link to="/account/orders/ORD-2026-001" className="font-medium text-gray-900 hover:underline">ORD-2026-001</Link>
                        </td>
                        <td className="px-4 py-4 text-gray-500">Sep 15, 2026</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Delivered</span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium">4,800 ETB</td>
                        <td className="px-4 py-4 text-right">
                          <Link to="/account/orders/ORD-2026-001" className="text-sm font-medium text-gray-600 hover:text-black">View</Link>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <Link to="/account/orders/ORD-2026-002" className="font-medium text-gray-900 hover:underline">ORD-2026-002</Link>
                        </td>
                        <td className="px-4 py-4 text-gray-500">Sep 20, 2026</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Processing</span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium">2,950 ETB</td>
                        <td className="px-4 py-4 text-right">
                          <Link to="/account/orders/ORD-2026-002" className="text-sm font-medium text-gray-600 hover:text-black">View</Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}