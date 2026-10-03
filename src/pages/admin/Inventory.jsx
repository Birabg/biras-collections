import { useMemo, useState } from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { products } from '../../data/products';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';

const LOW_THRESHOLD = 10;

const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
];

export default function AdminInventory() {
  const { can } = useAuth();
  const [view, setView] = useState('all');
  const canEdit = can(PERMISSIONS.INVENTORY_WRITE);

  const rows = useMemo(() => {
    if (view === 'low') return products.filter((p) => p.stock > 0 && p.stock < LOW_THRESHOLD);
    if (view === 'out') return products.filter((p) => p.stock === 0);
    return products;
  }, [view]);

  const lowCount = products.filter((p) => p.stock > 0 && p.stock < LOW_THRESHOLD).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Stock levels from the live catalogue. Adjustments require the inventory API."
      />

      {lowCount + outCount > 0 && (
        <div
          className="mb-4 flex items-start gap-3 border border-warning/25 bg-warning-soft px-4 py-3"
          role="status"
        >
          <AlertTriangle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-[0.8125rem] leading-relaxed text-ink-60">
            <span className="font-medium text-ink">
              {lowCount + outCount} line{lowCount + outCount === 1 ? '' : 's'} need attention
            </span>{' '}
            — {lowCount} below {LOW_THRESHOLD} units, {outCount} out of stock.
          </p>
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-line" role="tablist" aria-label="Inventory views">
        {VIEWS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={view === option.key}
            onClick={() => setView(option.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
              view === option.key
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-40 hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing in this view"
          description="No products currently match the selected filter."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.slug}
          columns={[
            {
              key: 'name',
              header: 'Product',
              render: (row) => (
                <span className="flex items-center gap-3">
                  <img src={row.images?.[0]} alt="" className="size-9 shrink-0 object-cover" loading="lazy" />
                  <span className="font-medium text-ink">{row.name}</span>
                </span>
              ),
            },
            { key: 'sku', header: 'SKU', render: (row) => <code className="text-[0.75rem]">BC-{String(row.id).padStart(4, '0')}</code> },
            {
              key: 'stock',
              header: 'Units',
              render: (row) => (
                <span
                  className={`font-medium tabular-nums ${
                    row.stock === 0 ? 'text-error' : row.stock < LOW_THRESHOLD ? 'text-warning' : 'text-ink'
                  }`}
                >
                  {row.stock}
                </span>
              ),
            },
            {
              key: 'value',
              header: 'Stock value',
              render: (row) => <span className="tabular-nums">{formatPrice(row.price * row.stock)}</span>,
            },
            {
              key: 'action',
              header: '',
              render: (_row) =>
                canEdit ? (
                  <Button size="sm" variant="secondary" disabled>
                    Adjust
                  </Button>
                ) : null,
            },
          ]}
        />
      )}
    </>
  );
}
