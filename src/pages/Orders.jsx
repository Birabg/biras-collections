import { Link } from 'react-router-dom';
import { Package, ChevronRight, ChevronLeft, Filter, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const mockOrders = [
  {
    id: 'ORD-2026-001',
    date: 'Sep 15, 2026',
    status: 'Delivered',
    statusColor: 'bg-green-50 text-green-700',
    items: [
      { name: 'Classic Linen Shirt', quantity: 2, price: 1850, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80' },
      { name: 'Minimalist Leather Belt', quantity: 1, price: 650, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80' },
    ],
    subtotal: 4350,
    delivery: 0,
    total: 4350,
  },
  {
    id: 'ORD-2026-002',
    date: 'Sep 20, 2026',
    status: 'Processing',
    statusColor: 'bg-blue-50 text-blue-700',
    items: [
      { name: 'Elegant Summer Dress', quantity: 1, price: 2950, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80' },
    ],
    subtotal: 2950,
    delivery: 150,
    total: 3100,
  },
  {
    id: 'ORD-2026-003',
    date: 'Sep 25, 2026',
    status: 'Shipped',
    statusColor: 'bg-purple-50 text-purple-700',
    items: [
      { name: 'Premium Leather Bag', quantity: 1, price: 4200, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=200&q=80' },
      { name: 'Cashmere Blend Scarf', quantity: 1, price: 1200, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=200&q=80' },
    ],
    subtotal: 5400,
    delivery: 0,
    total: 5400,
  },
];

const statusOptions = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

export default function Orders() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-medium tracking-tight">My Orders</h1>
          <div className="flex items-center gap-3">
            <select className="h-10 px-4 pr-10 text-sm border border-gray-200 rounded-lg bg-white appearance-none" aria-label="Filter orders by status">
              {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <Link to="/shop" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Package size={16} strokeWidth={1.7} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="space-y-6">
          {mockOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled aria-label="Previous page">
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button className="h-10 w-10 flex items-center justify-center bg-black text-white rounded-lg font-medium">1</button>
            <button className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50">2</button>
            <button className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50">3</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50" aria-label="Next page">
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order }) {
  return (
    <article className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-10 w-10 text-gray-400" strokeWidth={1.7} />
            <div>
              <Link to={`/account/orders/${order.id}`} className="font-medium text-gray-900 hover:underline">{order.id}</Link>
              <p className="text-sm text-gray-500">{order.date}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
            {order.status}
          </span>
        </div>
        <Link to={`/account/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black">
          View Details
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {order.items.map((item, idx) => (
            <Link key={idx} to={`/product/${item.name.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <img src={item.image} alt={item.name} className="h-16 w-12 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} × {item.price.toLocaleString()} ETB</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>Subtotal: <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span></span>
            <span>Delivery: <span className="font-medium text-gray-900">{order.delivery === 0 ? 'Free' : formatPrice(order.delivery)}</span></span>
          </div>
          <div className="text-right sm:text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-semibold text-gray-900">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}