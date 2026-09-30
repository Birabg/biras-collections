import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

/**
 * Newsletter sign-up.
 *
 * There is no mailing-list service, so this validates the address and then says
 * plainly that nothing was stored. Showing a fake "Subscribed!" here would be
 * the one thing a shopper would actually be misled by.
 */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!valid) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="border-t border-line bg-ink text-paper" aria-labelledby="newsletter-heading">
      <div className="shell py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-20">
          <div>
            <p className="t-eyebrow text-paper/45">Stay in the loop</p>
            <h2 id="newsletter-heading" className="t-section mt-4 max-w-md">
              New collections, restocks and private sales
            </h2>
          </div>

          <div className="max-w-md lg:ml-auto lg:w-full">
            {submitted ? (
              <div
                className="flex items-start gap-3 border border-paper/20 bg-paper/5 px-5 py-4"
                role="status"
                aria-live="polite"
              >
                <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-[0.875rem] font-medium">Address accepted</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-paper/70">
                    Our mailing list is not connected yet, so nothing was stored. We&rsquo;ll be
                    honest about that rather than pretend you are subscribed.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} noValidate>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Email address"
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'newsletter-error' : undefined}
                      className="h-13 flex-1 border-b border-paper/30 bg-transparent px-1 text-[0.9375rem] text-paper outline-none transition-colors placeholder:text-paper/35 focus:border-paper"
                    />

                    <button
                      type="submit"
                      className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-paper px-8 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:bg-paper/90"
                    >
                      Subscribe
                      <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>

                  {error && (
                    <p id="newsletter-error" role="alert" className="mt-2 text-[0.8125rem] text-paper">
                      {error}
                    </p>
                  )}
                </form>

                <p className="mt-4 text-[0.75rem] text-paper/45">
                  By subscribing you agree to our{' '}
                  <Link to="/privacy" className="link-underline text-paper/70 hover:text-paper">
                    privacy policy
                  </Link>
                  . Unsubscribe at any time.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
