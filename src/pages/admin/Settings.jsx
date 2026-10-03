import { useCallback, useEffect, useState, Fragment } from 'react';
import { Lock, Check, Minus, Loader2, AlertCircle, Save } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { ROLES, PERMISSIONS, permissionsFor, roleLabel, BACKOFFICE_ROLES } from '../../auth/roles';

/*
 * Settings.
 *
 * Store settings are free-form JSON rows keyed by `store.*`. The list of known
 * keys is described here for presentation only — a key the server holds that is
 * not in this table still renders, as raw JSON, rather than being silently
 * hidden. That way adding a setting on the backend does not silently lose it in
 * the UI.
 */

const ROLES_LIST = [ROLES.CUSTOMER, ...BACKOFFICE_ROLES];

const GROUPS = [
  { label: 'Catalogue', keys: [PERMISSIONS.CATALOG_VIEW] },
  { label: 'Commerce', keys: [PERMISSIONS.CART_WRITE, PERMISSIONS.ORDER_CREATE] },
  {
    label: 'Self-service',
    keys: [
      PERMISSIONS.PROFILE_READ,
      PERMISSIONS.PROFILE_WRITE,
      PERMISSIONS.ADDRESSES_MANAGE,
      PERMISSIONS.ORDERS_OWN_READ,
      PERMISSIONS.WISHLIST_MANAGE,
    ],
  },
  {
    label: 'Back office (read)',
    keys: [
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.REPORTS_READ,
    ],
  },
  {
    label: 'Back office (write)',
    keys: [
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.PRODUCTS_WRITE,
      PERMISSIONS.CATEGORIES_WRITE,
      PERMISSIONS.INVENTORY_WRITE,
    ],
  },
  {
    label: 'Administration',
    keys: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.SETTINGS_MANAGE],
  },
];

/**
 * Known keys, with the control that suits them. Anything not listed falls back to
 * a JSON textarea, because the API accepts any JSON value.
 */
const FIELD_TYPES = {
  'store.freeShippingThreshold': { label: 'Free delivery threshold', type: 'number', suffix: 'ETB' },
  'store.shippingFee': { label: 'Delivery fee', type: 'number', suffix: 'ETB' },
  'store.currency': { label: 'Currency code', type: 'text', hint: 'ISO 4217, e.g. ETB' },
  'store.supportEmail': { label: 'Support email', type: 'email' },
  'store.supportPhone': { label: 'Support phone', type: 'tel' },
};

function fieldLabelFor(key) {
  return FIELD_TYPES[key]?.label ?? key.replace(/^store\./, '').replace(/([A-Z])/g, ' $1');
}

