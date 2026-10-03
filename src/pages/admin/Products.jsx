import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { adminProductsApi, adminCategoriesApi } from '../../api/adminProducts';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import EmptyState from '../../components/ui/EmptyState';

const DEFAULT_PRODUCT = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  price: 0,
  compareAtPrice: 0,
  cost: 0,
  sku: '',
  barcode: '',
  trackInventory: true,
  stock: 0,
  lowStockThreshold: 5,
  weight: 0,
  images: [],
  isActive: true,
  isFeatured: false,
  requiresShipping: true,
  metaTitle: '',
  metaDescription: '',
};

export default function AdminProducts() {
  const { can } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_PRODUCT);
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const canEdit = can(PERMISSIONS.PRODUCTS_WRITE);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminProductsApi.list({ page, limit: pageSize, search: query, includeInactive: true });
      setProducts(data.data ?? []);
      setPagination({ total: data.pagination?.total ?? 0, totalPages: data.pagination?.totalPages ?? 0 });
    } catch (err) {
      toast.error('Failed to load products', { message: err.message });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, toast]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await adminCategoriesApi.list();
      setCategories(data ?? []);
    } catch (err) {
      toast.error('Failed to load categories', { message: err.message });
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (!formData.categoryId) errors.categoryId = 'Category is required';
    if (formData.price < 0) errors.price = 'Price must be positive';
    if (formData.stock < 0) errors.stock = 'Stock cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingProduct) {
        await adminProductsApi.update(editingProduct.id, formData);
        toast.success('Product updated');
      } else {
        await adminProductsApi.create(formData);
        toast.success('Product created');
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error('Failed to save product', { message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...DEFAULT_PRODUCT,
      ...product,
      categoryId: product.categoryId ?? '',
      images: product.images ?? [],
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can be undone.`)) return;
    try {
      await adminProductsApi.delete(product.id);
      toast.success('Product deleted (soft delete)');
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product', { message: err.message });
    }
  };

  const handleRestore = async (product) => {
    try {
      await adminProductsApi.restore(product.id);
      toast.success('Product restored');
      loadProducts();
    } catch (err) {
      toast.error('Failed to restore product', { message: err.message });
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const duplicate = { ...product, name: `${product.name} (Copy)`, slug: `${product.slug}-copy`, isActive: false };
      delete duplicate.id;
      delete duplicate.createdAt;
      delete duplicate.updatedAt;
      await adminProductsApi.create(duplicate);
      toast.success('Product duplicated');
      loadProducts();
    } catch (err) {
      toast.error('Failed to duplicate product', { message: err.message });
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(DEFAULT_PRODUCT);
    setFormErrors({});
    setActiveTab('basic');
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <span className="flex items-center gap-3">
          <img src={row.images?.[0]} alt="" className="size-9 shrink-0 object-cover" loading="lazy" />
          <span className="flex flex-col">
            <span className="font-medium text-ink">{row.name}</span>
            <span className="text-[0.75rem] text-ink-40">/{row.slug}</span>
            {row.deletedAt && <span className="text-[0.625rem] text-error">Deleted</span>}
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="capitalize">
          {categories.find((c) => c.id === row.categoryId)?.name ?? row.categoryId ?? '—'}
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
      render: (row) => {
        if (row.deletedAt) return <StatusPill value="Deleted" />;
        return <StatusPill value={row.isActive ? 'Active' : 'Disabled'} />;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} title="Edit" aria-label="Edit">
            <Edit size={14} strokeWidth={2} />
          </Button>
          {row.deletedAt ? (
            <Button size="sm" variant="ghost" onClick={() => handleRestore(row)} title="Restore" aria-label="Restore">
              <RotateCcw size={14} strokeWidth={2} />
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(row)} title="Duplicate" aria-label="Duplicate">
                <Plus size={14} strokeWidth={2} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(row)} title="Delete" aria-label="Delete" className="text-error hover:bg-error-soft">
                <Trash2 size={14} strokeWidth={2} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Manage your product catalogue."
        actions={
          canEdit ? (
            <Button size="sm" onClick={openCreateModal}>
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
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search products"
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-ink-40" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description={query ? `Nothing matches "${query}".` : 'Add your first product to get started.'}
          actionLabel={canEdit ? 'Add product' : undefined}
          onAction={openCreateModal}
          className="mt-8 border border-line"
        />
      ) : (
        <>
          <AdminTable rows={products} rowKey={(row) => row.id} columns={columns} />
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[0.8125rem] text-ink-60">
                Showing {Math.min((page - 1) * pageSize + 1, pagination.total)}–{Math.min(page * pageSize, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="tertiary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={14} strokeWidth={2} />
                </Button>
                <span className="px-3 text-[0.8125rem] text-ink">Page {page} of {pagination.totalPages}</span>
                <Button size="sm" variant="tertiary" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                  <ChevronRight size={14} strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit product' : 'New product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 border-b border-line pb-4">
            {['basic', 'pricing', 'inventory', 'seo'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === tab
                    ? 'bg-ink text-paper'
                    : 'text-ink-40 hover:text-ink hover:bg-sand/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Product name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={formErrors.name}
                  required
                  placeholder="Enter product name"
                />
                <Input
                  label="Slug (URL handle)"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  error={formErrors.slug}
                  required
                  placeholder="auto-generated-from-name"
                />
              </div>
              <Select
                label="Category"
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                error={formErrors.categoryId}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Full product description"
                rows={4}
              />
              <Textarea
                label="Short description"
                value={formData.shortDescription}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                placeholder="Brief summary for listings"
                rows={2}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} className="size-4 accent-ink" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => handleChange('isFeatured', e.target.checked)} className="size-4 accent-ink" />
                  Featured
                </label>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                error={formErrors.price}
                required
              />
              <Input
                label="Compare at price"
                type="number"
                min="0"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => handleChange('compareAtPrice', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Cost price"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="Stock keeping unit"
              />
              <Input
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
              />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input type="checkbox" checked={formData.trackInventory} onChange={(e) => handleChange('trackInventory', e.target.checked)} className="size-4 accent-ink" />
                Track inventory
              </label>
              <Input
                label="Stock quantity"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', parseInt(e.target.value, 10) || 0)}
                error={formErrors.stock}
              />
              <Input
                label="Low stock threshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value, 10) || 5)}
              />
              <Input
                label="Weight (kg)"
                type="number"
                min="0"
                step="0.01"
                value={formData.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              />
              <label className="flex items-center gap-2 text-[0.875rem] text-ink">
                <input type="checkbox" checked={formData.requiresShipping} onChange={(e) => handleChange('requiresShipping', e.target.checked)} className="size-4 accent-ink" />
                Requires shipping
              </label>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <Input
                label="Meta title"
                value={formData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="SEO title (max 60 chars)"
                maxLength={60}
              />
              <Textarea
                label="Meta description"
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="SEO description (max 160 chars)"
                rows={2}
                maxLength={160}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row justify-end pt-4 border-t border-line">
            <Button type="button" variant="tertiary" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="lg" loading={isSaving}>
              {editingProduct ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}