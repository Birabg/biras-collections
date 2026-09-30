import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, ChevronRight } from 'lucide-react';

export default function CheckoutSuccess() {
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('lastOrderNumber');
    if (saved) {
      setOrderNumber(saved);
      sessionStorage.removeItem('lastOrderNumber');
    } else {
      setOrderNumber(`ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-100 p-8 lg:p-12 text-center">
        <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={40} strokeWidth={2} className="text-green-600" />
        </div>

        <h1 className="text-3xl font-medium tracking-tight mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-2">Thank you for your order.</p>
        <p className="text-gray-500 mb-8">Your order number is <span className="font-mono font-medium text-gray-900">{orderNumber}</span></p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Package size={20} strokeWidth={1.7} />
            Order Summary
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Order Number</dt><dd className="font-medium">{orderNumber}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium text-green-600">Confirmed</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Confirmation</dt><dd className="font-medium">Email & SMS sent</dd></div>
          </dl>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Mail size={24} strokeWidth={1.7} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium">Confirmation Sent</p>
            <p className="text-xs text-gray-500">Check your email</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Package size={24} strokeWidth={1.7} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium">Processing Soon</p>
            <p className="text-xs text-gray-500">Within 24 hours</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Truck size={24} strokeWidth={1.7} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium">Delivery</p>
            <p className="text-xs text-gray-500">Track in Account</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/account/orders" className="block w-full h-12 flex items-center justify-center gap-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
            View Order Details
            <ChevronRight size={16} />
          </Link>
          <Link to="/shop" className="block w-full h-12 flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}