/**
 * Formatting helpers for record detail pages.
 *
 * Kept out of RecordDetail.jsx so that file exports components only — mixing
 * the two breaks React Fast Refresh.
 */

export const DASH = '—';

/** Initials stand in when no photo was uploaded. */
export const initials = (name) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** yyyy-mm-dd from the API into something readable, without a date library. */
export const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : DASH;

/** Flattens an address into the lines worth printing, skipping empty parts. */
export const addressLines = (address) =>
  [
    address?.line1,
    address?.line2,
    [address?.city, address?.state].filter(Boolean).join(', '),
    [address?.country, address?.postalCode].filter(Boolean).join(' '),
  ].filter((line) => line && line.trim());
