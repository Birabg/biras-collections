import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth, SESSION } from '../auth/AuthContext';
import { authErrorCopy } from '../auth/authMessages';
import { DEMO_ACCOUNTS, DEMO_CREDENTIALS } from '../auth/authService';

const ASIDE = {
  image:
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
  quote: 'Quiet luxury, made for every day.',
  caption: 'New season arrivals',
};

export default function Login() {
  const { login, status, sessionExpired: _sessionExpired, isDemoBackend } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isCheckingSession = status === SESSION.LOADING;

  // Send signed-in visitors away from /login
  useEffect(() => {
    if (status === SESSION.AUTHENTICATED) {
      const intended = location.state?.from;
      navigate(intended?.pathname ?? '/account', { replace: true });
    }
  }, [status, location.state, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setFormError(null);
  };

  const validate = () => {
    const next = {};
    if (!values.email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isCheckingSession) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await login({ email: values.email.trim(), password: values.password });
      const intended = location.state?.from;
      navigate(intended?.pathname ?? '/account', { replace: true });
    } catch (error) {
      // Never surface a raw backend message
      setFormError(authErrorCopy(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (email) => {
    setValues({ email, password: DEMO_CREDENTIALS.password });
    setErrors({});
    setFormError(null);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to view your orders, saved pieces and addresses."
      aside={ASIDE}
      footer={
        <p className="t-body text-center">
          New to Bira&rsquo;s?{' '}
          <Link to="/register" className="link-underline font-medium text-ink">
            Create an account
          </Link>
        </p>
      }
    >
      <DemoBackendNotice className="mb-8" />

      {formError && (
        <div
          className="mb-6 border border-error/25 bg-error-soft px-4 py-3"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-[0.875rem] font-medium text-ink">{formError.title}</p>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-60">{formError.body}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          icon={<Mail size={16} strokeWidth={1.75} />}
          placeholder="you@example.com"
          required
        />

        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock size={16} strokeWidth={1.75} />}
            placeholder="Your password"
            className="pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-[3.1rem] -translate-y-1/2 text-ink-40 transition-colors hover:text-ink"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff size={17} strokeWidth={1.75} />
            ) : (
              <Eye size={17} strokeWidth={1.75} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="t-caption">Use the demo accounts below</span>
          <Link
            to="/forgot-password"
            className="link-underline text-[0.8125rem] font-medium text-ink transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isCheckingSession}
          iconLeft={!isSubmitting ? <LogIn size={15} strokeWidth={2} /> : null}
          className="mt-2"
        >
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      {isDemoBackend && (
        <div className="mt-10 border-t border-line pt-8">
          <h2 className="t-eyebrow text-ink-40">Demonstration accounts</h2>
          <p className="t-caption mt-2">
            Each account shows a different actor. Password for all:{' '}
            <code className="text-ink">{DEMO_CREDENTIALS.password}</code>
          </p>
          <ul className="mt-5 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="flex w-full items-center justify-between gap-4 border border-line px-4 py-3 text-left transition-colors hover:border-ink hover:bg-sand"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium capitalize text-ink">
                      {account.role}
                    </span>
                    <span className="block truncate text-[0.75rem] text-ink-40">{account.email}</span>
                  </span>
                  <span className="t-eyebrow shrink-0 text-ink-25">Use</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthLayout>
  );
}
