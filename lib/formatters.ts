export type SupportedLang = 'en' | 'fr';

/**
 * Formats a CAD currency amount using native Canadian English ($100,000)
 * or Canadian French (100 000 $) conventions.
 */
export function formatCurrencyLocale(
  val: number,
  lang: SupportedLang = 'en',
  maximumFractionDigits: number = 0
): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? maximumFractionDigits : 0,
  }).format(safeVal);
}

/**
 * Compact currency formatter ($1.25M / 1,25 M$, $450k / 450 k$).
 */
export function formatShortCurrencyLocale(
  val: number,
  lang: SupportedLang = 'en'
): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  const abs = Math.abs(safeVal);
  const sign = safeVal < 0 ? '-' : '';

  if (lang === 'fr') {
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(2).replace('.', ',')} M$`;
    }
    if (abs >= 1_000) {
      return `${sign}${Math.round(abs / 1_000)} k$`;
    }
    return formatCurrencyLocale(safeVal, 'fr', 0);
  }

  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return formatCurrencyLocale(safeVal, 'en', 0);
}
