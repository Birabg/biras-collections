import { useState } from 'react';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useAddresses } from '../../context/AddressesContext';
import { useAuth } from '../../auth/AuthContext';

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
  const { addresses, isLoaded, addAddress, updateAddress, removeAddress, setDefault } = useAddresses();
  const { user: _user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState({
    fullName: '',
    phone: '',
    line1: '',
    city: '',
    subCity: '',
    region: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const resetForm = () => {
    setValues({
      fullName: '',
      phone: '',
      line1: '',
      city: '',
      subCity: '',
      region: '',
      isDefault: false,
    });
    setErrors({});
    setEditingId(null);
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const startEdit = (address) => {
    setValues({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.streetAddress,
      city: address.city,
      subCity: address.subCity,
      region: address.region,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (!values.fullName.trim()) next.fullName = 'Enter a recipient name.';
    if (!values.phone.trim()) next.phone = 'Enter a contact number.';
    if (!values.line1.trim()) next.line1 = 'Enter the street or house description.';
    if (!values.city.trim()) next.city = 'Enter a city.';
    if (!values.subCity.trim()) next.subCity = 'Enter a sub-city.';
    if (!values.region) next.region = 'Choose a region.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      if (editingId) {
        await updateAddress(editingId, {
          fullName: values.fullName,
          phone: values.phone,
          region: values.region,
          city: values.city,
          subCity: values.subCity,
          streetAddress: values.line1,
          additionalInfo: '',
          isDefault: values.isDefault,
        });
        toast.success('Address updated');
      } else {
        await addAddress({
          fullName: values.fullName,
          phone: values.phone,
          region: values.region,
          city: values.city,
          subCity: values.subCity,
          streetAddress: values.line1,
          additionalInfo: '',
          isDefault: values.isDefault,
        });
        toast.success('Address added');
      }
      resetForm();
    } catch (_err) {
      // Error already handled by context
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await removeAddress(id);
      toast.success('Address removed');
    } catch (_err) {
      // Error handled by context
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault(id);
      toast.success('Default address updated');
    } catch (_err) {
      // Error handled by context
    }
  };

  if (!isLoaded) {
    return (
      <div className="shell section-y">
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ink border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="shell section-y">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="t-eyebrow text-ink-40">Account</p>
          <h1 className="t-page mt-3">Addresses</h1>
          <p className="t-body mt-3">Saved delivery addresses for faster checkout.</p>
        </div>

        {!isAdding && !editingId && (
          <Button onClick={startAdd} iconLeft={<Plus size={15} strokeWidth={2} />}>
            Add address
          </Button>
        )}
      </header>

      {isAdding || editingId ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-12 max-w-2xl border border-line p-6 sm:p-8"
        >
          <h2 className="t-section !text-xl">{editingId ? 'Edit address' : 'New address'}</h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Input
              label="Full name"
              name="fullName"
              value={values.fullName}
              onChange={handleChange}
              error={errors.fullName}
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

            <Input
              label="Sub-city"
              name="subCity"
              value={values.subCity}
              onChange={handleChange}
              error={errors.subCity}
              required
            />
            <Input
              label="City"
              name="city"
              value={values.city}
              onChange={handleChange}
              error={errors.city}
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Street address"
                name="line1"
                value={values.line1}
                onChange={handleChange}
                error={errors.line1}
                placeholder="Building, floor, house number"
                autoComplete="street-address"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={values.isDefault}
                  onChange={(e) => setValues((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="size-4 accent-ink"
                />
                Set as default address
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg">
              {editingId ? 'Save changes' : 'Save address'}
            </Button>
            <Button type="button" size="lg" variant="tertiary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Add an address and we can use it as your default at checkout."
            actionLabel="Add your first address"
            onAction={startAdd}
            className="mt-8 border border-line"
          />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <div key={address.id} className="border border-line p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ink">{address.fullName}</p>
                    {address.isDefault && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium bg-sand text-ink-60 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <address className="mt-3 not-italic text-[0.8125rem] text-ink-60 leading-relaxed">
                  {address.streetAddress}<br />
                  {address.subCity}, {address.city}, {address.region}<br />
                  {address.phone}
                </address>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!address.isDefault && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => handleSetDefault(address.id)}
                      iconLeft={<Check size={13} strokeWidth={2} />}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEdit(address)}
                    iconLeft={<MapPin size={13} strokeWidth={1.75} />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemove(address.id)}
                    iconLeft={<Trash2 size={13} strokeWidth={1.75} />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}