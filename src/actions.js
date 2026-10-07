// State transitions. Every change to a Dispatch writes an Activity entry.
import { update, getState } from './store.js';
import {
  FIELD_LABELS, USERS, userById, vendorById, quoteFor, defaultChecklist, LIFECYCLE_LABEL,
  FULFILMENT_LABEL, STAFF_STATUS_LABEL, PARTICIPANT_ROLE_LABEL, PERMISSIONS, stepsFor,
} from './data.js';
import { fieldText, fieldLabel } from './fmt.js';

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);
const find = (s, id) => s.dispatches.find((d) => d.id === id);
const log = (d, by, kind, text) => d.activity.push({ at: now(), by, kind, text });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const short = (s, n = 70) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export const changeText = (key, from, to, d) =>
  `${fieldLabel(key)}: ${short(fieldText(key, from, d))} → ${short(fieldText(key, to, d))}`;

// ------------------------------------------------------------ who is acting

export function actorId(state, d) {
  const role = state.session.role;
  if (role === 'client') return state.session.userId || 'u-maya';
  if (role === 'vendor') {
    if (d) {
      const p = d.participants.find((x) => x.role === 'vendor' && userById(x.userId)?.vendorId?.startsWith('v-'));
      if (p) return p.userId;
    }
    return 'u-bella';
  }
  if (d) {
    const assigned = (d.staff || []).flatMap((s) => s.assigned || []);
    if (assigned.includes('u-diego')) return 'u-diego';
    if (assigned.length) return assigned[0];
  }
  return 'u-diego';
}

// What the current role may do on this Dispatch.
export function permissionFor(state, d) {
  const role = state.session.role;
  if (role === 'client') return 'edit';
  const me = actorId(state, d);
  const p = d.participants.find((x) => x.userId === me);
  if (role === 'vendor') return p ? p.permission : 'view';
  return 'view';
}

export function isParticipant(state, d) {
  const role = state.session.role;
  if (role === 'client') return true;
  const me = actorId(state, d);
  if (role === 'vendor') return d.participants.some((p) => p.userId === me);
  return (d.staff || []).some((s) => (s.assigned || []).includes(me));
}

// Everyone with access: explicit participants plus staff assigned in the Staff step.
// Guests never appear here.
export function peopleWithAccess(d) {
  const list = d.participants.map((p) => ({ ...p, source: 'invited' }));
  (d.staff || []).forEach((s) =>
    (s.assigned || []).forEach((userId) => {
      if (!list.some((p) => p.userId === userId)) list.push({ userId, role: 'staff', permission: 'view', source: 'staff', staffRole: s.role });
    }),
  );
  return list;
}

// ------------------------------------------------------------ lifecycle helpers

export function createDispatch() {
  let id;
  update((s) => {
    const n = s.nextTicket++;
    id = `cx-${n}`;
    const date = new Date();
    date.setDate(date.getDate() + 24);
    s.dispatches.push({
      id, ticketNo: `CX-${n}`, ownerId: s.session.userId || 'u-maya', leadPlannerId: 'u-ava',
      name: '', type: 'catered_event', status: 'inquiry', photo: 'garden',
      date: date.toISOString().slice(0, 10), startTime: '18:00', endTime: '22:00',
      location: '', venueNotes: '', guestCount: 50, budget: null,
      vendor: null, menuItems: [], serviceStyle: 'Plated', dietaryNotes: '',
      services: [], staff: [], staffNotes: '',
      rsvp: { enabled: false, guests: [] }, materials: [],
      quote: null, fulfilment: 'pending',
      participants: [
        { userId: s.session.userId || 'u-maya', role: 'owner', permission: 'edit' },
        { userId: 'u-ava', role: 'lead_planner', permission: 'edit' },
      ],
      linkAccess: 'invited_only', autopilot: { enabled: true }, suggestions: [],
      checklists: {}, staffStatus: {}, draftStep: 'basics', created: now(),
      activity: [{ at: now(), by: s.session.userId || 'u-maya', kind: 'create', text: 'Created the Dispatch' }],
    });
    s.session.lastDispatchId = id;
    s.session.hideSeeds = false;
  });
  return id;
}

function syncVendorParticipant(d) {
  // The restaurant chosen in the Vendor step joins the Ticket as Vendor · Can suggest.
  d.participants = d.participants.filter((p) => !(p.role === 'vendor' && p.auto));
  if (d.vendor?.kind === 'page') {
    const v = vendorById(d.vendor.vendorId);
    if (v && !d.participants.some((p) => p.userId === v.userId)) {
      d.participants.push({ userId: v.userId, role: 'vendor', permission: 'suggest', auto: true });
    }
  }
}