/** A JSON textarea has to round-trip: text -> parsed value on save. */
function parseJsonField(text, previous) {
  const trimmed = text.trim();

  if (trimmed === '') return previous;

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export default function AdminSettings() {
  const toast = useToast();

  const [tab, setTab] = useState('store');
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [invalidKeys, setInvalidKeys] = useState([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const rows = await adminApi.listSettings();
      setSettings(rows ?? []);
    } catch (err) {
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setDraft = (key, text) => {
    setDrafts((prev) => ({ ...prev, [key]: text }));
    if (invalidKeys.includes(key)) {
      setInvalidKeys((prev) => prev.filter((item) => item !== key));
    }
  };

  const save = async (setting) => {
    const key = setting.key;
    const type = FIELD_TYPES[key];
    const draft = drafts[key];

    if (draft === undefined) return;

    let value;

    if (type?.type === 'number') {
      value = Number(draft);
      if (!Number.isFinite(value) || value < 0) {
        setInvalidKeys((prev) => [...prev, key]);
        return;
      }
    } else if (type) {
      value = draft;
    } else {
      value = parseJsonField(draft, setting.value);
      if (value === undefined) {
        setInvalidKeys((prev) => [...prev, key]);
        toast.error('That value is not valid JSON', { message: key });
        return;
      }
    }

    setSavingKey(key);

    try {
      await adminApi.upsertSetting(key, value);
      toast.success('Setting saved', { message: key });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await load();
    } catch (err) {
      toast.error('Could not save that setting', { message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  const storeSettings = settings.filter((setting) => setting.key.startsWith('store.'));
  const otherSettings = settings.filter((setting) => !setting.key.startsWith('store.'));

  const renderField = (setting) => {
    const type = FIELD_TYPES[setting.key];
    const isJson = !type;
    const value = setting.value;
    const draft = drafts[setting.key];
    const shown = draft ?? (isJson ? JSON.stringify(value, null, 2) : String(value ?? ''));
    const dirty = draft !== undefined && draft !== (isJson ? JSON.stringify(value, null, 2) : String(value ?? ''));
    const invalid = invalidKeys.includes(setting.key);

    return (
      <div key={setting.key} className="flex flex-col gap-2 border-b border-line-soft py-4 last:border-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor={`setting-${setting.key}`} className="t-eyebrow text-ink-60">
            {fieldLabelFor(setting.key)}
          </label>
          <code className="text-[0.6875rem] text-ink-25">{setting.key}</code>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1">
            {isJson ? (
              <textarea
                id={`setting-${setting.key}`}
                rows={3}
                value={shown}
                onChange={(event) => setDraft(setting.key, event.target.value)}
                className={`w-full border px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-ink-80 ${
                  invalid ? 'border-error' : 'border-line'
                }`}
              />
            ) : (
              <Input
                id={`setting-${setting.key}`}
                type={type.type}
                value={shown}
                onChange={(event) => setDraft(setting.key, event.target.value)}
                error={invalid ? 'Enter a number of 0 or more.' : undefined}
                hint={type.hint}
                suffix={type.suffix}
              />
            )}
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="mt-7 shrink-0"
            iconLeft={<Save size={14} strokeWidth={1.75} />}
            disabled={!dirty}
            loading={savingKey === setting.key}
            onClick={() => save(setting)}
          >
            Save
          </Button>
        </div>

        <p className="text-[0.6875rem] text-ink-25">
          Last updated {new Date(setting.updatedAt).toLocaleString('en-GB')}
        </p>
      </div>
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Store configuration and the permission model. Changes take effect immediately."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Settings sections">
          <ul className="flex flex-col gap-1">
            {[
              { key: 'store', label: 'Store details', description: 'Currency, contacts and delivery.' },
              {
                key: 'other',
                label: 'Other configuration',
                description: `${otherSettings.length} key${otherSettings.length === 1 ? '' : 's'} stored on the server.`,
              },
              { key: 'roles', label: 'Roles and permissions', description: 'Who can do what in the back office.' },
            ].map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setTab(item.key)}
                  aria-current={tab === item.key ? 'true' : undefined}
                  className={`w-full border px-4 py-3 text-left transition-colors ${
                    tab === item.key
                      ? 'border-ink bg-paper'
                      : 'border-line bg-paper/60 hover:border-ink-25 hover:bg-paper'
                  }`}
                >
                  <span className="block text-[0.8125rem] font-medium text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-ink-40">
                    {item.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="border border-line bg-paper p-6" aria-labelledby="settings-heading">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-ink-25" aria-label="Loading settings" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertCircle size={24} className="text-error" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink">Settings could not be loaded</p>
                <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={load}>
                Try again
              </Button>
            </div>
          ) : tab === 'roles' ? (
            <>
              <h2 id="settings-heading" className="text-sm font-semibold text-ink">
                Roles and permissions
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-60">
                Who can do what in the back office.
              </p>

              <div className="mt-6 flex items-start gap-3 border border-warning/25 bg-warning-soft px-4 py-3">
                <Lock size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                <p className="text-[0.8125rem] leading-relaxed text-ink-60">
                  <span className="font-medium text-ink">This matrix is documentation, not
                  enforcement.</span> It is generated from the same table the UI hides controls with,
                  and the server authorises every request independently. Granting a role to a real
                  account happens on the{' '}
                  <span className="font-medium text-ink">Customers</span> page.
                </p>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[38rem] border-collapse text-left">
                  <caption className="sr-only">Permissions granted to each role</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th
                        scope="col"
                        className="py-2.5 pr-4 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40"
                      >
                        Permission
                      </th>
                      {ROLES_LIST.map((role) => (
                        <th
                          key={role}
                          scope="col"
                          className="px-3 py-2.5 text-center text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40"
                        >
                          {roleLabel(role)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {GROUPS.map((group) => (
                      <Fragment key={group.label}>
                        <tr className="bg-sand/60">
                          <th
                            scope="colgroup"
                            colSpan={ROLES_LIST.length + 1}
                            className="py-1.5 pr-4 text-left text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40"
                          >
                            {group.label}
                          </th>
                        </tr>

                        {group.keys.map((permission) => (
                          <tr key={permission} className="border-b border-line-soft">
                            <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                              <code className="text-[0.75rem] text-ink-80">{permission}</code>
                            </th>

                            {ROLES_LIST.map((role) => {
                              const granted = permissionsFor(role).includes(permission);
                              return (
                                <td key={role} className="px-3 py-2.5 text-center">
                                  {granted ? (
                                    <Check
                                      size={15}
                                      strokeWidth={2.25}
                                      className="mx-auto text-success"
                                      aria-label={`${roleLabel(role)} is granted ${permission}`}
                                    />
                                  ) : (
                                    <Minus
                                      size={15}
                                      strokeWidth={2}
                                      className="mx-auto text-ink-25"
                                      aria-label={`${roleLabel(role)} is not granted ${permission}`}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : tab === 'other' ? (
            <>
              <h2 id="settings-heading" className="text-sm font-semibold text-ink">
                Other configuration
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-60">
                {otherSettings.length} key{otherSettings.length === 1 ? '' : 's'} stored on the
                server. Values are JSON.
              </p>

              {otherSettings.length === 0 ? (
                <p className="mt-8 text-center text-[0.8125rem] text-ink-40">
                  Nothing else is stored yet.
                </p>
              ) : (
                <div className="mt-4">{otherSettings.map(renderField)}</div>
              )}
            </>
          ) : (
            <>
              <h2 id="settings-heading" className="text-sm font-semibold text-ink">
                Store details
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-60">
                Currency, contacts and delivery.
              </p>

              {storeSettings.length === 0 ? (
                <p className="mt-8 text-center text-[0.8125rem] text-ink-40">
                  No store settings exist yet. Run the database seed, or add them from the API.
                </p>
              ) : (
                <>
                  <div className="mt-4">{storeSettings.map(renderField)}</div>

                  <p className="mt-5 text-[0.75rem] leading-relaxed text-ink-40">
                    Delivery currently reads as{' '}
                    <span className="font-medium text-ink-80">
                      {formatPrice(Number(settings.find((s) => s.key === 'store.shippingFee')?.value ?? 150))}
                    </span>{' '}
                    flat, free above{' '}
                    <span className="font-medium text-ink-80">
                      {formatPrice(
                        Number(
                          settings.find((s) => s.key === 'store.freeShippingThreshold')?.value ?? 5000,
                        ),
                      )}
                    </span>
                    .
                  </p>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
