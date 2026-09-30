import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Mail } from 'lucide-react';

const SHOP_LINKS = [
  { label: 'Women', to: '/shop?category=women' },
  { label: 'Men', to: '/shop?category=men' },
  { label: 'Accessories', to: '/shop?category=accessories' },
  { label: 'New Arrivals', to: '/shop?new=true' },
  { label: 'All products', to: '/shop' },
];

const HELP_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'Shipping', to: '/shipping' },
  { label: 'Returns', to: '/returns' },
  { label: 'FAQ', to: '/faq' },
];

const COMPANY_LINKS = [
  { label: 'Our story', to: '/about' },
  { label: 'Sustainability', to: '/about' },
  { label: 'Privacy policy', to: '/privacy' },
  { label: 'Terms of service', to: '/terms' },
];

const PAYMENT_LABELS = ['Telebirr', 'CBE Birr', 'Chapa', 'Bank transfer', 'Cash on delivery'];

function LinkColumn({ title, links }) {
  return (
    <div>
      <h3 className="t-eyebrow text-paper/40">{title}</h3>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="link-underline text-[0.8125rem] text-paper/80 transition-colors duration-200 hover:text-paper"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Newsletter.
 * There is no mailing-list API, so the form validates the address and then
 * states plainly that nothing was submitted rather than faking a subscription.
 */
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | invalid | done

  const handleSubmit = (event) => {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!valid) {
      setState('invalid');
      return;
    }

    // No endpoint exists. Be honest instead of showing a false confirmation.
    setState('done');
    setEmail('');
  };

  return (
    <div className="max-w-sm">
      <h3 className="t-eyebrow text-paper/40">Newsletter</h3>
      <p className="mt-5 text-[0.875rem] leading-relaxed text-paper/70">
        New collections, restocks and private sales — a few times a month at most.
      </p>

      {state === 'done' ? (
        <div
          className="mt-6 flex items-start gap-3 border border-paper/20 bg-paper/5 px-4 py-3"
          role="status"
        >
          <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-paper" aria-hidden="true" />
          <p className="text-[0.8125rem] leading-relaxed text-paper/80">
            <span className="font-medium text-paper">Address accepted.</span> Our mailing list is
            not connected yet, so nothing was stored. Check back once the service is live.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6">
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <div className="flex items-stretch border-b border-paper/30 focus-within:border-paper">
            <span className="flex items-center pr-3 text-paper/40" aria-hidden="true">
              <Mail size={15} strokeWidth={1.75} />
            </span>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (state === 'invalid') setState('idle');
              }}
              placeholder="Email address"
              aria-invalid={state === 'invalid' ? 'true' : undefined}
              aria-describedby={state === 'invalid' ? 'footer-email-error' : undefined}
              className="h-11 min-w-0 flex-1 bg-transparent text-[0.875rem] text-paper outline-none placeholder:text-paper/35"
            />
            <button
              type="submit"
              className="flex h-11 shrink-0 items-center gap-2 pl-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-70"
            >
              Join
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {state === 'invalid' && (
            <p id="footer-email-error" role="alert" className="mt-2 text-[0.8125rem] text-paper">
              Enter a valid email address.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-paper" role="contentinfo">
      <div className="mx-auto max-w-[90rem] px-5 py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl leading-tight">
              Bira&rsquo;s <span className="italic">Collections</span>
            </p>
            <p className="mt-5 max-w-xs text-[0.875rem] leading-relaxed text-paper/70">
              Considered womenswear, menswear and accessories, made in small runs and delivered across
              Ethiopia.
            </p>

            <div className="mt-8">
              <NewsletterForm />
            </div>
          </div>

          <LinkColumn title="Shop" links={SHOP_LINKS} />
          <LinkColumn title="Help" links={HELP_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-16 border-t border-paper/15 pt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="t-caption text-paper/45">
              &copy; 2026 Bira&rsquo;s Collections. All rights reserved.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Accepted payment methods">
                {PAYMENT_LABELS.map((label) => (
                  <li key={label} className="t-caption text-paper/40">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
