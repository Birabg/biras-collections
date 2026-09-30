import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

/**
 * Service promises — a quiet reassurance strip.
 * Only claims we can actually honour.
 */
const BENEFITS = [
  {
    icon: Truck,
    title: 'Free delivery over 5,000 ETB',
    body: 'Flat 150 ETB below that, anywhere in Ethiopia.',
  },
  {
    icon: RotateCcw,
    title: '14-day returns',
    body: 'Unworn pieces, original tags, no questions asked.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure checkout',
    body: 'Pay by Telebirr, CBE Birr, Chapa or cash on delivery.',
  },
  {
    icon: Headphones,
    title: 'Real support',
    body: 'Message us and a person replies within a day.',
  },
];

export default function BenefitsStrip() {
  return (
    <section className="border-t border-line" aria-labelledby="benefits-heading">
      <div className="shell py-14 lg:py-20">
        <h2 id="benefits-heading" className="sr-only">
          Why shop with us
        </h2>

        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <benefit.icon size={20} strokeWidth={1.4} className="text-ink" aria-hidden="true" />
              <h3 className="mt-4 text-[0.9375rem] font-medium leading-snug text-ink">
                {benefit.title}
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-60">{benefit.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
