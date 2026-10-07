// Formatting helpers. Dates and times never show seconds.
import {
  FIELD_LABELS, TYPES, vendorById, serviceById, vendorName, STAFF_ROLES, SERVICE_STYLES,
} from './data.js';

const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const fmtDate = (s, style = 'long') => {
  if (!s) return '—';
  const d = parseDate(s);
  if (style === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (style === 'day') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (style === 'full') return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};

export const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;

export const money = (n, opts = {}) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('en-US') + (opts.suffix || '');

export const fmtStamp = (isoStr) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const initials = (name) =>
  name.replace(/&/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const plural = (n, word, pl) => `${n} ${n === 1 ? word : pl || word + 's'}`;

export const daysUntil = (s) => {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((parseDate(s) - now) / 86400000);
};

export const whenLabel = (s) => {
  const n = daysUntil(s);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n > 1 && n < 60) return `In ${n} days`;
  if (n < 0 && n > -60) return `${-n} days ago`;
  return fmtDate(s, 'short');
};

// Human text for one field's value. Used by suggestion chips, Activity and the diff log.
export function fieldText(key, v, d) {
  if (v == null || v === '') return 'Not set';
  switch (key) {
    case 'type': return TYPES[v]?.label || v;
    case 'date': return fmtDate(v);
    case 'startTime':
    case 'endTime': return fmtTime(v);
    case 'guestCount': return plural(v, 'guest');
    case 'budget': return money(v);
    case 'vendor': return v.kind === 'page' ? vendorById(v.vendorId)?.name : `${v.name} (manual)`;
    case 'menuItems': return v.length ? v.filter((i) => i.qty > 0).map((i) => `${i.qty} × ${i.name}`).join(', ') : 'None';
    case 'services': return v.length ? v.map((s) => serviceById(s.vendorId)?.name).join(', ') : 'None';
    case 'staff': return v.filter((s) => s.count > 0).map((s) => `${s.count} ${s.role}`).join(', ') || 'None';
    case 'rsvp': return v.enabled ? `On · ${plural(v.guests.length, 'guest')} listed` : 'Off';
    case 'materials': return v.length ? v.map((m) => `${m.item} (${m.providedBy === 'vendor' ? 'vendor' : 'we'})`).join(', ') : 'None';
    default: return String(v);
  }
}

export const fieldLabel = (key) => FIELD_LABELS[key] || key;

export { vendorName, STAFF_ROLES, SERVICE_STYLES };
