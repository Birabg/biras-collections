import { useState, useMemo } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { ADMIN_ORDERS, ORDER_STATUSES } from '../../data/adminData';
import { formatPrice } from '../../utils/currency';

export default function AdminOrders() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ADMIN_ORDERS.filter((order) => {
      const matchesStatus = status === 'all' || order.status === status;
      const matchesQuery =
        !needle ||
        order.id.toLowerCase().includes(needle) ||
        order.customer.toLowerCase().includes(needle) ||
        order.email.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Placeholder records. Status changes require a real fulfilment API."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order, customer or email"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search orders"
        />

        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders match"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <AdminTable
          rows={rows}
          columns={[
            {
              key: 'id',
              header: 'Order',
              render: (row) => <span className="font-medium text-ink">{row.id}</span>,
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (row) => (
                <span className="flex flex-col">
                  <span>{row.customer}</span>
                  <span className="text-[0.75rem] text-ink-40">{row.email}</span>
                </span>
              ),
            },
            { key: 'date', header: 'Date' },
            {
              key: 'items',
              header: 'Items',
              render: (row) => <span className="tabular-nums">{row.items}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              render: (row) => <span className="tabular-nums">{formatPrice(row.total)}</span>,
            },
            { key: 'status', header: 'Status', render: (row) => <StatusPill value={row.status} /> },
          ]}
        />
      )}
    </>
  );
}
