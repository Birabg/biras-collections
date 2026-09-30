import { Link } from 'react-router-dom';
import { Truck, Clock, MapPin, Package, ChevronDown, ArrowRight } from 'lucide-react';

const DELIVERY_OPTIONS = [
  {
    icon: Truck,
    title: 'Free over 5,000 ETB',
    body: 'Orders above 5,000 ETB ship free. Below that a flat 150 ETB delivery fee applies, shown before you pay.',
  },
  {
    icon: Clock,
    title: 'Two to seven business days',
    body: 'Addis Ababa is typically 2 to 3 business days. Other cities 3 to 5, and remote areas 5 to 7.',
  },
  {
    icon: MapPin,
    title: 'Nationwide coverage',
    body: 'We deliver to all of Ethiopia, including regional states, Dire Dawa, and Harari. International shipping is not yet available.',
  },
  {
    icon: Package,
    title: 'Tracked from dispatch',
    body: 'Once a parcel leaves our studio you get a tracking reference by SMS and email, and can follow it from your account.',
  },
];

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Addis Ababa 2 to 3 business days, other cities 3 to 5, and remote areas 5 to 7. These are estimates, so a courier delay can occasionally add a day.',
  },
  {
    q: 'Can I change my delivery address after ordering?',
    a: 'Tell us within an hour of ordering and we will try to update it. After that the parcel is usually already with the courier.',
  },
  {
    q: 'What if I am not home at delivery?',
    a: 'The courier will call the number on your order. If we cannot reach you they leave a note and attempt again the next business day.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Not yet. We deliver within Ethiopia only, and international shipping is planned for a future season.',
  },
];

const RELATED_LINKS = [
  { label: 'Returns and exchanges', to: '/returns' },
  { label: 'Common questions', to: '/faq' },
  { label: 'Contact support', to: '/contact' },
];

export default function Shipping() {
  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <p className="t-eyebrow text-ink-40">Help</p>
          <h1 className="t-page mt-3">Shipping and delivery</h1>
          <p className="t-body mt-4 max-w-2xl text-[0.9375rem]">
            How your order travels from our studio in Addis Ababa to your door, and what to expect
            along the way.
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <section>
              <h2 className="t-section !text-xl">Delivery at a glance</h2>

              <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <div key={option.title} className="bg-paper p-6">
                    <span className="flex size-9 items-center justify-center border border-line text-ink-40">
                      <option.icon size={16} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[0.9375rem] font-medium text-ink">{option.title}</h3>
                    <p className="t-body mt-2 text-[0.875rem]">{option.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-14">
              <h2 className="t-section !text-xl">Common delivery questions</h2>

              <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left marker:hidden">
                      <span className="text-[0.9375rem] text-ink">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        strokeWidth={1.6}
                        className="shrink-0 text-ink-40 transition-transform duration-200 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="t-body -mt-1 pb-5 text-[0.875rem]">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Still deciding?</h2>
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
