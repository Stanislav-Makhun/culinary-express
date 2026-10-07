// Labelled renderers for every Builder field. Review & Quote and the Ticket both use these,
// so whatever is entered once in the Builder shows up on the Ticket with its label.
import {
  FIELD_LABELS, TYPES, userById, vendorById, serviceById, priceOf, STAFF_RATE, STAFF_STATUS_LABEL,
} from './data.js';
import { fieldText, fmtDate, fmtTime, money, plural } from './fmt.js';
import { resolveSuggestion } from './actions.js';
import { toast } from './store.js';
import { Avatar, Button, Icon, StatusPill, cx } from './ui.jsx';

export const TicketCtx = React.createContext({ d: null, canResolve: false, actor: null, readOnly: false });

export function SuggestionRow({ s }) {
  const { d, canResolve, actor, readOnly } = React.useContext(TicketCtx);
  const by = userById(s.by)?.name || 'A participant';
  const owner = userById(d.ownerId)?.name.split(' ')[0] || 'the owner';
  return (
    <div className="sugg" id={`sugg-${s.id}`}>
      <Icon name="edit" size={16} />
      <div className="sugg-text">
        <span className="sugg-from">{fieldText(s.field, s.from, d)}</span>
        <Icon name="arrowRight" size={14} />
        <span className="sugg-to">{fieldText(s.field, s.to, d)}</span>
        <span className="sugg-by">· suggested by {by}</span>
      </div>
      {canResolve && !readOnly ? (
        <div className="sugg-actions">
          <Button size="sm" variant="secondary" onClick={() => { resolveSuggestion(d.id, s.id, false, actor); toast('Suggestion rejected'); }}>Reject</Button>
          <Button size="sm" variant="primary" icon="check" onClick={() => { resolveSuggestion(d.id, s.id, true, actor); toast(`Accepted · ${FIELD_LABELS[s.field]} updated`); }}>Accept</Button>
        </div>
      ) : (
        <span className="sugg-wait">Waiting for {owner}</span>
      )}
    </div>
  );
}

const pendingFor = (d, k) => (d.suggestions || []).filter((s) => s.field === k && s.status === 'pending');

export function Fact({ k, d, children, wide, label }) {
  const pending = pendingFor(d, k);
  const value = children !== undefined ? children : fieldText(k, d[k], d);
  const empty = value === 'Not set' || value === '' || value == null;
  return (
    <div className={cx('fact', wide && 'fact-wide', pending.length && 'has-suggestion')}>
      <dt>{label || FIELD_LABELS[k]}</dt>
      <dd className={empty ? 'is-empty' : undefined}>{empty ? 'Not set' : value}</dd>
      {pending.map((s) => <SuggestionRow key={s.id} s={s} />)}
    </div>
  );
}

// A section-level suggestion (for list fields such as the menu).
export function SectionSuggestions({ d, k }) {
  const pending = pendingFor(d, k);
  if (!pending.length) return null;
  return <div className="stack">{pending.map((s) => <SuggestionRow key={s.id} s={s} />)}</div>;
}

export function BasicsFacts({ d }) {
  return (
    <dl className="facts-grid">
      <Fact k="type" d={d} />
      <Fact k="name" d={d} />
      <Fact k="date" d={d} />
      <Fact k="guestCount" d={d} />
      <Fact k="startTime" d={d} />
      <Fact k="endTime" d={d} />
      <Fact k="location" d={d} wide />
      <Fact k="venueNotes" d={d} wide />
      <Fact k="budget" d={d}>{d.budget ? money(d.budget) : 'Not set'}</Fact>
    </dl>
  );
}

