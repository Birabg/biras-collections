import { Link } from 'react-router-dom';
import { ChevronLeft, Package, Truck, MapPin, CreditCard, Clock, CheckCircle, Circle, RotateCcw } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const mockOrder = {
  id: 'ORD-2026-001',
  date: 'Sep 15, 2026',
  status: 'Delivered',
  statusHistory: [
    { status: 'Order Placed', date: 'Sep 15, 2026', time: '10:30 AM', completed: true },
    { status: 'Processing', date: 'Sep 15, 2026', time: '2:15 PM', completed: true },
    { status: 'Shipped', date: 'Sep 16, 2026', time: '9:00 AM', completed: true },
    { status: 'Out for Delivery', date: 'Sep 17, 2026', time: '8:30 AM', completed: true },
    { status: 'Delivered', date: 'Sep 17, 2026', time: '2:45 PM', completed: true },
  ],
  items: [
    { name: 'Classic Linen Shirt', size: 'M', color: 'White', quantity: 2, price: 1850, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80' },
    { name: 'Minimalist Leather Belt', size: '90', color: 'Black', quantity: 1, price: 650, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80' },
  ],
  shipping: {
    name: 'Bira User',
    phone: '+251 911 234 567',
    address: 'Bole Sub-city, Kebele 12, House 45',
    city: 'Addis Ababa',
    region: 'Addis Ababa',
  },
  billing: {
    name: 'Bira User',
    email: 'bira@example.com',
    phone: '+251 911 234 567',
  },
  payment: {
    method: 'Telebirr',
    last4: '1234',
  },
  subtotal: 4350,
  delivery: 0,
  tax: 0,
  total: 4350,
  trackingNumber: 'ETBIR123456789',
  estimatedDelivery: 'Sep 17, 2026',
};

export default function OrderDetails() {
  const order = mockOrder;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 flex items-center gap-4">
          <Link to="/account/orders" className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={22} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Order Details</h1>
            <p className="text-sm text-gray-500">{order.id} • {order.date}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-6">Order Status</h2>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" aria-hidden="true" />
                <div className="space-y-6">
                  {order.statusHistory.map((step, idx) => (
                    <div key={step.status} className="relative flex gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          step.completed ? 'bg-black border-black' : 'bg-white border-gray-200'
                        }`}>
                          {step.completed && <CheckCircle size={16} strokeWidth={3} className="text-white" />}
                          {!step.completed && <Circle size={16} strokeWidth={3} className="text-gray-300" />}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>{step.status}</p>
                        <p className="text-sm text-gray-500">{step.date} at {step.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Order Items */}
            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <Link key={idx} to={`/product/${item.name.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
                    <img src={item.image} alt={item.name} className="h-20 w-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Size: {item.size} • Color: {item.color}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-6">Order Summary</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="font-medium">{formatPrice(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="font-medium">{order.delivery === 0 ? 'Free' : formatPrice(order.delivery)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd className="font-medium">{formatPrice(order.tax)}</dd></div>
                <div className="flex justify-between border-t border-gray-100 pt-3 font-semibold text-base"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              </dl>
            </section>
          </div>

          {/* Shipping, Payment, Actions */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MapPin size={20} strokeWidth={1.7} />
                Shipping Address
              </h2>
              <address className="text-gray-600 not-italic space-y-1">
                <p className="font-medium">{order.shipping.name}</p>
                <p>{order.shipping.phone}</p>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.city}, {order.shipping.region}</p>
              </address>
              {order.trackingNumber && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-mono font-medium text-gray-900">{order.trackingNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">Estimated delivery: {order.estimatedDelivery}</p>
                </div>
              )}
            </section>

            {/* Billing Address */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <CreditCard size={20} strokeWidth={1.7} />
                Billing Information
              </h2>
              <address className="text-gray-600 not-italic space-y-1">
                <p className="font-medium">{order.billing.name}</p>
                <p>{order.billing.email}</p>
                <p>{order.billing.phone}</p>
              </address>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{order.payment.method} ending in {order.payment.last4}</p>
              </div>
            </section>

            {/* Actions */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
              <Link to="/returns" className="block w-full h-11 flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <RotateCcw size={18} strokeWidth={1.7} />
                Return Items
              </Link>
              <Link to="/shop" className="block w-full h-11 flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <Package size={18} strokeWidth={1.7} />
                Buy Again
              </Link>
              <a href="mailto:support@birascollections.com" className="block w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                Contact Support
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}