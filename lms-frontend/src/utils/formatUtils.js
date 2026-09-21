export const formatNumber = (value, options = {}) =>
  typeof value === 'number' ? new Intl.NumberFormat(undefined, options).format(value) : '';

export const formatCurrency = (value, currency = 'USD') =>
  formatNumber(value, { style: 'currency', currency });

export const formatPercent = (value, fractionDigits = 0) =>
  formatNumber(value / 100, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export const truncate = (text = '', max = 80) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}...` : text;

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const titleCase = (value = '') =>
  value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
