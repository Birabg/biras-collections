import { ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const faqCategories = [
  { id: 'all', label: 'All Questions' },
  { id: 'orders', label: 'Orders & Payments' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Exchanges' },
  { id: 'account', label: 'Account & Privacy' },
];

const faqs = [
  { category: 'orders', q: 'How do I place an order?', a: 'Browse our collection, add items to your bag, proceed to checkout, fill in your details, choose a payment method, and confirm your order. You\'ll receive an order confirmation via email and SMS.' },
  { category: 'orders', q: 'What payment methods do you accept?', a: 'We accept Telebirr, Chapa (cards, bank transfers, mobile money), CBE Birr, and Cash on Delivery for orders within Addis Ababa.' },
  { category: 'orders', q: 'Can I modify or cancel my order?', a: 'You can modify or cancel your order within 1 hour of placing it. After that, the order enters processing and changes may not be possible. Contact support for assistance.' },
  { category: 'orders', q: 'Do you offer gift cards?', a: 'Yes! Digital gift cards are available in denominations of 500, 1,000, 2,500, and 5,000 ETB. They never expire and can be used online or in-store.' },
  { category: 'shipping', q: 'How long does delivery take?', a: 'Addis Ababa: 2-3 business days. Other major cities: 3-5 business days. Remote areas: 5-7 business days. You\'ll receive tracking info via SMS and email.' },
  { category: 'shipping', q: 'Do you offer free delivery?', a: 'Yes! Free delivery on all orders over 5,000 ETB. Orders below this amount have a 150 ETB delivery fee.' },
  { category: 'shipping', q: 'Can I change my delivery address?', a: 'Contact us within 1 hour of placing your order. After processing begins, address changes may not be possible.' },
  { category: 'shipping', q: 'What if I\'m not home during delivery?', a: 'Our courier will call you. If unreachable, they\'ll leave a note and attempt re-delivery the next business day. After 3 attempts, the package returns to us.' },
  { category: 'returns', q: 'What is your return policy?', a: '30-day returns on unworn, unwashed items with original tags. Free return shipping on orders over 5,000 ETB (150 ETB fee for orders below). Refunds processed in 5-7 business days.' },
  { category: 'returns', q: 'How do I start a return?', a: 'Log into your account, go to My Orders, select the order, and click "Return Items". Choose items and reason, print the label, and drop off at any courier location.' },
  { category: 'returns', q: 'Can I exchange for a different size?', a: 'Yes! Select "Exchange" when starting your return, choose the new size/color, and we\'ll ship the replacement immediately upon receiving your return - no extra charge.' },
  { category: 'returns', q: 'What items cannot be returned?', a: 'Underwear, socks, swimwear (without liner), personalized items, gift cards, final sale items, and beauty products with broken seals cannot be returned for hygiene reasons.' },
  { category: 'account', q: 'How do I create an account?', a: 'Click "Sign In" then "Create Account". Fill in your details and verify your email. You can also checkout as a guest and create an account later.' },
  { category: 'account', q: 'How do I reset my password?', a: 'Click "Forgot Password" on the sign-in page, enter your email, and follow the reset link sent to your inbox.' },
  { category: 'account', q: 'Is my personal information secure?', a: 'Yes. We use industry-standard encryption and never store full payment details. See our Privacy Policy for details on data handling.' },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-medium tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-2 text-gray-500">Quick answers to common questions</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 lg:sticky lg:top-24 self-start">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full h-11 pl-12 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  aria-label="Search FAQ"
                />
              </div>

              <nav aria-label="FAQ Categories">
                <ul className="space-y-1">
                  {faqCategories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Still need help?</p>
                <Link to="/contact" className="block w-full h-11 flex items-center justify-center gap-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {filteredFAQs.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-medium text-gray-900">No questions found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredFAQs.map((faq, idx) => (
                    <details
                      key={idx}
                      className="group"
                      open={expandedItems.has(idx)}
                      onToggle={() => toggleItem(idx)}
                    >
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
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500">Didn't find what you're looking for?</p>
              <Link to="/contact" className="mt-2 inline-flex items-center gap-2 text-black hover:underline font-medium">
                Contact our support team
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}