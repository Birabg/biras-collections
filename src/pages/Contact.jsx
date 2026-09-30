import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';

const EMPTY_FORM = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const SUBJECTS = [
  'Order inquiry',
  'Shipping question',
  'Return or exchange',
  'Product question',
  'Website feedback',
  'Other',
];

const CONTACT_DETAILS = [
  { icon: Mail, label: 'Email', value: 'support@birascollections.com', href: 'mailto:support@birascollections.com' },
  { icon: Phone, label: 'Phone', value: '+251 911 234 567', href: 'tel:+251911234567' },
  { icon: MapPin, label: 'Showroom', value: 'Bole Sub-city, Addis Ababa, Ethiopia', href: null },
  { icon: Clock, label: 'Hours', value: 'Monday to Saturday, 9:00 – 19:00', href: null },
];

const HELP_LINKS = [
  { label: 'Shipping information', to: '/shipping' },
  { label: 'Returns and exchanges', to: '/returns' },
  { label: 'Common questions', to: '/faq' },
];

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required';
    if (!form.message.trim()) {
      nextErrors.message = 'Message is required';
    } else if (form.message.trim().length < 10) {
      nextErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    /*
     * No mail transport is connected. Rather than show a fake "message sent"
     * toast, confirm the form validated and tell the reader plainly that
     * nothing was transmitted — and that email is the only real channel.
     */
    setSent(true);
  };

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <p className="t-eyebrow text-ink-40">Help</p>
          <h1 className="t-page mt-3">Contact us</h1>
          <p className="t-body mt-4 max-w-2xl text-[0.9375rem]">
            Questions about sizing, an order, or a piece you have seen? Send a note and we will
            reply within one business day.
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:order-1">
            <h2 className="t-eyebrow text-ink-40">Reach us directly</h2>

            <ul className="mt-5 flex flex-col divide-y divide-line border-y border-line">
              {CONTACT_DETAILS.map((detail) => {
                const body = (
                  <>
                    <span className="flex size-9 shrink-0 items-center justify-center border border-line text-ink-40">
                      <detail.icon size={16} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.8125rem] text-ink-40">{detail.label}</span>
                      <span className="mt-0.5 block text-[0.875rem] text-ink">{detail.value}</span>
                    </span>
                  </>
                );

                return (
                  <li key={detail.label} className="py-4">
                    {detail.href ? (
                      <a
                        href={detail.href}
                        className="flex items-start gap-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        {body}
                      </a>
                    ) : (
                      <span className="flex items-start gap-4">{body}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8">
              <h2 className="t-eyebrow text-ink-40">Helpful pages</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {HELP_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[0.875rem] text-ink-60 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-w-0 lg:order-2">
            <div className="mb-8">
              <DemoBackendNotice
                title="This form is not connected"
                body="There is no mail service behind it. You can compose and validate a message, but nothing is transmitted or stored — please email or call us instead."
              />
            </div>

            <h2 className="t-section !text-xl">Send a message</h2>

            {sent ? (
              <div
                className="mt-6 border border-line bg-sand/50 p-6"
                role="status"
                aria-live="polite"
              >
                <p className="flex items-start gap-2 text-[0.875rem] text-ink">
                  <Info size={15} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Your message is valid, but it was not sent — there is no mail service connected
                    to this form.
                  </span>
                </p>
                <p className="mt-3 text-[0.875rem] text-ink-60">
                  Email{' '}
                  <a
                    href="mailto:support@birascollections.com"
                    className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    support@birascollections.com
                  </a>{' '}
                  or call{' '}
                  <a
                    href="tel:+251911234567"
                    className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    +251 911 234 567
                  </a>
                  , Monday to Saturday, 9:00 – 19:00.
                </p>
                <Button
                  className="mt-6"
                  variant="secondary"
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setSent(false);
                  }}
                >
                  Write another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    autoComplete="name"
                    required
                  />
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />
                </div>

                <Select
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  required
                >
                  <option value="">Choose a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label="Message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  error={errors.message}
                  rows={6}
                  hint="The more detail you give, the faster we can help."
                  placeholder="Tell us what you need help with."
                  required
                />

                <div>
                  <Button
                    type="submit"
                    iconLeft={<Send size={15} strokeWidth={1.8} aria-hidden="true" />}
                  >
                    Review message
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
