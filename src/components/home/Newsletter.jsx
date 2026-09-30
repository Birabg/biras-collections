import { useState } from 'react';
import { useToast } from '../../components/ui/Toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const toast = useToast();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error('Invalid email', { message: 'Please enter a valid email address' });
      return;
    }

    setStatus('submitting');

    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      toast.success('Subscribed!', { message: 'Thanks for joining our community' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <section className="border-t border-gray-100 px-5 py-20 text-center" aria-labelledby="newsletter-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Stay in the loop
      </p>

      <h2 id="newsletter-heading" className="mt-3 text-3xl font-medium tracking-tight">
        Join the Bira's Collections community
      </h2>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
        Get updates about new collections, exclusive offers, and special
        releases.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          disabled={status === 'submitting' || status === 'success'}
          className="h-12 flex-1 border border-gray-200 px-4 text-sm outline-none focus:border-black disabled:bg-gray-50 disabled:cursor-not-allowed"
          aria-describedby="newsletter-hint"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success' || !email}
          className="h-12 bg-black px-7 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Subscribing...
            </span>
          ) : status === 'success' ? (
            'Subscribed!'
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      <p id="newsletter-hint" className="mt-3 text-xs text-gray-400">
        By subscribing, you agree to our <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
      </p>
    </section>
  );
}