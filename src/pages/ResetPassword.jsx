import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../auth/AuthContext';
import { authErrorCopy } from '../auth/authMessages';

const ASIDE = {
  image:
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80',
  quote: 'Almost there.',
  caption: 'Choose a new password',
};

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // A real deployment receives a signed token in the URL.
  const token = searchParams.get('token') ?? '';

  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (values.password.length < 8) next.password = 'Use at least 8 characters.';
    if (values.password !== values.confirmPassword)
      next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password: values.password });
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (caught) {
      setFormError(authErrorCopy(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you have not used before."
      aside={ASIDE}
      footer={
        <Link
          to="/login"
          className="text-[0.8125rem] font-medium text-ink transition-colors hover:text-ink-60"
        >
          Back to sign in
        </Link>
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
          label="New password"
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
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<ShieldCheck size={16} strokeWidth={1.75} />}
          placeholder="Repeat password"
          required
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          {isSubmitting ? 'Updating password' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
