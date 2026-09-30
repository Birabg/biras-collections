import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, ChevronRight, Info } from 'lucide-react';
import DemoBackendNotice from '../components/auth/DemoBackendNotice';
import { formatPrice } from '../utils/currency';

export default function CheckoutSuccess() {
  const location = useLocation();
  const state = location.state || {};
  const isDemo = state.isDemo === true;
  const itemCount = state.itemCount ?? 0;
  const total = state.total ?? 0;

  return (
    <div className="section-y">
      <div className="shell flex flex-col items-center">
        <div className="w-full max-w-2xl border border-line bg-paper p-8 text-center lg:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-ink bg-ink/5">
            <CheckCircle size={40} strokeWidth={1.75} className="text-ink" />
          </div>

          <h1 className="t-page">Demo checkout complete</h1>
          <p className="t-body mt-3 text-[0.9375rem]">
            {isDemo
              ? 'No order was created — this is an unconnected demonstration only.'
              : 'No order details were recorded in this demo experience.'}
          </p>

          <div className="mt-8">
            <DemoBackendNotice
              title="This is not a real order"
              body="There is no payment gateway or order service behind this flow. Nothing was charged and no order was persisted to a server."
            />
          </div>

          <div className="mt-8 border border-line bg-sand/50 p-6 text-left">
            <h2 className="t-section !text-lg flex items-center gap-2">
              <Package size={18} strokeWidth={1.75} aria-hidden="true" />
              Demo summary
            </h2>
            <dl className="mt-4 flex flex-col gap-2 text-[0.875rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-40">Items</dt>
                <dd className="text-ink">{itemCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-40">Total</dt>
                <dd className="tabular-nums text-ink">{formatPrice(total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-40">Status</dt>
                <dd className="text-ink-60">Unsubmitted (demo only)</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-[0.8125rem] leading-relaxed text-ink-40">
              <Info size={13} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                No confirmation email, SMS, or tracking number was generated. In production, this
                step would only run after server-side authorization and payment capture.
              </span>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              className="inline-flex h-11 items-center justify-center gap-2 border border-ink bg-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              Continue shopping
              <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center gap-2 border border-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-sand focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}