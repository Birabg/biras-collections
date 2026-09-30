import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';

export default function Cart() {
  const { cart, getSubtotal, updateQuantity, removeItem, clearCart } = useCart();
  const toast = useToast();

  const subtotal = getSubtotal();
  const delivery = 0; // Calculated at checkout
  const total = subtotal + delivery;

  const handleUpdateQty = (id, size, color, delta) => {
    const item = cart.find(i => i.id === id && i.selectedSize === size && i.selectedColor === color);
    if (item) {
      updateQuantity(id, item.quantity + delta, size, color);
    }
  };

  const handleRemove = (id, size, color, name) => {
    removeItem(id, size, color);
    toast.success('Removed from bag', { message: `${name} removed from your bag` });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <EmptyState
          title="Your bag is empty"
          description="Looks like you haven't added any items yet."
          action={
            <Link to="/shop" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
              Continue shopping
              <ChevronRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <h1 className="text-3xl font-medium tracking-tight">Shopping Bag</h1>
          <p className="mt-1 text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in your bag</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <ul className="space-y-6" role="list" aria-label="Cart items">
              {cart.map((item) => (
                <li key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                  <Link to={`/product/${item.slug || item.id}`} className="relative h-32 w-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link to={`/product/${item.slug || item.id}`} className="font-medium text-sm line-clamp-1 hover:underline">{item.name}</Link>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {item.selectedColor && <span>{item.selectedColor}</span>}
                          {item.selectedSize && <span>{item.selectedSize}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id, item.selectedSize, item.selectedColor, item.name)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={18} strokeWidth={1.7} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{formatPrice(item.price)}</span>
                        <div className="flex items-center gap-1 border border-gray-200 rounded-md">
                          <button
                            onClick={() => handleUpdateQty(item.id, item.selectedSize, item.selectedColor, -1)}
                            className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} strokeWidth={2} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              updateQuantity(item.id, val, item.selectedSize, item.selectedColor);
                            }}
                            className="w-12 text-center border-x border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            min="1"
                            aria-label="Quantity"
                          />
                          <button
                            onClick={() => handleUpdateQty(item.id, item.selectedSize, item.selectedColor, 1)}
                            className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-between">
              <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 self-start bg-gray-50 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium">Order Summary</h2>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd className="font-medium text-gray-900">Calculated at checkout</dd>
                </div>
              </dl>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-base">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Taxes and shipping calculated at checkout.
              </p>

              <Link
                to="/checkout"
                className="block w-full h-12 flex items-center justify-center bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Proceed to Checkout
              </Link>

              <p className="text-xs text-gray-500 text-center">
                By proceeding, you agree to our <Link to="/terms" className="underline hover:text-gray-700">Terms</Link> and <Link to="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>.
              </p>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium mb-3">Secure payment with</h3>
                <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
                  <span className="font-medium">Telebirr</span>
                  <span className="font-medium">Chapa</span>
                  <span className="font-medium">CBE Birr</span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}