/**
 * Utility functions for AG Grid column formatters
 * These are defined at module level to avoid closure issues with React Server Components
 */

import type { ValueFormatterParams } from 'ag-grid-community';

/**
 * Format a date value for display in AG Grid
 */
export function createDateFormatter(locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (params: ValueFormatterParams): string => {
    const value = params.value;
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return formatter.format(date);
  };
}

/**
 * Format a number as currency
 */
export function createCurrencyFormatter(locale: string, currency = 'USD') {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (params: ValueFormatterParams): string => {
    const value = params.value;
    if (value == null) return '—';

    return formatter.format(Number(value));
  };
}

/**
 * Format a number with locale-specific formatting
 */
export function createNumberFormatter(locale: string, options?: Intl.NumberFormatOptions) {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  return (params: ValueFormatterParams): string => {
    const value = params.value;
    if (value == null) return '—';

    return formatter.format(Number(value));
  };
}

/**
 * Fallback formatter for null/undefined values
 */
export const fallbackFormatter = (params: ValueFormatterParams): string => {
  return params.value ?? '—';
};

/**
 * Type label formatter
 */
export function createEnumFormatter<T extends string>(
  mapping: Record<T, string>
) {
  return (params: ValueFormatterParams): string => {
    const value = params.value as T;
    return mapping[value] ?? value ?? '—';
  };
}
