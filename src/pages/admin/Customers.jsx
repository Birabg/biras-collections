import { useState, useMemo } from 'react';
import { Search, UserX } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { ADMIN_CUSTOMERS } from '../../data/adminData';
import { formatPrice } from '../../utils/currency';

export default function AdminCustomers() {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ADMIN_CUSTOMERS;
    return ADMIN_CUSTOMERS.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) || customer.email.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Placeholder records. Customer data is personal — the real view must be permission-checked server-side."
      />

      <div className="mb-4 max-w-md">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search customers"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No customers match"
          description={`Nothing matches "${query}".`}
        />
      ) : (
        <AdminTable
          rows={rows}
          columns={[
            {
              key: 'name',
              header: 'Customer',
              render: (row) => (
                <span className="flex flex-col">
                  <span className="font-medium text-ink">{row.name}</span>
                  <span className="text-[0.75rem] text-ink-40">{row.email}</span>
                </span>
              ),
            },
            { key: 'since', header: 'Customer since' },
            {
              key: 'orders',
              header: 'Orders',
              render: (row) => <span className="tabular-nums">{row.orders}</span>,
            },
            {
              key: 'spent',
              header: 'Lifetime spend',
              render: (row) => <span className="tabular-nums">{formatPrice(row.spent)}</span>,
            },
          ]}
        />
      )}
    </>
  );
}