export function VendorFacts({ d }) {
  const v = d.vendor?.kind === 'page' ? vendorById(d.vendor.vendorId) : null;
  return (
    <dl className="facts-grid">
      <Fact k="vendor" d={d}>
        {!d.vendor ? 'Not set' : v ? (
          <span>{v.name} <span className="muted">· {v.cuisine} · Vendor Page</span></span>
        ) : (
          <span>{d.vendor.name} <span className="muted">· Manual Vendor Template</span></span>
        )}
      </Fact>
      {d.vendor?.kind === 'manual' ? <Fact k="vendor" d={{ ...d, suggestions: [] }} label="Vendor contact">{d.vendor.contact || 'Not set'}</Fact> : null}
      {v ? <Fact k="vendor" d={{ ...d, suggestions: [] }} label="Vendor contact">{userById(v.userId)?.title} · {userById(v.userId)?.email}</Fact> : null}
    </dl>
  );
}

export function MenuTable({ d }) {
  const items = (d.menuItems || []).filter((i) => i.qty > 0);
  if (!items.length) return <p className="muted">No menu items yet.</p>;
  const total = items.reduce((s, i) => s + (priceOf(d, i) || 0) * i.qty, 0);
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr><th>{FIELD_LABELS.menuItems}</th><th className="r">Price</th><th className="r">Qty</th><th className="r">Line</th></tr>
        </thead>
        <tbody>
          {items.map((i, n) => {
            const p = priceOf(d, i);
            return (
              <tr key={n}>
                <td>{i.name}</td>
                <td className="r num">{p != null ? money(p) : <span className="muted">Vendor prices</span>}</td>
                <td className="r num">{i.qty}</td>
                <td className="r num">{p != null ? money(p * i.qty) : '—'}</td>
              </tr>
            );
          })}
          <tr><td colSpan="3" className="muted">Food subtotal</td><td className="r num"><strong>{money(total)}</strong></td></tr>
        </tbody>
      </table>
    </div>
  );
}

export function FoodFacts({ d }) {
  return (
    <div className="stack">
      <MenuTable d={d} />
      <SectionSuggestions d={d} k="menuItems" />
      <dl className="facts-grid">
        <Fact k="serviceStyle" d={d} />
        <Fact k="dietaryNotes" d={d} />
      </dl>
    </div>
  );
}

