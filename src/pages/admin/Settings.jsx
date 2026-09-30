import { useState, Fragment } from 'react';
import { Lock, Check, Minus } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import { SETTINGS_SECTIONS } from '../../data/adminData';
import { ROLES, PERMISSIONS, permissionsFor, roleLabel, BACKOFFICE_ROLES } from '../../auth/roles';

const ROLES_LIST = [ROLES.CUSTOMER, ...BACKOFFICE_ROLES];

/** Grouped so the matrix stays readable. */
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

export default function AdminSettings() {
  const [section, setSection] = useState(SETTINGS_SECTIONS[0].key);
  const active = SETTINGS_SECTIONS.find((item) => item.key === section);
  const showMatrix = section === 'roles';

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Configuration is read-only until a settings API exists."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Settings sections">
          <ul className="flex flex-col gap-1">
            {SETTINGS_SECTIONS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setSection(item.key)}
                  aria-current={section === item.key ? 'true' : undefined}
                  className={`w-full border px-4 py-3 text-left transition-colors ${
                    section === item.key
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
          <h2 id="settings-heading" className="text-sm font-semibold text-ink">
            {active.label}
          </h2>

          {showMatrix ? (
            <>
              <p className="mt-1 text-[0.8125rem] text-ink-60">{active.description}</p>

              <div className="mt-6 flex items-start gap-3 border border-warning/25 bg-warning-soft px-4 py-3">
                <Lock size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                <p className="text-[0.8125rem] leading-relaxed text-ink-60">
                  <span className="font-medium text-ink">This matrix is documentation, not
                  enforcement.</span> It is generated from the same table the route guards use, so
                  the UI can never drift from the front-end rules. The server must independently
                  authorise every request.
                </p>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[38rem] border-collapse text-left">
                  <caption className="sr-only">Permissions granted to each role</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2.5 pr-4 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40">
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
                                    <>
                                      <Check
                                        size={15}
                                        strokeWidth={2.25}
                                        className="mx-auto text-success"
                                        aria-label="Granted"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Minus
                                        size={15}
                                        strokeWidth={2}
                                        className="mx-auto text-ink-20"
                                        aria-label="Not granted"
                                      />
                                    </>
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
          ) : (
            <>
              <p className="mt-1 text-[0.8125rem] text-ink-60">{active.description}</p>

              <form className="mt-6 max-w-md flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
                <label className="flex flex-col gap-2">
                  <span className="t-eyebrow text-ink-60">Store name</span>
                  <input
                    type="text"
                    defaultValue="Bira's Collections"
                    disabled
                    className="h-12 w-full border border-line bg-sand px-4 text-[0.9375rem] text-ink-40 disabled:cursor-not-allowed"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="t-eyebrow text-ink-60">Free delivery threshold (ETB)</span>
                  <input
                    type="number"
                    defaultValue="5000"
                    disabled
                    className="h-12 w-full border border-line bg-sand px-4 text-[0.9375rem] text-ink-40 disabled:cursor-not-allowed"
                  />
                </label>

                <p className="text-[0.75rem] text-ink-40">
                  Fields are disabled because no settings API exists yet.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
