export function formatCurrency(amount, currency = 'ETB') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPrice(amount) {
  return `${amount.toLocaleString()} ETB`;
}