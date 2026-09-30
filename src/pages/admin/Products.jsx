import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { products, categories } from '../../data/products';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminProducts() {
  const { can } = useAuth();
  const [query, setQuery] = useState('');

  const canEdit = can(PERMISSIONS.PRODUCTS_WRITE);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) || product.category.includes(needle),
    );
  }, [query]);

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Reads the live storefront catalogue. Editing requires the catalogue API."
        actions={
          canEdit ? (
            <Button size="sm" disabled title="Requires the product management API">
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              New product
            </Button>
          ) : (
            <span className="text-[0.75rem] text-ink-40">Read-only for your role</span>
          )
        }
      />

      <div className="mb-4 max-w-md">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search products"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products match"
          description={`Nothing in the catalogue matches "${query}".`}
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
                  <img
                    src={row.images?.[0]}
                    alt=""
                    className="size-9 shrink-0 object-cover"
                    loading="lazy"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-ink">{row.name}</span>
                    <span className="text-[0.75rem] text-ink-40">/{row.slug}</span>
                  </span>
                </span>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (row) => (
                <span className="capitalize">
                  {categories.find((c) => c.id === row.category)?.name ?? row.category}
                </span>
              ),
            },
            {
              key: 'price',
              header: 'Price',
              render: (row) => <span className="tabular-nums">{formatPrice(row.price)}</span>,
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (row) => <span className="tabular-nums">{row.stock}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusPill value={row.stock === 0 ? 'Disabled' : 'Active'} />
              ),
            },
          ]}
        />
      )}
    </>
  );
}
