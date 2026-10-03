import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  X,
  ImagePlus,
  AlertCircle,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import EmptyState from '../../components/ui/EmptyState';

/*
 * Catalogue management.
 *
 * The form mirrors `createProductSchema` in the backend exactly. Stock lives on
 * variants rather than on the product, so a simple product is one variant with
 * no size or colour — which is also why an "Add product" form with a bare stock
 * box could never have worked.
 */

const BLANK = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  subcategory: '',
  badge: '',
  stockQuantity: '0',
  lowStockThreshold: '5',
  imageUrl: '',
  isActive: true,
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
};

/** Derive a URL slug the way the API's regex expects: lowercase, hyphen-joined. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toProduct(row) {
  return {
    name: row.name ?? '',
    slug: row.slug ?? '',
    sku: row.sku ?? '',
    description: row.description ?? '',
    shortDescription: row.shortDescription ?? '',
    // The API nests the category; the form wants a flat id.
    categoryId: row.category?.id ?? '',
    price: row.price != null ? String(row.price) : '',
    compareAtPrice: row.compareAtPrice != null ? String(row.compareAtPrice) : '',
    subcategory: row.subcategory ?? '',
    badge: row.badge ?? '',
    stockQuantity: String(row.variants?.[0]?.stockQuantity ?? row.stock ?? 0),
    lowStockThreshold: String(row.variants?.[0]?.lowStockThreshold ?? 5),
    imageUrl: row.images?.[0] ?? '',
    isActive: row.isActive ?? true,
    isFeatured: row.isFeatured ?? false,
    isNew: row.isNew ?? false,
    isBestSeller: row.isBestSeller ?? false,
  };
}

/** Shape the flat form into the exact payload the API validates. */
function toPayload(form) {
  const image = form.imageUrl.trim();

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim(),
    description: form.description.trim(),
    shortDescription: form.shortDescription.trim() || null,
    categoryId: form.categoryId,
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
    subcategory: form.subcategory.trim() || null,
    badge: form.badge.trim() || null,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isNew: form.isNew,
    isBestSeller: form.isBestSeller,
    images: image ? [{ url: image, sortOrder: 0 }] : [],
    variants: [
      {
        sku: form.sku.trim(),
        stockQuantity: Number(form.stockQuantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        isActive: form.isActive,
      },
    ],
  };
}

function validate(form) {
  const errors = {};

  if (form.name.trim().length < 2) errors.name = 'Enter a name of at least 2 characters.';
  if (form.sku.trim().length < 2) errors.sku = 'Enter a SKU of at least 2 characters.';

  const slug = form.slug.trim();
  if (slug.length < 2) {
    errors.slug = 'Enter a URL slug.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens.';
  }

  if (!form.categoryId) errors.categoryId = 'Choose a category.';
  if (form.description.trim().length < 1) errors.description = 'Enter a description.';

  if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.price = 'Enter a price of 0 or more.';
  }

  const compareAt = form.compareAtPrice;
  if (compareAt !== '' && compareAt !== null) {
    const parsed = Number(compareAt);
    if (Number.isNaN(parsed) || parsed < 0) {
      errors.compareAtPrice = 'Enter a valid compare-at price.';
    } else if (form.price !== '' && parsed > 0 && parsed < Number(form.price)) {
      errors.compareAtPrice = 'Compare-at price should be higher than the price.';
    }
  }

  if (form.imageUrl.trim() && !/^https?:\/\/\S+$/i.test(form.imageUrl.trim())) {
    errors.imageUrl = 'Enter a full image URL starting with http:// or https://.';
  }

  const stock = Number(form.stockQuantity);
  if (form.stockQuantity === '' || Number.isNaN(stock) || stock < 0) {
    errors.stockQuantity = 'Enter a stock count of 0 or more.';
  }

  return errors;
}

