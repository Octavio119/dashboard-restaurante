/**
 * Locale-aware formatting utilities for MastexoPOS.
 * Currency is always CLP (restaurant's local currency).
 * Number and date formats change based on the active language.
 */

/** Returns the Intl locale string for the active i18n language. */
export function toIntlLocale(lang) {
  return lang?.startsWith('en') ? 'en-US' : 'es-CL'
}

/**
 * Format a CLP amount with locale-appropriate number separators.
 * ES: $1.234.567  |  EN: $1,234,567
 */
export function formatCurrency(amount, lang) {
  const locale = toIntlLocale(lang)
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
  return `$${num}`
}

/**
 * Format a date with locale-aware words (month names, weekday names).
 * @param {Date|string} date
 * @param {string} lang  - i18n.language value
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(date, lang, options = {}) {
  const locale = toIntlLocale(lang)
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * Format a plain number with locale-appropriate separators.
 * ES: 1.234  |  EN: 1,234
 */
export function formatNumber(value, lang) {
  const locale = toIntlLocale(lang)
  return new Intl.NumberFormat(locale).format(value || 0)
}
