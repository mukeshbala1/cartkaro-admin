// src/utils/dateUtils.js
export function formatDate(value) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.() || value;
  if (!(date instanceof Date) || isNaN(date)) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.() || value;
  if (!(date instanceof Date) || isNaN(date)) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isToday(value) {
  if (!value) return false;
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.() || value;
  if (!(date instanceof Date) || isNaN(date)) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export const BUSINESS_TYPE_LABELS = {
  grocery: 'Grocery',
  restaurant: 'Restaurant',
  medical: 'Medical',
};
