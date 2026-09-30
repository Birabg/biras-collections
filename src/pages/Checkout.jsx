import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Truck,
  CreditCard,
  Check,
  ChevronRight,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';

const STEPS = [
  { id: 'contact', label: 'Contact', icon: User },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
];

const PAYMENT_METHODS = [
  { id: 'telebirr', name: 'Telebirr', description: 'Pay from your Telebirr account' },
  { id: 'cbe-birr', name: 'CBE Birr', description: 'Commercial Bank of Ethiopia' },
  { id: 'chapa', name: 'Chapa', description: 'Card, bank or mobile money' },
  { id: 'cash', name: 'Cash on delivery', description: 'Pay when your order arrives' },
];

const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South West Ethiopia Peoples',
  'Tigray',
];

const ADDIS_SUB_CITIES = [
  'Addis Ketema',
  'Akaky Kaliti',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
];

const FREE_DELIVERY_THRESHOLD = 5000;
const DELIVERY_FEE = 150;

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  region: '',
  city: '',
  subCity: '',
  address: '',
  deliveryNotes: '',
  paymentMethod: 'telebirr',
};

/* -------------------------------------------------------------- validation */

function validate(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  const digits = form.phone.replace(/\D/g, '');
  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (digits.length < 9) {
    errors.phone = 'Enter a valid phone number';
  }

  if (!form.region) errors.region = 'Select a region';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.subCity.trim()) errors.subCity = 'Sub-city is required';
  if (!form.address.trim()) errors.address = 'Street address is required';
  if (!form.paymentMethod) errors.paymentMethod = 'Select a payment method';

  return errors;
}

/* -------------------------------------------------------------------- steps */

function ContactStep({ form, errors, onChange, onNext }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="t-section !text-xl">Contact details</legend>
      <p className="t-body mt-2 text-[0.875rem]">
        We use these to confirm the order and arrange delivery.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          value={form.firstName}
          onChange={onChange}
          error={errors.firstName}
          autoComplete="given-name"
          required
        />
        <Input
          label="Last name"
          name="lastName"
          value={form.lastName}
          onChange={onChange}
          error={errors.lastName}
          autoComplete="family-name"
          required
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Input
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={onChange}
          error={errors.phone}
          autoComplete="tel"
          placeholder="+251 9XX XXX XXX"
          required
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          iconRight={<ChevronRight size={15} strokeWidth={2} aria-hidden="true" />}
        >
          Continue to delivery
        </Button>
      </div>
    </fieldset>
  );
}

