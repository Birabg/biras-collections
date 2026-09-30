/**
 * Minimal data table for the back office.
 * Header row, body rows, optional status pill. No client sorting — the real
 * implementation should sort server-side.
 */
export default function AdminTable({ columns, rows, rowKey = (row) => row.id, empty = 'Nothing to show.' }) {
  if (!rows.length) {
    return <p className="border border-line bg-paper px-4 py-10 text-center text-[0.8125rem] text-ink-40">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-sand/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line-soft last:border-0 hover:bg-sand/40">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-middle text-[0.8125rem] text-ink-80">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_TONE = {
  Processing: 'bg-sand text-ink-60 border-line',
  Packed: 'bg-warning-soft text-warning border-warning/25',
  Shipped: 'bg-paper text-ink border-ink/20',
  Delivered: 'bg-success-soft text-success border-success/25',
  Cancelled: 'bg-error-soft text-error border-error/25',
  Active: 'bg-success-soft text-success border-success/25',
  Disabled: 'bg-error-soft text-error border-error/25',
};

export function StatusPill({ value }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] ${
        STATUS_TONE[value] ?? 'border-line bg-sand text-ink-60'
      }`}
    >
      {value}
    </span>
  );
}