// Owner (or Can edit) save: applies the patch and logs each changed field.
export function saveFields(id, patch, by, opts = {}) {
  update((s) => {
    const d = find(s, id);
    const changes = [];
    Object.entries(patch).forEach(([k, v]) => {
      if (!same(d[k], v)) {
        if (k in FIELD_LABELS && !opts.silent) changes.push(changeText(k, d[k], v, d));
        d[k] = v;
      }
    });
    if ('vendor' in patch) syncVendorParticipant(d);
    if (opts.draftStep) d.draftStep = opts.draftStep;
    if (d.status === 'inquiry' && d.vendor) {
      d.status = 'planning';
      changes.push(`Status: ${LIFECYCLE_LABEL.inquiry} → ${LIFECYCLE_LABEL.planning}`);
    }
    // A change after the quote was issued puts an unpaid quote back into planning.
    if (d.status === 'quoted' && !d.quote?.paid && changes.length && !opts.keepStatus) {
      d.status = 'planning';
    }
    const pending = d.suggestions.filter((x) => x.status === 'pending');
    pending.forEach((x) => {
      if (x.field in patch && same(d[x.field], x.to)) x.status = 'accepted';
    });
    const statusChanges = changes.filter((t) => t.startsWith('Status'));
    const fieldChanges = changes.filter((t) => !t.startsWith('Status'));
    // While a Dispatch is first being built, one line per step keeps Activity readable.
    if (opts.creating) {
      if (fieldChanges.length) log(d, by, 'edit', opts.creating);
    } else fieldChanges.forEach((t) => log(d, by, 'edit', t));
    statusChanges.forEach((t) => log(d, by, 'status', t));
    s.session.lastDispatchId = id;
  });
}

// Can-suggest save: each changed field becomes a pending suggestion instead of an overwrite.
export function suggestFields(id, patch, by) {
  let count = 0;
  update((s) => {
    const d = find(s, id);
    Object.entries(patch).forEach(([k, v]) => {
      if (!(k in FIELD_LABELS) || same(d[k], v)) return;
      d.suggestions = d.suggestions.filter((x) => !(x.field === k && x.status === 'pending'));
      d.suggestions.push({ id: uid(), field: k, from: d[k], to: v, by, at: now(), status: 'pending' });
      log(d, by, 'suggest', `Suggested ${changeText(k, d[k], v, d)}`);
      count++;
    });
  });
  return count;
}

export function resolveSuggestion(id, sid, accept, by) {
  update((s) => {
    const d = find(s, id);
    const sg = d.suggestions.find((x) => x.id === sid);
    if (!sg || sg.status !== 'pending') return;
    sg.status = accept ? 'accepted' : 'rejected';
    sg.resolvedAt = now();
    sg.resolvedBy = by;
    const text = changeText(sg.field, sg.from, sg.to, d);
    if (accept) {
      d[sg.field] = sg.to;
      if (sg.field === 'vendor') syncVendorParticipant(d);
    }
    log(d, by, accept ? 'accept' : 'reject', `${accept ? 'Accepted' : 'Rejected'} suggestion from ${userById(sg.by)?.name} · ${text}`);
  });
}

export function approveQuote(id, by) {
  update((s) => {
    const d = find(s, id);
    const q = quoteFor(d);
    if (['inquiry', 'planning'].includes(d.status)) {
      log(d, by, 'status', `Status: ${LIFECYCLE_LABEL[d.status]} → ${LIFECYCLE_LABEL.quoted}`);
      d.status = 'quoted';
    }
    d.quote = { ...q, paid: false };
    log(d, by, 'edit', `Approved the quote · total $${q.total.toLocaleString('en-US')}, deposit $${q.deposit.toLocaleString('en-US')}`);
    d.draftStep = 'review';
  });
}

function assignStaff(d) {
  const used = new Set((d.staff || []).flatMap((s) => s.assigned || []));
  const pool = USERS.filter((u) => u.kind === 'staff');
  const rows = d.staff || [];
  rows.forEach((row) => { row.assigned = (row.assigned || []).slice(0, row.count); });
  const take = (row, u) => {
    if (u && row.assigned.length < row.count && !used.has(u.id)) {
      row.assigned.push(u.id);
      used.add(u.id);
    }
  };
  // Diego is the demo's staff persona, so he takes a Server seat when there is one.
  rows.filter((r) => r.role === 'Server').forEach((r) => take(r, userById('u-diego')));
  // First pass: people whose usual role matches. Second pass: fill any open seats.
  rows.forEach((row) => pool.filter((u) => u.title === row.role).forEach((u) => take(row, u)));
  rows.forEach((row) => pool.forEach((u) => take(row, u)));
  rows.flatMap((s) => s.assigned).forEach((uidv) => {
    if (!d.staffStatus[uidv]) d.staffStatus[uidv] = 'confirmed';
  });
}

