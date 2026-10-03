import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Boxes,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import { STOCK_LEVEL_LABEL, INVENTORY_REASON_LABEL } from '../../utils/orderStatus';

/*
 * Inventory.
 *
 * Rows are variants, not products: a size/colour run is what actually holds
 * stock, and the low-stock flag is per variant against its own threshold. The
 * previous version invented SKUs from product ids and disabled its own Adjust
 * button, which is the worst of both worlds.
 */

const PAGE_SIZE = 20;

const LEVELS = [
  { key: '', label: 'All stock' },
  { key: 'in_stock', label: 'In stock' },
  { key: 'low_stock', label: 'Low stock' },
  { key: 'out_of_stock', label: 'Out of stock' },
];

const REASONS = [
  { key: 'RESTOCK', label: 'Restock', hint: 'New stock arriving' },
  { key: 'ADJUSTMENT', label: 'Correction', hint: 'Fixing a miscount' },
  { key: 'DAMAGE', label: 'Damage', hint: 'Written off or lost' },
];

function stockTone(level) {
  if (level === 'out_of_stock') return 'text-error';
  if (level === 'low_stock') return 'text-warning';
  return 'text-ink';
}

export default function AdminInventory() {
  const { can } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [summary, setSummary] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [target, setTarget] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('RESTOCK');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [historyFor, setHistoryFor] = useState(null);
  const [movements, setMovements] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const canEdit = can(PERMISSIONS.INVENTORY_WRITE);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await adminApi.listInventory({
        page,
        limit: PAGE_SIZE,
        search: query.trim() || undefined,
        level: level || undefined,
      });

      setRows(payload?.data ?? []);
      setPagination(payload?.pagination ?? { page: 1, totalPages: 0, total: 0 });
      setSummary(payload?.summary ?? { inStock: 0, lowStock: 0, outOfStock: 0 });
    } catch (err) {
      setRows([]);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, query, level]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openAdjust = (row) => {
    setTarget(row);
    setQuantity('');
    setReason('RESTOCK');
    setNote('');
    setFormError(null);
  };

  const submitAdjust = async () => {
    const amount = Number(quantity);

    if (quantity === '' || !Number.isInteger(amount) || amount === 0) {
      setFormError('Enter a whole number that is not zero — use a negative number to remove stock.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      await adminApi.adjustStock(target.id, { quantity: amount, reason, note: note || undefined });
      toast.success(
        'Stock updated',
        { message: `${target.sku} is now at ${target.stockQuantity + amount} units.` },
      );
      setTarget(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openHistory = async (row) => {
    setHistoryFor(row);
    setMovements([]);
    setIsHistoryLoading(true);

    try {
      const data = await adminApi.listMovements(row.id);
      setMovements(data ?? []);
    } catch (err) {
      toast.error('Could not load the movement history', { message: err.message });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const needsAttention = summary.lowStock + summary.outOfStock;

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{row.product?.name}</span>
          <span className="text-[0.75rem] text-ink-40">
            {[row.size, row.color].filter(Boolean).join(' · ') || 'One size'}
          </span>
        </span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (row) => <code className="text-[0.75rem] text-ink-60">{row.sku}</code>,
    },
    {
      key: 'stock',
      header: 'Units',
      render: (row) => (
        <span className={`font-medium tabular-nums ${stockTone(row.level)}`}>{row.stockQuantity}</span>
      ),
    },
    {
      key: 'threshold',
      header: 'Alert at',
      render: (row) => <span className="tabular-nums text-ink-60">{row.lowStockThreshold}</span>,
    },
    {
      key: 'level',
      header: 'Level',
      render: (row) => <StatusPill value={STOCK_LEVEL_LABEL[row.level] ?? row.level} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <span className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="tertiary"
            iconLeft={<History size={14} strokeWidth={1.75} />}
            onClick={() => openHistory(row)}
          >
            History
          </Button>
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              iconLeft={<SlidersHorizontal size={14} strokeWidth={1.75} />}
              onClick={() => openAdjust(row)}
            >
              Adjust
            </Button>
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
        title="Inventory"
        description="Stock per variant. Every adjustment is recorded with who made it and why."
        actions={
          <span className="flex flex-wrap gap-4 text-[0.75rem] text-ink-40">
            {LEVELS.slice(1).map((option) => (
              <span key={option.key}>
                {option.label}{' '}
                <strong className="font-medium tabular-nums text-ink-80">
                  {summary[option.key === 'in_stock' ? 'inStock' : option.key === 'low_stock' ? 'lowStock' : 'outOfStock']}
                </strong>
              </span>
            ))}
          </span>
        }
      />

      {needsAttention > 0 && (
        <div
          className="mb-5 flex items-start gap-3 border border-warning/25 bg-warning-soft px-4 py-3"
          role="status"
        >
          <AlertTriangle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-[0.8125rem] leading-relaxed text-ink-60">
            <span className="font-medium text-ink">{needsAttention} variants need attention</span> —{' '}
            {summary.lowStock} at or below their threshold, {summary.outOfStock} out of stock.
          </p>
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem]">
        <Input
          type="search"
          value={query}
          onChange={(event) => applyFilter(setQuery)(event.target.value)}
          placeholder="Search by product name or SKU"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search inventory"
        />

        <Select
          value={level}
          onChange={(event) => applyFilter(setLevel)(event.target.value)}
          aria-label="Filter by stock level"
        >
          {LEVELS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={26} className="animate-spin text-ink-25" aria-label="Loading inventory" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 border border-error/25 bg-error-soft px-6 py-12 text-center">
          <AlertCircle size={24} className="text-error" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">Inventory could not be loaded</p>
            <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing in this view"
          description={
            query
              ? `No variants match “${query}”.`
              : level
                ? 'No variants currently sit in that stock band.'
                : 'Add a product with a variant and it will appear here.'
          }
          className="border border-line"
        />
      ) : (
        <>
          <AdminTable rows={rows} rowKey={(row) => row.id} columns={columns} caption="Inventory" />

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

      {/* Adjust stock. Relative, because a count is more honest than a guess. */}
      <Modal
        isOpen={Boolean(target)}
        onClose={() => {
          if (!isSaving) setTarget(null);
        }}
        title={`Adjust ${target?.sku ?? 'stock'}`}
        size="sm"
      >
        {target && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border border-line bg-sand/60 px-4 py-3">
              <span className="flex flex-col">
                <span className="text-[0.875rem] font-medium text-ink">{target.product?.name}</span>
                <span className="text-[0.75rem] text-ink-40">
                  {[target.size, target.color].filter(Boolean).join(' · ') || 'One size'} ·{' '}
                  {STOCK_LEVEL_LABEL[target.level]}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[0.75rem] text-ink-40">On hand</span>
                <span className={`text-lg tabular-nums ${stockTone(target.level)}`}>
                  {target.stockQuantity}
                </span>
              </span>
            </div>

            {formError && (
              <p role="alert" className="flex items-start gap-2 border border-error/25 bg-error-soft px-4 py-3 text-[0.8125rem] text-error">
                <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}

            <Input
              label="Change"
              type="number"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 12 or -3"
              hint="Add stock with a positive number, remove it with a negative one."
              autoFocus
            />

            <Select
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              hint={REASONS.find((option) => option.key === reason)?.hint}
            >
              {REASONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Textarea
              label="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={300}
              hint="Optional. Kept on the movement record."
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="tertiary" onClick={() => setTarget(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button loading={isSaving} onClick={submitAdjust}>
                Record adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Movement history — the audit trail for every change to this variant. */}
      <Modal
        isOpen={Boolean(historyFor)}
        onClose={() => setHistoryFor(null)}
        title={`History · ${historyFor?.sku ?? ''}`}
        size="lg"
      >
        {isHistoryLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-ink-25" aria-label="Loading history" />
          </div>
        ) : movements.length === 0 ? (
          <p className="py-8 text-center text-[0.8125rem] text-ink-40">
            No movements recorded for this variant yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
            {movements.map((movement) => (
              <li key={movement.id} className="flex items-baseline gap-4 py-3 text-[0.8125rem]">
                <span
                  className={`w-14 shrink-0 text-right font-medium tabular-nums ${
                    movement.quantity > 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {movement.quantity > 0 ? '+' : ''}
                  {movement.quantity}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink-80">
                    {INVENTORY_REASON_LABEL[movement.reason] ?? movement.reason}
                  </span>
                  {movement.note && (
                    <span className="block text-[0.75rem] text-ink-40">{movement.note}</span>
                  )}
                  {movement.reference && (
                    <span className="block text-[0.75rem] text-ink-40">
                      Reference {movement.reference}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right tabular-nums text-ink-60">
                  {movement.balanceAfter} left
                </span>
                <time
                  dateTime={movement.createdAt}
                  className="hidden shrink-0 text-[0.75rem] text-ink-40 sm:block"
                >
                  {new Date(movement.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
