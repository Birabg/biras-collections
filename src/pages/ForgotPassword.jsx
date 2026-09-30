import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../auth/AuthContext';
import { authErrorCopy } from '../auth/authMessages';

const ASIDE = {
  image:
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1400&q=80',
  quote: 'We will get you back in.',
  caption: 'Account recovery',
};

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(undefined);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setIsSent(true);
    } catch (caught) {
      // Deliberately generic: never confirm or deny whether the account exists
      setError(authErrorCopy(caught).body);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address on your account and we will send you a reset link."
      aside={ASIDE}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-ink transition-colors hover:text-ink-60"
        >
          <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
          Back to sign in
        </Link>
      }
    >
      <DemoBackendNotice className="mb-8" />

      {isSent ? (
        <div
          className="border border-success/25 bg-success-soft px-5 py-6"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={22} strokeWidth={1.5} className="text-success" aria-hidden="true" />
          <h2 className="mt-4 text-[0.9375rem] font-medium text-ink">Check your inbox</h2>
          <p className="t-body mt-2">
            If an account exists for <span className="text-ink">{email}</span>, a password reset link
            is on its way. The link can only be used once.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => setIsSent(false)}>
              Use a different email
            </Button>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-ink-60"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(undefined);
            }}
            error={error}
            icon={<Mail size={16} strokeWidth={1.75} />}
            placeholder="you@example.com"
            required
          />

          <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
            {isSubmitting ? 'Sending link' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