export function ServicesFacts({ d }) {
  const list = (d.services || []).map((s) => serviceById(s.vendorId)).filter(Boolean);
  return (
    <div className="stack">
      {list.length ? (
        <table className="data-table">
          <thead><tr><th>Category</th><th>Vendor</th><th className="r">Price</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}><td>{s.category}</td><td>{s.name}<div className="tiny muted">{s.detail}</div></td><td className="r num">{money(s.price)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">No services added.</p>}
      <SectionSuggestions d={d} k="services" />
    </div>
  );
}

const staffTone = (st) => ({ offered: 'amber', on_way: 'sage', arrived: 'sage', completed: 'muted' }[st] || 'neutral');

// canAssign: the Lead Planner sees Assign on open seats and Withdraw on pending offers.
export function StaffFacts({ d, assigned = true, canAssign, onAssign, onWithdraw }) {
  const rows = (d.staff || []).filter((s) => s.count > 0);
  const paid = !!d.quote?.paid;
  const planner = userById(d.leadPlannerId)?.name.split(' ')[0] || 'Your Lead Planner';
  // One table row per seat: people first (offered or accepted), then each open seat.
  const seats = (s) => {
    const people = (s.assigned || []).map((u) => ({ u }));
    const open = s.count - people.length;
    if (!paid && !people.length) return [{ note: 'Seats open after the deposit' }];
    return [...people, ...Array.from({ length: Math.max(0, open) }, () => ({ open: true }))];
  };
  return (
    <div className="stack">
      {rows.length ? (
        <div className="table-scroll">
          <table className="data-table staff-table">
            <thead>
              <tr>
                <th>Role</th>
                <th className="r">Count</th>
                {assigned ? <><th>Person</th><th>Status</th></> : null}
                <th className="r">Rate</th>
              </tr>
            </thead>
            {rows.map((s) => {
              const list = assigned ? seats(s) : [null];
              return (
                <tbody key={s.role} className="staff-group">
                  {list.map((seat, i) => (
                    <tr key={i}>
                      {i === 0 ? <td rowSpan={list.length} className="staff-role">{s.role}</td> : null}
                      {i === 0 ? <td rowSpan={list.length} className="r num staff-role">{s.count}</td> : null}
                      {assigned ? (
                        seat.u ? (
                          <>
                            <td className="staff-person">
                              <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                                <Avatar userId={seat.u} size={28} />
                                <span>{userById(seat.u)?.name}</span>
                              </span>
                            </td>
                            <td>
                              <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                                <StatusPill tone={staffTone(d.staffStatus?.[seat.u])}>{STAFF_STATUS_LABEL[d.staffStatus?.[seat.u] || 'assigned']}</StatusPill>
                                {canAssign && d.staffStatus?.[seat.u] === 'offered' ? (
                                  <button type="button" className="edit-link" style={{ margin: 0 }} onClick={() => onWithdraw(seat.u)}>Withdraw</button>
                                ) : null}
                              </span>
                            </td>
                          </>
                        ) : seat.open ? (
                          <>
                            <td className="staff-person">
                              <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                                <span className="seat-open" aria-hidden="true" />
                                <span className="muted">Open seat</span>
                              </span>
                            </td>
                            <td>
                              {canAssign
                                ? <Button size="sm" variant="secondary" icon="plus" onClick={() => onAssign(s.role)}>Assign</Button>
                                : <span className="small muted">{planner} is assigning</span>}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="muted small staff-person">{seat.note}</td>
                            <td className="muted small">—</td>
                          </>
                        )
                      ) : null}
                      {i === 0 ? <td rowSpan={list.length} className="r num staff-role">{money(STAFF_RATE[s.role])}/h</td> : null}
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      ) : <p className="muted">No staff requested.</p>}
      <SectionSuggestions d={d} k="staff" />
      <dl className="facts-grid"><Fact k="staffNotes" d={d} wide /></dl>
    </div>
  );
}

export function RsvpFacts({ d, list = true }) {
  const g = d.rsvp?.guests || [];
  const c = (st) => g.filter((x) => x.status === st).length;
  if (!d.rsvp?.enabled) {
    return (
      <div className="stack">
        <dl className="facts-grid"><Fact k="rsvp" d={d}>Off · not collecting RSVPs</Fact></dl>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="rsvp-stats">
        <div className="rsvp-stat"><div className="n">{c('yes')}</div><div className="l">Attending</div></div>
        <div className="rsvp-stat"><div className="n">{c('pending')}</div><div className="l">Waiting</div></div>
        <div className="rsvp-stat"><div className="n">{c('no')}</div><div className="l">Declined</div></div>
        <div className="rsvp-stat"><div className="n">{d.guestCount}</div><div className="l">Guest count</div></div>
      </div>
      {list ? (
        g.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Guest</th><th>Email</th><th className="r">RSVP</th></tr></thead>
              <tbody>
                {g.map((x, i) => (
                  <tr key={i}>
                    <td>{x.name}</td>
                    <td className="muted small">{x.email}</td>
                    <td className="r"><StatusPill tone={x.status === 'yes' ? 'sage' : x.status === 'no' ? 'muted' : 'amber'}>{{ yes: 'Attending', no: 'Declined', pending: 'Waiting' }[x.status]}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No guests listed yet. Invitations go out from the guest list.</p>
      ) : null}
      <SectionSuggestions d={d} k="rsvp" />
    </div>
  );
}

export function MaterialsFacts({ d }) {
  const m = d.materials || [];
  const v = m.filter((x) => x.providedBy === 'vendor').map((x) => x.item);
  const u = m.filter((x) => x.providedBy === 'us').map((x) => x.item);
  return (
    <div className="stack">
      <dl className="facts-grid">
        <Fact k="materials" d={{ ...d, suggestions: [] }} label="Vendor provides">{v.length ? v.join(', ') : 'None'}</Fact>
        <Fact k="materials" d={{ ...d, suggestions: [] }} label="We provide">{u.length ? u.join(', ') : 'None'}</Fact>
      </dl>
      <SectionSuggestions d={d} k="materials" />
    </div>
  );
}

export const typeLabel = (d) => TYPES[d.type]?.label;
export { fmtDate, fmtTime, money, plural };
