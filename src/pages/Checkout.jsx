import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, CreditCard, Check, MapPin, User, Mail, Phone, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getProductById } from '../data/products';

const steps = [
  { id: 'customer', label: 'Information', icon: User },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: Check },
];

const paymentMethods = [
  { id: 'telebirr', name: 'Telebirr', icon: '📱', description: 'Pay with your Telebirr account' },
  { id: 'chapa', name: 'Chapa', icon: '💳', description: 'Card, Bank, or Mobile Money' },
  { id: 'cbe', name: 'CBE Birr', icon: '🏦', description: 'Commercial Bank of Ethiopia' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive your order' },
];

const ethiopianRegions = [
  'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela',
  'Harari', 'Oromia', 'Sidama', 'Somali', 'South West Ethiopia Peoples', 'Tigray'
];

const addisSubCities = [
  'Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'
];

export default function Checkout() {
  const { cart, getSubtotal, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Customer Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Delivery Info
    region: '',
    city: '',
    subCity: '',
    address: '',
    deliveryNotes: '',
    // Payment
    paymentMethod: 'telebirr',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= 5000 ? 0 : 150;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-medium">Your cart is empty</h1>
          <Link to="/shop" className="mt-4 inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    }
    if (step === 1) {
      if (!formData.region) newErrors.region = 'Region is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.subCity) newErrors.subCity = 'Sub-city is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }
    if (step === 2) {
      if (!formData.paymentMethod) newErrors.paymentMethod = 'Select a payment method';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    // Simulate order creation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    sessionStorage.setItem('lastOrderNumber', orderNumber);
    clearCart();
    toast.success('Order placed!', { message: `Your order ${orderNumber} has been confirmed` });
    navigate('/checkout/success');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <CustomerInfoStep formData={formData} errors={errors} onChange={handleChange} />;
      case 1: return <DeliveryInfoStep formData={formData} errors={errors} onChange={handleChange} />;
      case 2: return <PaymentStep formData={formData} errors={errors} onChange={handleChange} />;
      case 3: return <ReviewStep formData={formData} cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    idx < currentStep ? 'bg-black text-white' :
                    idx === currentStep ? 'bg-black text-white ring-2 ring-black ring-offset-2' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {idx < currentStep ? <Check size={14} strokeWidth={3} /> : step.icon}
                  </div>
                  <span className={`hidden sm:block text-sm font-medium ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 transition-colors ${idx < currentStep ? 'bg-black' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {renderStep()}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0} type="button">
                  <ChevronLeft size={16} strokeWidth={2} className="mr-1" />
                  Back
                </Button>
                <div className="flex gap-3">
                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={handleNext}>
                      Continue
                      <ChevronRight size={16} strokeWidth={2} className="ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? 'Placing Order...' : `Place Order • ${formatPrice(total)}`}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 self-start bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-medium">Order Summary</h2>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-12 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.selectedColor && `${item.selectedColor} • `}
                        {item.selectedSize && `${item.size} • `}
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="font-medium">{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd></div>
                {subtotal < 5000 && (
                  <p className="text-xs text-gray-500 text-center">Add {formatPrice(5000 - subtotal)} more for free delivery</p>
                )}
                <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>

              <p className="text-xs text-gray-500 text-center">Taxes included. Delivery calculated at checkout.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function CustomerInfoStep({ formData, errors, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium">Contact Information</h3>
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="First name" name="firstName" type="text" value={formData.firstName} onChange={onChange} error={errors.firstName} autoComplete="given-name" icon={<User size={18} strokeWidth={1.7} className="text-gray-400" />} />
        <Input label="Last name" name="lastName" type="text" value={formData.lastName} onChange={onChange} error={errors.lastName} autoComplete="family-name" />
      </div>
      <Input label="Email address" name="email" type="email" value={formData.email} onChange={onChange} error={errors.email} autoComplete="email" icon={<Mail size={18} strokeWidth={1.7} className="text-gray-400" />} />
      <Input label="Phone number" name="phone" type="tel" value={formData.phone} onChange={onChange} error={errors.phone} autoComplete="tel" placeholder="+251 9XX XXX XXX" icon={<Phone size={18} strokeWidth={1.7} className="text-gray-400" />} />
    </div>
  );
}

function DeliveryInfoStep({ formData, errors, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium">Delivery Address</h3>
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Region" name="region" type="text" value={formData.region} onChange={onChange} error={errors.region} list="regions" placeholder="Select region" icon={<MapPin size={18} strokeWidth={1.7} className="text-gray-400" />} />
        <Input label="City" name="city" type="text" value={formData.city} onChange={onChange} error={errors.city} placeholder="City" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Sub-city" name="subCity" type="text" value={formData.subCity} onChange={onChange} error={errors.subCity} placeholder="Sub-city" />
        <Input label="Postal code (optional)" name="postalCode" type="text" value={formData.postalCode} onChange={onChange} placeholder="Postal code" />
      </div>
      <Input label="Address" name="address" type="text" value={formData.address} onChange={onChange} error={errors.address} placeholder="Street, building, floor, apartment" autoComplete="street-address" />
      <Input label="Delivery notes (optional)" name="deliveryNotes" type="text" value={formData.deliveryNotes} onChange={onChange} placeholder="e.g., Blue gate, call on arrival" icon={<Mail size={18} strokeWidth={1.7} className="text-gray-400" />} />
    </div>
  );
}

function PaymentStep({ formData, errors, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium">Payment Method</h3>
      {errors.paymentMethod && <p className="text-sm text-red-600" role="alert">{errors.paymentMethod}</p>}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <label key={method.id} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === method.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={formData.paymentMethod === method.id}
              onChange={onChange}
              className="h-4 w-4 text-black border-gray-300 focus:ring-black"
            />
            <span className="text-2xl">{method.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{method.name}</p>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
          </label>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        You will be redirected to complete payment securely after placing your order.
      </p>
    </div>
  );
}

function ReviewStep({ formData, cart, subtotal, deliveryFee, total }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <p>{formData.firstName} {formData.lastName}</p>
        <p>{formData.email}</p>
        <p>{formData.phone}</p>
      </section>

      <section>
        <h3 className="text-lg font-medium mb-4">Delivery Address</h3>
        <address className="not-italic text-gray-600 space-y-1">
          <p>{formData.address}</p>
          <p>{formData.subCity}, {formData.city}</p>
          <p>{formData.region}</p>
        </address>
        {formData.deliveryNotes && <p className="mt-2 text-sm text-gray-500">Note: {formData.deliveryNotes}</p>}
      </section>

      <section>
        <h3 className="text-lg font-medium mb-4">Payment Method</h3>
        <p className="capitalize">{formData.paymentMethod.replace('-', ' ')}</p>
      </section>
    </div>
  );
}