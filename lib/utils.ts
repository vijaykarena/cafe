// ClassName join utility
export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

// Currency formatting (defaults to USD, but can be customized)
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Tax calculation helper
export function calculateTaxAmount(subtotal: number, taxPercent: number) {
  return (subtotal * taxPercent) / 100;
}

// Date formatter helper
export function formatDate(dateString: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date);
}
