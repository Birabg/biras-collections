import { useState } from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import Button from '../../components/ui/Button';
import { REPORTS, REVENUE_SERIES } from '../../data/adminData';
import { formatPrice } from '../../utils/currency';

const MAX = Math.max(...REVENUE_SERIES.map((point) => point.value));

export default function AdminReports() {
  const [selected, setSelected] = useState(REPORTS[0].key);
  const active = REPORTS.find((report) => report.key === selected);

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Report definitions are in place. Figures require the reporting API."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        {/* Report picker */}
        <nav aria-label="Available reports">
          <ul className="flex flex-col gap-1">
            {REPORTS.map((report) => (
              <li key={report.key}>
                <button
                  type="button"
                  onClick={() => setSelected(report.key)}
                  aria-current={selected === report.key ? 'true' : undefined}
                  className={`group flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors ${
                    selected === report.key
                      ? 'border-ink bg-paper'
                      : 'border-line bg-paper/60 hover:border-ink-25 hover:bg-paper'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] font-medium text-ink">{report.label}</span>
                    <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-ink-40">
                      {report.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={15}
                    strokeWidth={1.75}
                    className="shrink-0 text-ink-25 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Report body */}
        <section className="border border-line bg-paper p-6" aria-labelledby="report-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="report-heading" className="text-sm font-semibold text-ink">
                {active.label}
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-60">{active.description}</p>
            </div>

            <Button size="sm" variant="secondary" disabled>
              Export CSV
            </Button>
          </div>

          <div className="mt-8 flex h-56 items-end gap-2 border-b border-line pb-0" role="img" aria-label={`Placeholder chart for ${active.label}`}>
            {REVENUE_SERIES.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full bg-ink/80 transition-[height] duration-300 hover:bg-ink"
                  style={{ height: `${Math.round((point.value / MAX) * 90)}%` }}
                />
                <span className="pb-2 text-[0.6875rem] text-ink-40">{point.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 border border-line bg-sand px-4 py-3">
            <BarChart3 size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-40" aria-hidden="true" />
            <p className="text-[0.8125rem] leading-relaxed text-ink-60">
              <span className="font-medium text-ink">Placeholder chart.</span> Total shown{' '}
              {formatPrice(REVENUE_SERIES.reduce((sum, point) => sum + point.value, 0))} across the
              week. Replace with server-aggregated figures.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