export function payDeposit(id, by) {
  update((s) => {
    const d = find(s, id);
    const q = quoteFor(d);
    d.quote = { ...q, paid: true, paidAt: now() };
    log(d, by, 'payment', `Paid the $${q.deposit.toLocaleString('en-US')} deposit (mock Square checkout)`);
    log(d, 'u-ava', 'status', `Status: ${LIFECYCLE_LABEL[d.status]} → ${LIFECYCLE_LABEL.confirmed}`);
    d.status = 'confirmed';
    d.draftStep = null;
    if ((d.staff || []).some((x) => x.count > 0)) {
      assignStaff(d);
      const names = d.staff.flatMap((x) => x.assigned).map((u) => userById(u)?.name.split(' ')[0]);
      log(d, 'u-ava', 'edit', `Assigned staff: ${names.join(', ')}`);
    }
    if (d.vendor?.kind === 'page') d.fulfilment = 'accepted';
    s.session.lastDispatchId = id;
  });
}

export function setStatus(id, status, by) {
  update((s) => {
    const d = find(s, id);
    if (d.status === status) return;
    log(d, by, 'status', `Status: ${LIFECYCLE_LABEL[d.status]} → ${LIFECYCLE_LABEL[status]}`);
    d.status = status;
  });
}

export function setFulfilment(id, value, by) {
  update((s) => {
    const d = find(s, id);
    d.fulfilment = value;
    log(d, by, 'status', `Fulfilment: ${FULFILMENT_LABEL[value]}`);
  });
}

export function setStaffStatus(id, userId, status) {
  update((s) => {
    const d = find(s, id);
    d.staffStatus[userId] = status;
    log(d, userId, 'status', `${userById(userId)?.name}: ${STAFF_STATUS_LABEL[status]}`);
  });
}

export function checklistFor(d, userId) {
  return (d.checklists && d.checklists[userId]) || defaultChecklist(d);
}

export function toggleCheck(id, userId, checkId) {
  update((s) => {
    const d = find(s, id);
    d.checklists = d.checklists || {};
    const list = checklistFor(d, userId).map((c) => (c.id === checkId ? { ...c, done: !c.done } : c));
    d.checklists[userId] = list;
  });
}

// ------------------------------------------------------------ sharing

export function invite(id, person, role, permission, by) {
  update((s) => {
    const d = find(s, id);
    if (person.userId) {
      if (d.participants.some((p) => p.userId === person.userId)) return;
      d.participants.push({ userId: person.userId, role, permission });
      log(d, by, 'share', `Invited ${userById(person.userId)?.name} as ${PARTICIPANT_ROLE_LABEL[role]} · ${PERMISSIONS[permission]}`);
    } else {
      d.participants.push({ email: person.email, userId: null, role, permission, pending: true });
      log(d, by, 'share', `Invited ${person.email} as ${PARTICIPANT_ROLE_LABEL[role]} · ${PERMISSIONS[permission]} (pending sign-up)`);
    }
  });
}

const pKey = (p) => p.userId || p.email;

export function changePermission(id, key, permission, by) {
  update((s) => {
    const d = find(s, id);
    const p = d.participants.find((x) => pKey(x) === key);
    if (!p || p.permission === permission) return;
    p.permission = permission;
    log(d, by, 'share', `${userById(p.userId)?.name || p.email}: ${PERMISSIONS[permission]}`);
  });
}

export function removeParticipant(id, key, by) {
  update((s) => {
    const d = find(s, id);
    const p = d.participants.find((x) => pKey(x) === key);
    d.participants = d.participants.filter((x) => pKey(x) !== key);
    if (p) log(d, by, 'share', `Removed ${userById(p.userId)?.name || p.email}`);
  });
}

export function setLinkAccess(id, value, by) {
  update((s) => {
    const d = find(s, id);
    d.linkAccess = value;
    log(d, by, 'share', value === 'anyone_view' ? 'Link access: Anyone with the link can view' : 'Link access: Only invited people');
  });
}

export function toggleAutopilot(id, by) {
  update((s) => {
    const d = find(s, id);
    d.autopilot.enabled = !d.autopilot.enabled;
    log(d, by, 'edit', `Autopilot ${d.autopilot.enabled ? 'on' : 'off'}`);
  });
}

export function sendMessage(id, by, text) {
  update((s) => {
    s.threads[id] = s.threads[id] || [];
    s.threads[id].push({ at: now(), by, text });
  });
}

export function setSession(patch) {
  update((s) => Object.assign(s.session, patch));
}

export function hideSeeds(value) {
  update((s) => {
    s.session.hideSeeds = value;
  });
}

export function deleteDispatch(id) {
  update((s) => {
    s.dispatches = s.dispatches.filter((d) => d.id !== id);
  });
}

// The next builder step after `step` for this dispatch's type.
export function nextStep(d, step) {
  const steps = stepsFor(d.type);
  const i = steps.findIndex((x) => x.key === step);
  return steps[i + 1]?.key || null;
}
export function prevStep(d, step) {
  const steps = stepsFor(d.type);
  const i = steps.findIndex((x) => x.key === step);
  return steps[i - 1]?.key || null;
}

export const findDispatch = (id) => getState().dispatches.find((d) => d.id === id);
