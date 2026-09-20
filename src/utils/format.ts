export function formatMoney(
  amount: number,
  currency: string = 'TND',
  options?: {
    decimals?: number;
    showSign?: boolean;
    currencyPosition?: 'prefix' | 'suffix';
  }
): string {
  const decimals = options?.decimals ?? (currency === 'TND' ? 2 : 2);
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formattedNumber = absAmount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const sign = options?.showSign ? (isNegative ? '-' : '+') : isNegative ? '-' : '';
  const position = options?.currencyPosition ?? (currency === 'USD' || currency === 'EUR' || currency === 'GBP' ? 'prefix' : 'suffix');

  if (position === 'prefix') {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency + ' ';
    return `${sign}${symbol}${formattedNumber}`;
  } else {
    return `${sign}${formattedNumber} ${currency}`;
  }
}

export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTimeDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
