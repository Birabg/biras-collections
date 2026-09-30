import { Link } from 'react-router-dom';
import { RotateCcw, Clock, Check, X, ArrowRight } from 'lucide-react';

const POLICY_POINTS = [
  {
    title: '30 days from delivery',
    body: 'Return anything within 30 days of receiving it, unworn and unwashed, with the original tags still attached.',
  },
  {
    title: 'Free returns over 5,000 ETB',
    body: 'Return shipping is free above 5,000 ETB. Below that, 150 ETB is deducted from your refund.',
  },
  {
    title: 'Exchanges at no extra cost',
    body: 'Need a different size or colour? Swap it for the same piece at no charge. We send the replacement as soon as your return arrives.',
  },
  {
    title: 'Refunds within 5 to 7 business days',
    body: 'Once we receive and check the return, the refund goes back to your original payment method.',
  },
];

const STEPS = [
  { title: 'Contact us', body: 'Message us within 30 days of delivery and tell us which pieces you are returning and why.' },
  { title: 'Get a return reference', body: 'We send a return reference and the nearest drop-off point. A printed label is included.' },
  { title: 'Hand the parcel over', body: 'Pack items in their original packaging where you can, and drop off at the courier location.' },
  { title: 'We inspect and refund', body: 'We check the return on arrival and process your refund within 5 to 7 business days.' },
];

const EXCHANGES = [
  'Tell us you would like an exchange rather than a refund.',
  'Confirm the size or colour you want instead.',
  'We ship the replacement as soon as the return is checked.',
  'No additional shipping charge.',
];

const NON_RETURNABLE = [
  'Underwear, socks, and other intimate apparel',
  'Personalised or made-to-order pieces',
  'Gift cards',
  'Items marked final sale',
  'Swimwear without its hygiene liner intact',
  'Beauty products with a broken seal',
];

const RELATED_LINKS = [
  { label: 'Shipping and delivery', to: '/shipping' },
  { label: 'Common questions', to: '/faq' },
  { label: 'Contact support', to: '/contact' },
];

export default function Returns() {
  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <p className="t-eyebrow text-ink-40">Help</p>
          <h1 className="t-page mt-3">Returns and exchanges</h1>
          <p className="t-body mt-4 max-w-2xl text-[0.9375rem]">
            Thirty days to change your mind, free returns on larger orders, and exchanges at no extra
            cost.
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <section>
              <h2 className="t-section !text-xl">Our policy</h2>

              <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
                {POLICY_POINTS.map((point) => (
                  <div key={point.title} className="bg-paper p-6">
                    <h3 className="text-[0.9375rem] font-medium text-ink">{point.title}</h3>
                    <p className="t-body mt-2 text-[0.875rem]">{point.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-14">
              <h2 className="t-section !text-xl">How to return something</h2>

              <ol className="mt-6 flex flex-col">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-5 border-l border-line pb-8 pl-6 last:border-transparent last:pb-0">
                    <span
                      className="-ml-[1.6875rem] flex size-7 shrink-0 items-center justify-center border border-ink text-[0.6875rem] tabular-nums text-ink"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <h3 className="text-[0.9375rem] font-medium text-ink">{step.title}</h3>
                      <p className="t-body mt-1.5 text-[0.875rem]">{step.body}</p>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-14">
              <h2 className="t-section !text-xl">Exchanging a size or colour</h2>
              <ul className="mt-6 flex flex-col gap-3">
                {EXCHANGES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.875rem] text-ink-60">
                    <Check
                      size={15}
                      strokeWidth={1.9}
                      className="mt-0.5 shrink-0 text-ink"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-14">
              <h2 className="t-section !text-xl">What cannot be returned</h2>
              <p className="t-body mt-3 max-w-2xl text-[0.875rem]">
                For hygiene and customisation reasons, these items are not eligible for return or
                exchange.
              </p>
              <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
                {NON_RETURNABLE.map((item) => (
                  <li key={item} className="flex items-start gap-3 py-3.5 text-[0.875rem] text-ink-60">
                    <X
                      size={15}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0 text-ink-25"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Start a return</h2>
              <p className="t-body mt-3 text-[0.8125rem]">
                Open the order in your account and message us from there, or write to us directly.
              </p>

              <Link
                to="/account/orders"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-ink bg-ink px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
                View your orders
              </Link>

              <p className="t-caption mt-4 flex items-start gap-2 text-ink-40">
                <Clock size={12} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                Requests are handled within one business day.
              </p>
            </div>

            <div className="mt-6 border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Related</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {RELATED_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-[0.875rem] text-ink-60 transition-colors hover:text-ink"
                    >
                      {link.label}
                      <ArrowRight
                        size={13}
                        strokeWidth={1.75}
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