export default function AdminProducts() {
  const { can } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const canEdit = can(PERMISSIONS.PRODUCTS_WRITE);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await adminApi.listProducts({ page, limit, search: query });
      setRows(payload?.data ?? []);
      setPagination(payload?.pagination ?? { page: 1, totalPages: 0, total: 0 });
    } catch (err) {
      setRows([]);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;

    adminApi
      .listCategories()
      .then((data) => {
        if (active) setCategories(data ?? []);
      })
      .catch(() => {
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  /* ------------------------------------------------------------ form state --*/

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Keep the slug in step with the name until the user edits it by hand,
      // so the common case never needs a second thought.
      if (field === 'name') {
        const slugIsUntouched =
          !prev.slug || prev.slug === slugify(prev.name) || prev.slug === BLANK.slug;
        if (slugIsUntouched) next.slug = slugify(value);
      }

      return next;
    });

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(toProduct(row));
    setErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = toPayload(form);

      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
        toast.success('Product updated', { message: `${payload.name} has been saved.` });
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product created', { message: `${payload.name} is now in the catalogue.` });
      }

      setIsFormOpen(false);
      await load();
    } catch (err) {
      // Surface the server's own message: a slug collision or bad category is
      // the common case and the generic string hides it.
      setFormError(err?.message ?? 'The product could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------- row verbs --*/

  const toggleFlag = async (row, flag) => {
    setPendingId(row.id);
    try {
      await adminApi.setProductFlags(row.id, { [flag]: !row[flag] });
      await load();
    } catch (err) {
      toast.error('Could not update product', { message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Archive "${row.name}"? It will be hidden from the storefront.`)) return;

    setPendingId(row.id);
    try {
      await adminApi.deleteProduct(row.id);
      toast.success('Product archived');
      await load();
    } catch (err) {
      toast.error('Could not archive product', { message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const duplicate = async (row) => {
    setPendingId(row.id);
    try {
      // A fresh slug and SKU are required: both are unique.
      const stamp = Date.now().toString(36);
      await adminApi.createProduct({
        ...toPayload(toProduct(row)),
        name: `${row.name} (copy)`,
        slug: `${row.slug}-copy-${stamp}`,
        sku: `${row.sku}-COPY-${stamp}`.slice(0, 60),
        isActive: false,
      });
      toast.success('Product duplicated', { message: 'The copy is archived until you activate it.' });
      await load();
    } catch (err) {
      toast.error('Could not duplicate product', { message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  /* ---------------------------------------------------------------- render --*/

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-line bg-sand">
            {row.images?.[0] ? (
              <img src={row.images[0]} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <Package size={16} strokeWidth={1.5} className="text-ink-25" aria-hidden="true" />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink">{row.name}</span>
            <span className="truncate text-[0.75rem] text-ink-40">
              {row.sku} · /{row.slug}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-ink-60">{row.category?.name ?? '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (
        <span className="flex flex-col tabular-nums">
          <span className="font-medium text-ink">{formatPrice(row.price)}</span>
          {row.compareAtPrice != null && row.compareAtPrice > row.price && (
            <span className="text-[0.6875rem] text-ink-40 line-through">
              {formatPrice(row.compareAtPrice)}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) => {
        const stock = row.stock ?? 0;
        const tone = stock === 0 ? 'text-error' : stock <= 5 ? 'text-warning' : 'text-ink-80';
        return <span className={`tabular-nums ${tone}`}>{stock}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <StatusPill value={row.isActive ? 'Active' : 'Disabled'} />
          {row.isFeatured && <StatusPill value="Featured" />}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        if (!canEdit) return <span className="text-ink-25">—</span>;

        const busy = pendingId === row.id;

        return (
          <span className="flex items-center justify-end gap-1">
            {busy ? (
              <Loader2 size={15} className="animate-spin text-ink-40" aria-label="Working" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded-[2px] p-2 text-ink-40 transition-colors hover:bg-sand hover:text-ink"
                  aria-label={`Edit ${row.name}`}
                  title="Edit"
                >
                  <Pencil size={15} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleFlag(row, 'isActive')}
                  className="rounded-[2px] p-2 text-ink-40 transition-colors hover:bg-sand hover:text-ink"
                  aria-label={row.isActive ? `Disable ${row.name}` : `Enable ${row.name}`}
                  title={row.isActive ? 'Disable' : 'Enable'}
                >
                  {row.isActive ? (
                    <X size={15} strokeWidth={1.75} />
                  ) : (
                    <RotateCcw size={15} strokeWidth={1.75} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFlag(row, 'isFeatured')}
                  aria-pressed={row.isFeatured}
                  className={`rounded-[2px] p-2 transition-colors hover:bg-sand ${
                    row.isFeatured ? 'text-warning' : 'text-ink-25 hover:text-ink'
                  }`}
                  aria-label={`${row.isFeatured ? 'Unfeature' : 'Feature'} ${row.name}`}
                  title={row.isFeatured ? 'Remove from featured' : 'Feature on the home page'}
                >
                  <Package size={15} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => duplicate(row)}
                  className="rounded-[2px] p-2 text-ink-40 transition-colors hover:bg-sand hover:text-ink"
                  aria-label={`Duplicate ${row.name}`}
                  title="Duplicate"
                >
                  <Copy size={15} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => remove(row)}
                  className="rounded-[2px] p-2 text-ink-40 transition-colors hover:bg-error-soft hover:text-error"
                  aria-label={`Archive ${row.name}`}
                  title="Archive"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </>
            )}
          </span>
        );
      },
    },
  ];

  const showFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1;
  const showTo = Math.min(pagination.page * limit, pagination.total);

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Everything in the storefront catalogue. Changes go live immediately."
        actions={
          canEdit ? (
            <Button size="sm" onClick={openCreate} iconLeft={<Plus size={14} strokeWidth={2} />}>
              New product
            </Button>
          ) : (
            <span className="text-[0.75rem] text-ink-40">Read-only for your role</span>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or SKU"
            icon={<Search size={15} strokeWidth={1.75} />}
            aria-label="Search products"
          />
        </div>

        {pagination.total > 0 && (
          <p className="text-[0.8125rem] text-ink-40 sm:ml-auto">
            {showFrom}–{showTo} of {pagination.total}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={26} className="animate-spin text-ink-25" aria-label="Loading products" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 border border-error/25 bg-error-soft px-6 py-12 text-center">
          <AlertCircle size={24} className="text-error" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">The catalogue could not be loaded</p>
            <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={query ? Search : Package}
          title={query ? 'No products match' : 'No products yet'}
          description={
            query
              ? `Nothing in the catalogue matches “${query}”.`
              : canEdit
                ? 'Add your first product and it will appear in the shop straight away.'
                : 'The catalogue is empty.'
          }
          actionLabel={canEdit && !query ? 'Add your first product' : undefined}
          onAction={openCreate}
          className="border border-line"
        />
      ) : (
        <>
          <AdminTable rows={rows} rowKey={(row) => row.id} columns={columns} />

          {pagination.totalPages > 1 && (
            <nav
              className="mt-5 flex items-center justify-between border-t border-line pt-4"
              aria-label="Pagination"
            >
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
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editing ? 'Edit product' : 'New product'}
        size="lg"
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 border border-error/25 bg-error-soft px-4 py-3 text-[0.8125rem] text-error"
            >
              <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
              {formError}
            </p>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className="t-eyebrow mb-1 text-ink-40">The basics</legend>

            <Input
              label="Product name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
              required
              placeholder="Linen wrap dress"
              autoFocus
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="URL slug"
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value)}
                error={errors.slug}
                required
                placeholder="linen-wrap-dress"
                hint={errors.slug ? undefined : `Storefront link: /product/${form.slug || '…'}`}
              />
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value)}
                error={errors.sku}
                required
                placeholder="BC-LWD-001"
              />
            </div>

            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              error={errors.categoryId}
              required
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            {categories.length === 0 && (
              <p className="-mt-2 text-[0.75rem] text-ink-40">
                No categories are available yet. A category must exist before a product can be
                filed under one.
              </p>
            )}

            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              error={errors.description}
              rows={4}
              required
              placeholder="What it is, how it fits, how to care for it."
            />

            <Textarea
              label="Short description"
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
              rows={2}
              hint="Optional. One line shown on product cards."
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
            <legend className="t-eyebrow mb-1 text-ink-40">Price and stock</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                error={errors.price}
                required
              />
              <Input
                label="Compare-at price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.compareAtPrice}
                onChange={(e) => setField('compareAtPrice', e.target.value)}
                error={errors.compareAtPrice}
                hint={errors.compareAtPrice ? undefined : 'Optional. Shows the item as reduced.'}
              />
              <Input
                label="Stock on hand"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.stockQuantity}
                onChange={(e) => setField('stockQuantity', e.target.value)}
                error={errors.stockQuantity}
              />
              <Input
                label="Low-stock alert at"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={(e) => setField('lowStockThreshold', e.target.value)}
                hint="Optional. Flags the item as low in the inventory report."
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
            <legend className="t-eyebrow mb-1 text-ink-40">Presentation</legend>

            <Input
              label="Image URL"
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              error={errors.imageUrl}
              placeholder="https://…"
              icon={<ImagePlus size={15} strokeWidth={1.75} />}
              hint={errors.imageUrl ? undefined : 'Optional. The first image is used on cards.'}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Subcategory"
                value={form.subcategory}
                onChange={(e) => setField('subcategory', e.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Badge"
                value={form.badge}
                onChange={(e) => setField('badge', e.target.value)}
                placeholder="e.g. New"
              />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="size-4 accent-ink"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setField('isFeatured', e.target.checked)}
                  className="size-4 accent-ink"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => setField('isNew', e.target.checked)}
                  className="size-4 accent-ink"
                />
                New arrival
              </label>
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) => setField('isBestSeller', e.target.checked)}
                  className="size-4 accent-ink"
                />
                Best seller
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="tertiary" size="lg" onClick={closeForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="lg" loading={isSaving}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
