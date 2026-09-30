import { RotateCcw, Clock, CheckCircle, Truck, Box, CreditCard, XCircle } from 'lucide-react';

const returnPolicy = [
  {
    title: '30-Day Returns',
    description: 'Return any item within 30 days of delivery for a full refund. Items must be unworn, unwashed, and with original tags attached.',
  },
  {
    title: 'Free Return Shipping',
    description: 'Free return shipping for orders over 5,000 ETB. For orders below, a 150 ETB return fee will be deducted from your refund.',
  },
  {
    title: 'Easy Exchanges',
    description: 'Exchange for a different size or color at no extra cost. We\'ll ship the replacement as soon as we receive your return.',
  },
  {
    title: 'Refund Timeline',
    description: 'Refunds are processed within 5-7 business days after we receive your return. Original payment method will be credited.',
  },
];

const howToReturn = [
  { step: 1, title: 'Start Your Return', description: 'Log into your account, go to Orders, and select "Return Items" on the order you want to return.' },
  { step: 2, title: 'Select Items & Reason', description: 'Choose which items to return and select a reason. This helps us improve our products.' },
  { step: 3, title: 'Print Return Label', description: 'Print the prepaid return shipping label. If you don\'t have a printer, we can email you a QR code.' },
  { step: 4, title: 'Pack & Drop Off', description: 'Pack items in original packaging if possible. Drop off at any authorized courier location.' },
  { step: 5, title: 'Get Your Refund', description: 'We\'ll inspect the return and process your refund within 5-7 business days.' },
];

const nonReturnable = [
  'Underwear, socks, and intimate apparel (for hygiene reasons)',
  'Personalized or custom-made items',
  'Gift cards',
  'Items marked as final sale',
  'Swimwear without hygiene liner',
  'Beauty products with broken seals',
];

export default function Returns() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-medium tracking-tight">Returns & Exchanges</h1>
          <p className="mt-2 text-gray-500">Simple, hassle-free returns within 30 days</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-medium mb-6">Our Return Policy</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {returnPolicy.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-6">How to Return</h2>
              <div className="space-y-6">
                {howToReturn.map((step) => (
                  <div key={step.step} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-6">Non-Returnable Items</h2>
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <p className="text-gray-600 mb-4">The following items cannot be returned for hygiene or customization reasons:</p>
                <ul className="space-y-2">
                  {nonReturnable.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-600">
                      <XCircle size={18} strokeWidth={1.7} className="flex-shrink-0 mt-0.5 text-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-6">Exchanges</h2>
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <p className="text-gray-600">Want a different size or color? Exchanges are free and easy:</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2"><CheckCircle size={18} strokeWidth={2} className="flex-shrink-0 mt-0.5 text-green-600" /> Select "Exchange" when starting your return</li>
                  <li className="flex items-start gap-2"><CheckCircle size={18} strokeWidth={2} className="flex-shrink-0 mt-0.5 text-green-600" /> Choose the new size/color</li>
                  <li className="flex items-start gap-2"><CheckCircle size={18} strokeWidth={2} className="flex-shrink-0 mt-0.5 text-green-600" /> We ship the replacement immediately upon receiving your return</li>
                  <li className="flex items-start gap-2"><CheckCircle size={18} strokeWidth={2} className="flex-shrink-0 mt-0.5 text-green-600" /> No extra shipping charges</li>
                </ul>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 lg:sticky lg:top-24 self-start">
              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle size={24} strokeWidth={1.7} className="text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Free Returns Over 5,000 ETB</h3>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <RotateCcw size={24} strokeWidth={1.7} className="text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">Free Exchanges</h3>
                <p className="text-sm text-gray-600 mt-1">Size & color exchanges at no cost</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <Clock size={24} strokeWidth={1.7} className="text-gray-600 mb-2" />
                <h3 className="font-medium text-gray-900">30-Day Window</h3>
                <p className="text-sm text-gray-600 mt-1">From delivery date</p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <a href="/account/orders" className="block w-full h-11 flex items-center justify-center gap-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
                  Start a Return
                  <RotateCcw size={16} strokeWidth={2} />
                </a>
                <a href="/contact" className="block w-full h-11 flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Contact Support
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}