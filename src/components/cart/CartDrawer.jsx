import { useEffect } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/currency';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
import { createPortal } from 'react-dom';

function CartDrawerContent({ isOpen, onClose }) {
  const { cart, getItemCount, getSubtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

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

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const drawer = (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl flex flex-col animate-slide-in" role="dialog" aria-modal="true" aria-label="Shopping bag">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium">Shopping Bag ({itemCount})</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors" aria-label="Close bag">
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
              <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-medium text-gray-900">Your bag is empty</p>
              <p className="text-sm mt-1">Looks like you haven't added any items yet.</p>
              <Link to="/shop" onClick={onClose} className="mt-4 inline-flex items-center gap-2 text-black hover:underline font-medium">
                Continue shopping
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                <Link to={`/product/${item.slug || item.id}`} className="relative h-24 w-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.slug || item.id}`} className="font-medium text-sm line-clamp-1 hover:underline">{item.name}</Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {item.selectedColor && <span>{item.selectedColor}</span>}
                    {item.selectedSize && <span>{item.selectedSize}</span>}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-sm">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.selectedSize, item.selectedColor, -1)}
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} strokeWidth={2} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.selectedSize, item.selectedColor, 1)}
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id, item.selectedSize, item.selectedColor, item.name)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={18} strokeWidth={1.7} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className="font-medium">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <button onClick={handleCheckout} className="w-full h-12 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors">
              Checkout
            </button>
            <Link to="/cart" onClick={onClose} className="block text-center text-sm font-medium text-gray-600 hover:text-black">
              View and edit bag
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(drawer, document.body);
}

export default function CartDrawer({ isOpen, onClose }) {
  return <CartDrawerContent isOpen={isOpen} onClose={onClose} />;
}