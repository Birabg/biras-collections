import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth, SESSION } from '../auth/AuthContext';
import { authErrorCopy } from '../auth/authMessages';

const ASIDE = {
  image:
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
  quote: 'Your account, your wardrobe, your pace.',
  caption: 'Members save favourites for later',
};

export default function Register() {
  const { register, status } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === SESSION.AUTHENTICATED) navigate('/account', { replace: true });
  }, [status, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setFormError(null);
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Enter your name.';
    if (!values.email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Choose a password.';
    else if (values.password.length < 8) next.password = 'Use at least 8 characters.';
    if (values.confirmPassword !== values.password)
      next.confirmPassword = 'Passwords do not match.';
    if (!acceptedTerms) next.terms = 'Please accept the terms to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        acceptedTerms,
      });
      navigate('/account', { replace: true });
    } catch (error) {
      setFormError(authErrorCopy(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Save your favourites, follow your orders and check out faster."
      aside={ASIDE}
      footer={
        <p className="t-body text-center">
          Already have an account?{' '}
          <Link to="/login" className="link-underline font-medium text-ink">
            Sign in
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
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          icon={<User size={16} strokeWidth={1.75} />}
          placeholder="Your name"
          required
        />

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

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock size={16} strokeWidth={1.75} />}
            placeholder="8+ characters"
            hint="At least 8 characters."
            required
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={<Lock size={16} strokeWidth={1.75} />}
            placeholder="Repeat password"
            required
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              className="mt-0.5 size-4 shrink-0 accent-ink"
              aria-invalid={errors.terms ? 'true' : undefined}
              aria-describedby={errors.terms ? 'terms-error' : undefined}
            />
            <span className="t-caption leading-relaxed">
              I agree to the terms of service and privacy policy, and would like to receive news
              about new collections.
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-1.5 text-[0.8125rem] text-error" role="alert">
              {errors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          iconLeft={!isSubmitting ? <UserPlus size={15} strokeWidth={2} /> : null}
          className="mt-2"
        >
          {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
