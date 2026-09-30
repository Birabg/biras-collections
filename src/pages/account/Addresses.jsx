import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const REGIONS = [
  'Addis Ababa',
  'Amhara',
  'Oromia',
  'Tigray',
  'Sidama',
  'Southern Nations',
  'Benishangul-Gumuz',
  'Gambella',
  'Harari',
  'Dire Dawa',
];

export default function Addresses() {
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [values, setValues] = useState({
    label: '',
    recipient: '',
    phone: '',
    line1: '',
    city: '',
    region: '',
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
    if (!values.recipient.trim()) next.recipient = 'Enter a recipient name.';
    if (!values.phone.trim()) next.phone = 'Enter a contact number.';
    if (!values.line1.trim()) next.line1 = 'Enter the street or house description.';
    if (!values.city.trim()) next.city = 'Enter a city.';
    if (!values.region) next.region = 'Choose a region.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // No address book API exists yet.
    toast.error('Addresses not connected', {
      message: 'There is no address service yet, so nothing was saved.',
    });
    setIsAdding(false);
  };

  return (
    <div className="shell section-y">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="t-eyebrow text-ink-40">Account</p>
          <h1 className="t-page mt-3">Addresses</h1>
          <p className="t-body mt-3">Saved delivery addresses for faster checkout.</p>
        </div>

        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} iconLeft={<Plus size={15} strokeWidth={2} />}>
            Add address
          </Button>
        )}
      </header>

      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-12 max-w-2xl border border-line p-6 sm:p-8"
        >
          <h2 className="t-section !text-xl">New address</h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Input
              label="Label"
              name="label"
              value={values.label}
              onChange={handleChange}
              placeholder="Home, Office…"
              hint="Optional."
            />
            <Input
              label="Recipient"
              name="recipient"
              value={values.recipient}
              onChange={handleChange}
              error={errors.recipient}
              autoComplete="name"
              required
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              autoComplete="tel"
              placeholder="+251 …"
              required
            />
            <Select
              label="Region"
              name="region"
              value={values.region}
              onChange={handleChange}
              error={errors.region}
              required
            >
              <option value="">Choose a region</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>

            <div className="sm:col-span-2">
              <Input
                label="Street address"
                name="line1"
                value={values.line1}
                onChange={handleChange}
                error={errors.line1}
                placeholder="Bole Sub-city, Woreda 03, House 12"
                autoComplete="street-address"
                required
              />
            </div>

            <Input
              label="City"
              name="city"
              value={values.city}
              onChange={handleChange}
              error={errors.city}
              autoComplete="address-level2"
              required
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg">
              Save address
            </Button>
            <Button type="button" size="lg" variant="tertiary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add an address and we can use it as your default at checkout."
          actionLabel="Add your first address"
          onAction={() => setIsAdding(true)}
          className="mt-8 border border-line"
        />
      )}
    </div>
  );
}
