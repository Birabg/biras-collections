import { Link } from 'react-router-dom';
import { useState, useId } from 'react';
import { Search, Plus, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const CATEGORIES = [
  { id: 'all', label: 'All questions' },
  { id: 'orders', label: 'Orders and payment' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'returns', label: 'Returns' },
  { id: 'account', label: 'Account' },
];

const FAQS = [
  {
    category: 'orders',
    q: 'How do I place an order?',
    a: 'Add pieces to your bag, continue to checkout, and fill in your contact and delivery details. Choose a payment method and review before submitting.',
  },
  {
    category: 'orders',
    q: 'Which payment methods are available?',
    a: 'Telebirr, CBE Birr, Chapa, and cash on delivery are the options we plan to support. No payment gateway is connected to this demo, so nothing is actually charged.',
  },
  {
    category: 'orders',
    q: 'Can I change or cancel an order?',
    a: 'Contact us as soon as possible and we will do what we can. Once a parcel is with the courier, changes are usually no longer possible.',
  },
  {
    category: 'orders',
    q: 'Are my card details stored?',
    a: 'No card details are ever entered or stored on this site. In production, payment would be handled entirely by the gateway, so card data would never touch our servers.',
  },
  {
    category: 'shipping',
    q: 'How long does delivery take?',
    a: 'Addis Ababa 2 to 3 business days, other cities 3 to 5, and remote areas 5 to 7. See the shipping page for the full breakdown.',
  },
  {
    category: 'shipping',
    q: 'Is delivery free?',
    a: 'Delivery is free on orders over 5,000 ETB. Below that a flat 150 ETB fee is added at checkout.',
  },
  {
    category: 'shipping',
    q: 'Can I change my delivery address?',
    a: 'Tell us within an hour of ordering. After that the parcel is usually already out for delivery.',
  },
  {
    category: 'returns',
    q: 'What is your return policy?',
    a: '30 days from delivery, on unworn and unwashed pieces with the original tags. Returns are free above 5,000 ETB, otherwise 150 ETB is deducted from the refund.',
  },
  {
    category: 'returns',
    q: 'How do I start a return?',
    a: 'Message us with your order number and the pieces involved. We send a return reference and the nearest drop-off point.',
  },
  {
    category: 'returns',
    q: 'Can I exchange for a different size?',
    a: 'Yes, at no extra charge. We dispatch the replacement as soon as the original arrives and passes inspection.',
  },
  {
    category: 'account',
    q: 'Do I need an account to order?',
    a: 'No. You can check out as a guest. An account simply keeps your order history and addresses in one place.',
  },
  {
    category: 'account',
    q: 'How do I reset my password?',
    a: 'Use the forgot-password link on the sign-in page. In this demo, no email is actually sent, so the reset flow runs entirely in your browser.',
  },
  {
    category: 'account',
    q: 'What happens to my data?',
    a: 'In this demo everything is stored in your own browser and never leaves your device. The privacy page explains what a real deployment would need to do.',
  },
];

const RELATED_LINKS = [
  { label: 'Shipping and delivery', to: '/shipping' },
  { label: 'Returns and exchanges', to: '/returns' },
  { label: 'Privacy', to: '/privacy' },
];

function FaqRow({ question, answer }) {
  const panelId = useId();

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left marker:hidden">
        <span className="text-[0.9375rem] text-ink">{question}</span>
        <Plus
          size={16}
          strokeWidth={1.6}
          className="shrink-0 text-ink-40 transition-transform duration-200 group-open:rotate-45"
          aria-hidden="true"
        />
      </summary>
      <p id={panelId} className="t-body -mt-1 max-w-2xl pb-5 text-[0.875rem]">
        {answer}
      </p>
    </details>
  );
}

export default function FAQ() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const normalisedQuery = query.trim().toLowerCase();

  const visibleFaqs = FAQS.filter((faq) => {
    if (category !== 'all' && faq.category !== category) return false;
    if (!normalisedQuery) return true;
    return (
      faq.q.toLowerCase().includes(normalisedQuery) ||
      faq.a.toLowerCase().includes(normalisedQuery)
    );
  });

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <p className="t-eyebrow text-ink-40">Help</p>
          <h1 className="t-page mt-3">Frequently asked questions</h1>
          <p className="t-body mt-4 max-w-2xl text-[0.9375rem]">
            Short answers about ordering, delivery, returns, and your account.
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div>
              <label htmlFor="faq-search" className="t-eyebrow text-ink-40">
                Search
              </label>
              <div className="mt-3">
                <Input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search questions"
                  icon={<Search size={15} strokeWidth={1.7} />}
                />
              </div>
            </div>

            <nav aria-label="Question categories" className="mt-8">
              <h2 className="t-eyebrow text-ink-40">Browse by topic</h2>
              <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
                {CATEGORIES.map((item) => {
                  const isActive = item.id === category;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setCategory(item.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`w-full px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                          isActive
                            ? 'bg-sand text-ink'
                            : 'text-ink-60 hover:bg-sand/60 hover:text-ink'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <p className="t-caption" role="status" aria-live="polite">
              {visibleFaqs.length === 0
                ? 'No matching questions'
                : `${visibleFaqs.length} question${visibleFaqs.length === 1 ? '' : 's'}`}
            </p>

            {visibleFaqs.length === 0 ? (
              <div className="mt-6 border border-line p-8 text-center">
                <Search
                  size={22}
                  strokeWidth={1.5}
                  className="mx-auto text-ink-25"
                  aria-hidden="true"
                />
                <h2 className="t-section mt-4 !text-lg">Nothing matched that search</h2>
                <p className="t-body mx-auto mt-2 max-w-sm text-[0.875rem]">
                  Try a different word, or clear the topic filter to see every question.
                </p>
                <Button
                  className="mt-6"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                  }}
                >
                  Show all questions
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col divide-y divide-line border-y border-line">
                {visibleFaqs.map((faq) => (
                  <FaqRow key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
            )}

            <div className="mt-10 border-t border-line pt-8">
              <h2 className="t-section !text-lg">Not answered here?</h2>
              <p className="t-body mt-2 max-w-lg text-[0.875rem]">
                Write to us and we will reply within one business day.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-1.5 text-[0.875rem] text-ink transition-colors"
                >
                  Contact support
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                {RELATED_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[0.875rem] text-ink-60 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
