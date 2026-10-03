/**
 * Data table for the back office.
 *
 * Header row, body rows, optional status pill. Sorting and filtering belong to
 * the server, so this stays presentational — a column opts into right
 * alignment with `align: 'right'`, which is what an actions column wants.
 */
export default function AdminTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  empty = 'Nothing to show.',
  caption,
}) {
  if (!rows.length) {
    return (
      <p className="border border-line bg-paper px-4 py-10 text-center text-[0.8125rem] text-ink-40">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="border-b border-line bg-sand/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-40 ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-line-soft transition-colors last:border-0 hover:bg-sand/40"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 align-middle text-[0.8125rem] text-ink-80 ${
                    column.align === 'right' ? 'text-right' : ''
                  }`}
                >
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
  Archived: 'bg-sand text-ink-40 border-line',
  Featured: 'bg-warning-soft text-warning border-warning/25',
  Pending: 'bg-sand text-ink-60 border-line',
  Confirmed: 'bg-sand text-ink-60 border-line',
  Paid: 'bg-success-soft text-success border-success/25',
  Failed: 'bg-error-soft text-error border-error/25',
  Refunded: 'bg-sand text-ink-60 border-line',

  // Stock bands. Deliberately not reusing the order tones: "low stock" is not
  // an order state and reading it as a warning about an order would be wrong.
  'In stock': 'bg-success-soft text-success border-success/25',
  'Low stock': 'bg-warning-soft text-warning border-warning/25',
  'Out of stock': 'bg-error-soft text-error border-error/25',
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
