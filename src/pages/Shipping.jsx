import { Truck, Clock, MapPin, CheckCircle, XCircle, Shield, Package, ChevronDown } from 'lucide-react';

const shippingInfo = [
  {
    title: 'Free Delivery',
    description: 'Enjoy free delivery on all orders over 5,000 ETB. Standard delivery fee of 150 ETB applies to orders below this amount.',
    icon: Truck,
  },
  {
    title: 'Delivery Times',
    description: 'Addis Ababa: 2-3 business days. Other cities: 3-5 business days. Remote areas: 5-7 business days.',
    icon: Clock,
  },
  {
    title: 'Coverage',
    description: 'We deliver to all regions in Ethiopia including Addis Ababa, Dire Dawa, and all regional states.',
    icon: MapPin,
  },
  {
    title: 'Tracking',
    description: 'Track your order in real-time via your account or the tracking link sent via SMS and email.',
    icon: Package,
  },
];

const faqs = [
  {
    q: 'Do you offer free delivery?',
    a: 'Yes, free delivery on orders over 5,000 ETB. Orders below this amount have a 150 ETB delivery fee.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Addis Ababa: 2-3 business days. Other cities: 3-5 business days. Remote areas: 5-7 business days.',
  },
  {
    q: 'Can I change my delivery address after ordering?',
    a: 'Contact us within 1 hour of placing your order. After that, the order may already be processing.',
  },
  {
    q: 'What if I\'m not home during delivery?',
    a: 'Our courier will call you. If unreachable, they\'ll leave a note and attempt re-delivery the next business day.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently we only ship within Ethiopia. International shipping is planned for the future.',
  },
];

export default function Shipping() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-medium tracking-tight">Shipping Information</h1>
          <p className="mt-2 text-gray-500">Everything you need to know about delivery</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-medium mb-6">Delivery Options</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {shippingInfo.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <item.icon size={24} strokeWidth={1.7} className="text-gray-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-6">Shipping FAQ</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="bg-white rounded-xl border border-gray-100 group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <h3 className="font-medium text-gray-900 pr-8">{faq.q}</h3>
                      <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" strokeWidth={2} />
                    </summary>
                    <div className="px-6 pb-6 text-gray-600 border-t border-gray-100">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 lg:sticky lg:top-24 self-start">
              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle size={24} strokeWidth={1.7} className="text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Free Delivery Available</h3>
                <p className="text-sm text-gray-600 mt-1">On orders over 5,000 ETB</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <Shield size={24} strokeWidth={1.7} className="text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">Secure Delivery</h3>
                <p className="text-sm text-gray-600 mt-1">Tracked & insured shipments</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <Clock size={24} strokeWidth={1.7} className="text-gray-600 mb-2" />
                <h3 className="font-medium text-gray-900">Fast Processing</h3>
                <p className="text-sm text-gray-600 mt-1">Orders ship within 24 hours</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-medium mb-3">Need Help?</h3>
                <a href="/contact" className="text-sm text-gray-600 hover:text-black block mb-2">Contact Support</a>
                <a href="/returns" className="text-sm text-gray-600 hover:text-black block">Returns & Exchanges</a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}