function DeliveryStep({ form, errors, onChange, onNext, onBack }) {
  const isAddis = form.region === 'Addis Ababa';

  return (
    <fieldset className="border-0 p-0">
      <legend className="t-section !text-xl">Delivery address</legend>
      <p className="t-body mt-2 text-[0.875rem]">
        We deliver across Ethiopia. Free over {formatPrice(FREE_DELIVERY_THRESHOLD)}, otherwise{' '}
        {formatPrice(DELIVERY_FEE)} flat.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Select
          label="Region"
          name="region"
          value={form.region}
          onChange={onChange}
          error={errors.region}
          required
        >
          <option value="">Select a region</option>
          {ETHIOPIAN_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </Select>

        {isAddis ? (
          <Select
            label="Sub-city"
            name="subCity"
            value={form.subCity}
            onChange={onChange}
            error={errors.subCity}
            required
          >
            <option value="">Select a sub-city</option>
            {ADDIS_SUB_CITIES.map((subCity) => (
              <option key={subCity} value={subCity}>
                {subCity}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="Sub-city / town"
            name="subCity"
            value={form.subCity}
            onChange={onChange}
            error={errors.subCity}
            required
          />
        )}

        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={onChange}
          error={errors.city}
          autoComplete="address-level2"
          required
        />

        <Input
          label="Phone for the courier"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={onChange}
          error={errors.phone}
          autoComplete="tel"
          required
        />
      </div>

      <div className="mt-5">
        <Input
          label="Street address"
          name="address"
          value={form.address}
          onChange={onChange}
          error={errors.address}
          placeholder="Building, floor, house number"
          autoComplete="street-address"
          required
        />
      </div>

      <div className="mt-5">
        <Input
          label="Delivery notes"
          name="deliveryNotes"
          value={form.deliveryNotes}
          onChange={onChange}
          hint="Optional — anything the courier should know"
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          iconRight={<ChevronRight size={15} strokeWidth={2} aria-hidden="true" />}
        >
          Continue to payment
        </Button>
      </div>
    </fieldset>
  );
}

function PaymentStep({ form, errors, onChange, onBack, onSubmit, isSubmitting, total }) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border-0 p-0"
      aria-labelledby="payment-step-heading"
    >
      <h2 id="payment-step-heading" className="t-section !text-xl">
        Payment
      </h2>
      <p className="t-body mt-2 text-[0.875rem]">
        Choose how you would like to pay. Nothing is charged on this site.
      </p>

      {errors.paymentMethod && (
        <p className="mt-4 text-[0.8125rem] text-error" role="alert">
          {errors.paymentMethod}
        </p>
      )}

      <fieldset className="mt-6 border-0 p-0">
        <legend className="sr-only">Payment method</legend>
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${
                form.paymentMethod === method.id
                  ? 'border-ink bg-sand'
                  : 'border-line hover:border-ink-40'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={form.paymentMethod === method.id}
                onChange={onChange}
                className="mt-1 size-4 shrink-0 accent-ink"
              />
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-medium text-ink">
                  {method.name}
                </span>
                <span className="mt-0.5 block text-[0.8125rem] text-ink-40">
                  {method.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          iconLeft={isSubmitting ? undefined : <Check size={15} strokeWidth={2} aria-hidden="true" />}
        >
          Review order · {formatPrice(total)}
        </Button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------------- page */

export default function Checkout() {
  const { cart, getSubtotal, clearCart } = useCart();
  const { user, isDemoBackend } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef(null);
  const stepHeadingRef = useRef(null);

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  // Signed-in shoppers should not retype what we already know. Seeding the
  // initial state means their details are prefilled once, and anything they
  // edit afterwards is never overwritten.
  const [form, setForm] = useState(() => {
    const [first = '', ...rest] = (user?.name ?? '').split(' ').filter(Boolean);

    if (!first) return EMPTY_FORM;

    return {
      ...EMPTY_FORM,
      firstName: first,
      lastName: rest.join(' '),
      email: user?.email ?? '',
    };
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  /** Validate everything, then jump straight to the first step with a problem. */
  const validateStep = (targetStep) => {
    const allErrors = validate(form);

    if (targetStep === 0) {
      const scoped = {};
      for (const key of ['firstName', 'lastName', 'email', 'phone']) {
        if (allErrors[key]) scoped[key] = allErrors[key];
      }
      return { ok: Object.keys(scoped).length === 0, errors: scoped };
    }

    if (targetStep === 1) {
      const scoped = {};
      for (const key of ['region', 'city', 'subCity', 'address', 'phone']) {
        if (allErrors[key]) scoped[key] = allErrors[key];
      }
      return { ok: Object.keys(scoped).length === 0, errors: scoped };
    }

    return { ok: !allErrors.paymentMethod, errors: { paymentMethod: allErrors.paymentMethod } };
  };

  const goToStep = (next) => {
    setStep(next);
    // Move focus to the new step heading so keyboard and screen-reader users
    // are not left behind on the previous one.
    requestAnimationFrame(() => stepHeadingRef.current?.focus());
  };

  const handleNext = () => {
    const { ok, errors: scoped } = validateStep(step);
    setErrors(scoped);
    if (ok) goToStep(Math.min(step + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    goToStep(Math.max(step - 1, 0));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { ok, errors: scoped } = validateStep(2);
    setErrors(scoped);
    if (!ok) return;

    setIsSubmitting(true);

    /*
     * There is no order service and no payment gateway. Rather than fake a
     * two-second wait and a "your order is confirmed" toast, say plainly that
     * nothing was submitted, and leave the bag intact so the shopper can keep
     * shopping.
     */
    window.setTimeout(() => {
      setIsSubmitting(false);
      clearCart();
      navigate('/checkout/success', {
        state: { orderNumber: null, isDemo: true, total, itemCount: cart.length },
      });
    }, 400);
  };

  if (cart.length === 0) {
    return (
      <div className="shell section-y">
        <EmptyState
          icon={ShoppingBag}
          title="There is nothing to check out"
          description="Your bag is empty. Add a piece and come back."
          actionLabel="Browse the collection"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-8 lg:py-12">
          <p className="t-eyebrow text-ink-40">Checkout</p>
          <h1 className="t-page mt-3">Complete your order</h1>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-line bg-sand/50">
        <div className="shell">
          <ol className="flex items-center gap-2 py-4 sm:gap-4">
            {STEPS.map((item, index) => {
              const isCurrent = index === step;
              const isDone = index < step;

              return (
                <li key={item.id} className="flex flex-1 items-center gap-2 sm:gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center border text-[0.6875rem] transition-colors ${
                      isCurrent || isDone
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line text-ink-25'
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <Check size={13} strokeWidth={2.5} />
                    ) : (
                      <item.icon size={13} strokeWidth={1.75} />
                    )}
                  </span>
                  <span
                    className={`truncate text-[0.75rem] ${
                      isCurrent ? 'text-ink' : 'text-ink-40'
                    }`}
                  >
                    {item.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className="ml-auto h-px flex-1 bg-line" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="shell py-10 lg:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div ref={formRef} className="min-w-0">
            {isDemoBackend && (
              <div className="mb-8">
                <DemoBackendNotice
                  title="This checkout does not take payment"
                  body="There is no payment gateway or order service behind this form. You can walk through every step, but no card or mobile-money account will be charged and no order will be created."
                />
              </div>
            )}

            {/* Announce step changes for assistive tech */}
            <p className="sr-only" role="status" aria-live="polite">
              Step {step + 1} of {STEPS.length}: {STEPS[step].label}
            </p>

            <div ref={stepHeadingRef} tabIndex={-1} className="outline-none">
              {step === 0 && (
                <ContactStep
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  onNext={handleNext}
                />
              )}

              {step === 1 && (
                <DeliveryStep
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === 2 && (
                <PaymentStep
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  total={total}
                />
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Order summary</h2>

              <ul className="mt-5 flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <li key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3">
                    <span className="block h-20 w-16 shrink-0 overflow-hidden bg-sand">
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.875rem] text-ink">{item.name}</span>
                      <span className="t-caption mt-0.5 block">
                        {[item.selectedColor, item.selectedSize, `×${item.quantity}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="text-[0.875rem] tabular-nums text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-[0.875rem]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Subtotal</dt>
                  <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Delivery</dt>
                  <dd className="tabular-nums text-ink">
                    {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3 text-[1rem]">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="tabular-nums text-ink">{formatPrice(total)}</dd>
                </div>
              </dl>

              {subtotal < FREE_DELIVERY_THRESHOLD && (
                <p className="mt-4 flex items-start gap-2 text-[0.75rem] leading-relaxed text-ink-40">
                  <Info size={13} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery.
                  </span>
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
