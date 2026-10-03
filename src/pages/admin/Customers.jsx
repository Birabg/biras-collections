import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserCog,
  ShieldCheck,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS, ROLES, normaliseRole } from '../../auth/roles';

/*
 * Customers.
 *
 * This list mixes shoppers and staff, so it filters by role rather than assuming
 * every row is a customer. Lifetime spend is server-aggregated from paid orders
 * only — summing order totals in the browser would count cancelled and unpaid
 * orders as money.
 */

const PAGE_SIZE = 20;

const ASSIGNABLE_ROLES = [
  { value: ROLES.CUSTOMER, label: 'Customer', hint: 'Shopper. No back-office access.' },
  { value: ROLES.STAFF, label: 'Staff', hint: 'Order queue and stock counts only.' },
  { value: ROLES.MANAGER, label: 'Manager', hint: 'Full catalogue and reporting access.' },
  { value: ROLES.ADMIN, label: 'Administrator', hint: 'Everything except granting the top role.' },
  { value: ROLES.SUPER_ADMIN, label: 'Super administrator', hint: 'The only role that can grant itself.' },
];

export default function AdminCustomers() {
  const { user, can } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });

  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [pendingId, setPendingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [nextRole, setNextRole] = useState(ROLES.CUSTOMER);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const canManageUsers = can(PERMISSIONS.USERS_MANAGE);
  const isSuperAdmin = normaliseRole(user?.role) === ROLES.SUPER_ADMIN;

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await adminApi.listCustomers({
        page,
        limit: PAGE_SIZE,
        search: query.trim() || undefined,
        role: role || undefined,
        isActive: isActive || undefined,
      });

      setRows(payload?.data ?? []);
      setPagination(payload?.pagination ?? { page: 1, totalPages: 0, total: 0 });
    } catch (err) {
      setRows([]);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, query, role, isActive]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openDetail = async (row) => {
    setDetail(null);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const customer = await adminApi.getCustomer(row.id);
      setDetail(customer);
    } catch (err) {
      setIsDetailOpen(false);
      toast.error('Could not open that customer', { message: err.message });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const toggleActive = async (row) => {
    setPendingId(row.id);

    try {
      await adminApi.setCustomerActive(row.id, !row.isActive);
      toast.success(
        row.isActive ? `${row.fullName} disabled` : `${row.fullName} re-enabled`,
        {
          message: row.isActive
            ? 'Their sessions were ended, so they will be signed out.'
            : 'They can sign in again.',
        },
      );
      await load();
    } catch (err) {
      toast.error('Could not change that account', { message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const openRoleChange = (row) => {
    setRoleTarget(row);
    setNextRole(normaliseRole(row.role));
  };

  const saveRole = async () => {
    setIsSavingRole(true);

    try {
      await adminApi.updateUserRole(roleTarget.id, nextRole.toUpperCase());
      toast.success('Role updated', { message: `${roleTarget.fullName} is now ${nextRole}.` });
      setRoleTarget(null);
      await load();
    } catch (err) {
      toast.error('Could not change that role', { message: err.message });
    } finally {
      setIsSavingRole(false);
    }
  };

  /* ---------------------------------------------------------------- render --*/

  const columns = [
    {
      key: 'name',
      header: 'Person',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{row.fullName}</span>
          <span className="text-[0.75rem] text-ink-40">{row.email}</span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <StatusPill value={row.roleLabel} />,
    },
    {
      key: 'since',
      header: 'Customer since',
      render: (row) => (
        <span className="text-ink-60">
          {new Date(row.since ?? row.createdAt).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (row) => <span className="tabular-nums">{row.orders}</span>,
    },
    {
      key: 'spent',
      header: 'Lifetime spend',
      render: (row) => <span className="tabular-nums text-ink">{formatPrice(row.spent)}</span>,
    },
    {
      key: 'status',
      header: 'Account',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <StatusPill value={row.isActive ? 'Active' : 'Disabled'} />
          {!row.emailVerified && <StatusPill value="Unverified" />}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <span className="flex items-center justify-end gap-2">
          <Button size="sm" variant="tertiary" onClick={() => openDetail(row)}>
            View
          </Button>

          {canManageUsers && (
            <>
              <Button
                size="sm"
                variant="tertiary"
                iconLeft={<UserCog size={14} strokeWidth={1.75} />}
                onClick={() => openRoleChange(row)}
                disabled={row.id === user?.id}
                title={row.id === user?.id ? 'You cannot change your own role' : undefined}
              >
                Role
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                disabled={pendingId === row.id}
                loading={pendingId === row.id}
                onClick={() => toggleActive(row)}
              >
                {row.isActive ? 'Disable' : 'Enable'}
              </Button>
            </>
          )}
        </span>
      ),
    },
  ];

  const showFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Accounts and staff. Personal data — handle it accordingly."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_13rem_11rem]">
        <Input
          type="search"
          value={query}
          onChange={(event) => applyFilter(setQuery)(event.target.value)}
          placeholder="Search name or email"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search customers"
        />

        <Select
          value={role}
          onChange={(event) => applyFilter(setRole)(event.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ASSIGNABLE_ROLES.map((option) => (
            <option key={option.value} value={option.value.toUpperCase()}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={isActive}
          onChange={(event) => applyFilter(setIsActive)(event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="">Any status</option>
          <option value="true">Active only</option>
          <option value="false">Disabled only</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={26} className="animate-spin text-ink-25" aria-label="Loading customers" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 border border-error/25 bg-error-soft px-6 py-12 text-center">
          <AlertCircle size={24} className="text-error" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">Customers could not be loaded</p>
            <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No accounts match"
          description={
            query
              ? `Nothing matches “${query}”.`
              : 'No accounts match the filters you have set.'
          }
          className="border border-line"
        />
      ) : (
        <>
          <AdminTable rows={rows} rowKey={(row) => row.id} columns={columns} caption="Accounts" />

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.8125rem] text-ink-40">
              {showFrom}–{showTo} of {pagination.total}
            </p>

            {pagination.totalPages > 1 && (
              <nav className="flex items-center gap-3" aria-label="Pagination">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconLeft={<ChevronLeft size={14} strokeWidth={2} />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-[0.8125rem] text-ink-60">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="tertiary"
                  iconRight={<ChevronRight size={14} strokeWidth={2} />}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Customer detail */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detail?.fullName ?? 'Customer'}
        size="lg"
      >
        {isDetailLoading || !detail ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-ink-25" aria-label="Loading customer" />
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="t-eyebrow mb-2 text-ink-40">Contact</dt>
                <dd className="flex flex-col text-[0.875rem] text-ink-80">
                  <span>{detail.email}</span>
                  {detail.phone && <span className="text-ink-60">{detail.phone}</span>}
                  <span className="flex flex-wrap items-center gap-1.5 pt-1">
                    <StatusPill value={detail.roleLabel} />
                    <StatusPill value={detail.isActive ? 'Active' : 'Disabled'} />
                  </span>
                </dd>
              </div>

              <div>
                <dt className="t-eyebrow mb-2 text-ink-40">Activity</dt>
                <dd className="flex flex-col gap-1 text-[0.875rem] text-ink-80">
                  <span className="flex justify-between">
                    <span className="text-ink-60">Orders placed</span>
                    <span className="tabular-nums">{detail.statistics?.orders ?? 0}</span>
                  </span>
                  <span className="flex justify-between">
                    <span className="text-ink-60">Paid orders</span>
                    <span className="tabular-nums">{detail.statistics?.paidOrders ?? 0}</span>
                  </span>
                  <span className="flex justify-between font-medium">
                    <span className="text-ink">Lifetime spend</span>
                    <span className="tabular-nums">{formatPrice(detail.statistics?.spent ?? 0)}</span>
                  </span>
                  {detail.lastLoginAt && (
                    <span className="pt-1 text-[0.75rem] text-ink-40">
                      Last signed in{' '}
                      {new Date(detail.lastLoginAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {detail.addresses?.length > 0 && (
              <section>
                <h3 className="t-eyebrow mb-3 text-ink-40">Addresses</h3>
                <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {detail.addresses.map((address) => (
                    <li
                      key={address.id}
                      className="flex-1 border border-line px-4 py-3 text-[0.8125rem] text-ink-60"
                    >
                      <span className="block font-medium text-ink">
                        {address.fullName}
                        {address.isDefault && (
                          <span className="ml-2 text-[0.6875rem] uppercase tracking-[0.1em] text-success">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="block">{address.phone}</span>
                      <span className="block">
                        {[address.streetAddress, address.kebele, address.subCity, address.city, address.region]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.orders?.length > 0 && (
              <section>
                <h3 className="t-eyebrow mb-3 text-ink-40">Recent orders</h3>
                <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
                  {detail.orders.map((order) => (
                    <li key={order.id} className="flex items-center gap-4 py-3 text-[0.8125rem]">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">{order.orderNumber}</span>
                        <span className="text-[0.75rem] text-ink-40">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                        </span>
                      </span>
                      <StatusPill value={order.status.charAt(0) + order.status.slice(1).toLowerCase()} />
                      <span className="w-24 shrink-0 text-right tabular-nums text-ink">
                        {formatPrice(order.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Modal>

      {/* Role change: the one action that can grant more power than the actor has. */}
      <Modal
        isOpen={Boolean(roleTarget)}
        onClose={() => {
          if (!isSavingRole) setRoleTarget(null);
        }}
        title={`Change role · ${roleTarget?.fullName ?? ''}`}
        size="sm"
      >
        {roleTarget && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border border-line bg-sand/60 px-4 py-3">
              <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-40" aria-hidden="true" />
              <p className="text-[0.8125rem] leading-relaxed text-ink-60">
                Currently <span className="font-medium text-ink">{roleTarget.roleLabel}</span>.
                Changing a role signs the person out everywhere, so their new permissions take
                effect on the next sign-in.
              </p>
            </div>

            {!isSuperAdmin && (
              <p className="-mt-1 text-[0.75rem] text-ink-40">
                Only a super administrator can grant or revoke that role.
              </p>
            )}

            <Select
              label="New role"
              value={nextRole}
              onChange={(event) => setNextRole(event.target.value)}
              hint={ASSIGNABLE_ROLES.find((option) => option.value === nextRole)?.hint}
            >
              {ASSIGNABLE_ROLES.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.value === ROLES.SUPER_ADMIN && !isSuperAdmin}
                >
                  {option.label}
                </option>
              ))}
            </Select>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="tertiary" onClick={() => setRoleTarget(null)} disabled={isSavingRole}>
                Cancel
              </Button>
              <Button
                loading={isSavingRole}
                disabled={nextRole === normaliseRole(roleTarget.role)}
                onClick={saveRole}
              >
                Update role
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
