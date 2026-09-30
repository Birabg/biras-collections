import { useState } from 'react';
import { User, Mail, Phone, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { roleLabel } from '../../auth/roles';

export default function Profile() {
  const { user, roleLabel: currentRoleLabel } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const next = {};
    if (!values.name.trim()) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // No profile API exists. Do not pretend the change was saved.
    toast.error('Profile not connected', {
      message: 'There is no profile service yet, so your changes were not saved.',
    });
  };

  return (
    <div className="shell section-y">
      <header className="max-w-2xl">
        <p className="t-eyebrow text-ink-40">Account</p>
        <h1 className="t-page mt-3">Profile</h1>
        <p className="t-body mt-3">
          The details we hold about you, and how you would like to be contacted.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-5">
          <Input
            label="Full name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            icon={<User size={16} strokeWidth={1.75} />}
            autoComplete="name"
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            icon={<Mail size={16} strokeWidth={1.75} />}
            autoComplete="email"
            hint="Used for order updates and delivery notifications."
          />

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
            icon={<Phone size={16} strokeWidth={1.75} />}
            autoComplete="tel"
            placeholder="+251 …"
            hint="Optional. Used by the courier on delivery day."
          />

          <div className="mt-2">
            <Button type="submit" size="lg">
              Save changes
            </Button>
          </div>
        </form>

        <aside className="border border-line bg-sand p-6 lg:self-start">
          <h2 className="t-eyebrow text-ink-40">Account</h2>

          <dl className="mt-5 flex flex-col gap-4">
            <div>
              <dt className="text-[0.75rem] text-ink-40">Signed in as</dt>
              <dd className="mt-0.5 text-[0.875rem] text-ink">{user?.email}</dd>
            </div>

            <div>
              <dt className="text-[0.75rem] text-ink-40">Role</dt>
              <dd className="mt-0.5 flex items-center gap-2 text-[0.875rem] text-ink">
                <ShieldCheck size={14} strokeWidth={1.75} className="text-ink-40" aria-hidden="true" />
                {currentRoleLabel ?? roleLabel(user?.role)}
              </dd>
            </div>
          </dl>

          <p className="mt-6 border-t border-line pt-5 text-[0.75rem] leading-relaxed text-ink-40">
            Your role is read from the session. It is a display value only — the server authorises
            every request independently.
          </p>
        </aside>
      </div>
    </div>
  );
}
