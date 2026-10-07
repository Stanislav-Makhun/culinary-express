// Dispatch Ticket: the operational centre. Header with the ticket stub, lifecycle route,
// one next action and Share; tabs for every area; a right rail for people, Autopilot and messages.
import {
  TYPES, stepsFor, userById, vendorById, quoteFor, timelineFor, autopilotCheckpoints,
  PARTICIPANT_ROLE_LABEL, PERMISSIONS, FULFILMENT, FULFILMENT_LABEL, STEPS, callTimeFor, staffing, ACCEPTED,
} from './data.js';
import { fmtDate, fmtTime, fmtRange, fmtStamp, money, plural } from './fmt.js';
import { useStore, toast } from './store.js';
import {
  actorId, permissionFor, peopleWithAccess, saveFields, suggestFields, setStatus, setFulfilment,
  toggleAutopilot, sendMessage, isParticipant, candidatesFor, offerSeat, offerSuggested, withdrawOffer, simulateReplies,
} from './actions.js';
import { go } from './router.js';
import {
  Button, Icon, Input, Textarea, Tabs, Dialog, Drawer, Avatar, AvatarStack, StatusPill, LifecycleTracker,
  Photo, Toggle, Card, MockTag, cx, Empty,
} from './ui.jsx';
import {
  TicketCtx, BasicsFacts, VendorFacts, FoodFacts, ServicesFacts, StaffFacts, RsvpFacts, MaterialsFacts,
} from './facts.jsx';
import { ShareDialog } from './share.jsx';

const { useState, useEffect } = React;

const ACT_ICON = { create: 'plus', edit: 'edit', suggest: 'edit', accept: 'check', reject: 'x', status: 'route', payment: 'card', share: 'share', staff: 'users' };
const GALLERY = { glasshouse: ['glasshouse', 'dinner', 'florals'], loft: ['loft', 'grill', 'staff'], buffet: ['buffet', 'spice', 'office'], garden: ['garden', 'dinner', 'trattoria'] };

export function TicketPage({ id, tab }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  useEffect(() => {
    if (state.session.role === 'staff' && d) go(`/staff/${id}`);
  }, [state.session.role, id]);
  if (!d) {
    return (
      <div className="page page-narrow">
        <Empty title="This Dispatch isn't here" body="It may have been removed, or the demo was reset." action={<Button variant="primary" href="#/dashboard">Back to Dispatches</Button>} />
      </div>
    );
  }
  if (state.session.role === 'vendor' && !isParticipant(state, d)) {
    return (
      <div className="page page-narrow">
        <Empty title="You don't have access to this Ticket" body={`Vendors see a Dispatch once the owner adds them. ${vendorNameOf(d) ? `This one works with ${vendorNameOf(d)}.` : ''}`}
          action={<Button variant="primary" href="#/dashboard">Back to bookings</Button>} />
      </div>
    );
  }
  return (
    <div className="page">
      <TicketView d={d} tab={tab || 'overview'} onTab={(t) => go(`/ticket/${id}/${t}`)} />
    </div>
  );
}
const vendorNameOf = (d) => (d.vendor?.kind === 'page' ? vendorById(d.vendor.vendorId)?.name : d.vendor?.name);

function nextActionFor(d, role, perm) {
  const pending = d.suggestions.filter((s) => s.status === 'pending');
  const owner = userById(d.ownerId)?.name.split(' ')[0];
  if (role === 'vendor') {
    const fi = FULFILMENT.indexOf(d.fulfilment || 'pending');
    if (['confirmed', 'live'].includes(d.status) && fi < FULFILMENT.length - 1) {
      const next = FULFILMENT[fi + 1];
      return { kind: 'fulfil', next, label: `Mark ${FULFILMENT_LABEL[next].toLowerCase()}`, icon: 'truck', title: 'Keep the Ticket current', body: `Fulfilment is “${FULFILMENT_LABEL[d.fulfilment || 'pending']}”. Everyone sees your update straight away.` };
    }
    if (pending.length) return { kind: 'none', title: 'Your suggestion is with ' + owner, body: `${owner} accepts or rejects it on the Ticket. You will see the outcome in Activity.` };
    if (['suggest', 'edit'].includes(perm) && d.status !== 'completed') return { kind: 'suggest', label: 'Suggest a change', icon: 'edit', title: 'Something to adjust?', body: `Use the Edit buttons on any section. Your edits reach ${owner} as suggestions.` };
    return { kind: 'none', title: 'Nothing needs you right now', body: 'Updates appear in Activity.' };
  }
  const st = staffing(d);
  const lp = userById(d.leadPlannerId)?.name.split(' ')[0];
  if (role === 'planner') {
    if (pending.length) return { kind: 'none', title: `Waiting for ${owner}`, body: `${owner} has ${plural(pending.length, 'suggestion')} to review on this Ticket.` };
    if (['inquiry', 'planning', 'quoted'].includes(d.status)) return { kind: 'none', title: `${owner} is still planning`, body: 'Staff seats open once the deposit is paid. Autopilot tracks the checkpoints until then.' };
    if (d.status === 'confirmed' && st.open > 0) return { kind: 'assign', label: `Assign staff · ${st.open} open`, icon: 'users', title: `${plural(st.open, 'seat')} to fill`, body: 'Offer each seat to someone from the staff pool. They accept or decline on their phone.' };
    if (d.status === 'confirmed' && st.offered > 0) return { kind: 'staffTab', label: 'View staffing', icon: 'users', title: `Waiting on ${plural(st.offered, 'offer')}`, body: `${st.accepted} of ${st.total} seats accepted. Withdraw an offer to give the seat to someone else.` };
  }
  if (role === 'client' && d.status === 'confirmed' && (st.open > 0 || st.offered > 0)) {
    return { kind: 'staffTab', label: 'See staffing', icon: 'users', title: `${lp} is assembling your team`, body: `${st.accepted} of ${st.total} seats accepted. Each person confirms the shift on their phone.` };
  }
  if (pending.length && role === 'client') {
    const by = userById(pending[0].by)?.name;
    return { kind: 'review', label: pending.length > 1 ? `Review ${pending.length} suggestions` : 'Review suggestion', icon: 'edit', title: `${by} suggested a change`, body: 'Accepting updates the Ticket. Both outcomes are logged in Activity.' };
  }
  const q = quoteFor(d);
  switch (d.status) {
    case 'inquiry':
    case 'planning': {
      const step = STEPS.find((s) => s.key === (d.draftStep || 'basics'));
      return { kind: 'continue', label: 'Continue planning', icon: 'arrowRight', title: 'Finish planning', body: `Next step: ${step?.label}. Approve the quote at the end to lock the date.` };
    }
    case 'quoted':
      return { kind: 'pay', label: 'Pay deposit', icon: 'card', title: 'Pay the deposit to confirm', body: `${money(q.deposit)} locks the date with ${vendorNameOf(d)}. Your Lead Planner starts staffing straight after.` };
    case 'confirmed':
      return { kind: 'start', label: 'Start event', icon: 'play', title: 'Confirmed and ready', body: 'Start the event when the team arrives. Status updates from staff and vendors flow into Activity.' };
    case 'live':
      return { kind: 'complete', label: 'Mark completed', icon: 'flag', title: 'Live now', body: 'Staff check-ins and vendor updates appear in Activity as they happen.' };
    default:
      return { kind: 'docs', label: 'View documents', icon: 'doc', title: 'Completed', body: 'Documents and the full Activity log stay on this Ticket.' };
  }
}

export function TicketView({ d, tab, onTab, readOnly }) {
  const state = useStore();
  const role = readOnly ? 'client' : state.session.role;
  const actor = actorId(state, d);
  const perm = readOnly ? 'view' : permissionFor(state, d);
  const isOwner = role === 'client' && !readOnly;
  const canEdit = !readOnly && ['edit', 'suggest'].includes(perm) && d.status !== 'completed';
  const [share, setShare] = useState(false);
  const [msgs, setMsgs] = useState(false);
  const [quick, setQuick] = useState(null);
  const [assignRole, setAssignRole] = useState(null);
  const canAssign = !readOnly && role === 'planner' && ['confirmed', 'live'].includes(d.status);
  const people = peopleWithAccess(d);
  const pending = d.suggestions.filter((s) => s.status === 'pending');
  const visible = stepsFor(d.type).map((s) => s.key);
  const na = nextActionFor(d, role, perm);

  const runNext = () => {
    if (readOnly) return;
    switch (na.kind) {
      case 'review':
        onTab('overview');
        setTimeout(() => document.getElementById(`sugg-${pending[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
        break;
      case 'continue': go(`/builder/${d.id}/${d.draftStep || 'basics'}`); break;
      case 'pay': go(`/checkout/${d.id}`); break;
      case 'start': setStatus(d.id, 'live', actor); toast('Event is live'); break;
      case 'complete': setStatus(d.id, 'completed', actor); toast('Event completed'); break;
      case 'docs': onTab('documents'); break;
      case 'staffTab': onTab('staff'); break;
      case 'assign': onTab('staff'); break;
      case 'suggest': go(`/edit/${d.id}/basics?ret=overview`); break;
      case 'fulfil': setFulfilment(d.id, na.next, actor); toast(`Fulfilment: ${FULFILMENT_LABEL[na.next]}`); break;
      default:
    }
  };

  const tabs = [
    { value: 'overview', label: 'Overview', badge: pending.length || null },
    { value: 'menu', label: 'Menu & Vendors' },
    visible.includes('staff') && { value: 'staff', label: 'Staff' },
    visible.includes('rsvp') && { value: 'guests', label: 'Guests' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'documents', label: 'Documents' },
    { value: 'activity', label: 'Activity' },
  ].filter(Boolean);
  const current = tabs.some((t) => t.value === tab) ? tab : 'overview';
  const editHref = (step) => `#/edit/${d.id}/${step}?ret=${current}`;
  const EditBtn = ({ step }) => (canEdit ? (
    <a className="edit-link" href={editHref(step)}><Icon name="edit" size={15} />{perm === 'suggest' ? 'Suggest edit' : 'Edit'}</a>
  ) : null);
  const scenes = GALLERY[d.photo] || GALLERY.garden;

  return (
    <TicketCtx.Provider value={{ d, canResolve: isOwner, actor, readOnly }}>
      <div className="tk">
        {!readOnly && role === 'planner' ? (
          <div className="tk-banner">
            <Icon name="eye" />
            <span>Viewing as <strong>{userById(actor)?.name}</strong> · Lead Planner · Can edit. You assign staff and run the checkpoints.</span>
          </div>
        ) : null}
        {!readOnly && role === 'vendor' ? (
          <div className="tk-banner">
            <Icon name="eye" />
            <span>Viewing as <strong>{userById(actor)?.name}</strong> · Vendor · {PERMISSIONS[perm]}. {perm === 'suggest' ? 'Your edits become suggestions.' : ''}</span>
          </div>
        ) : null}
        {!readOnly ? (
          <nav className="tk-crumb" aria-label="Breadcrumb">
            <a href="#/dashboard">{role === 'vendor' ? 'Bookings' : 'Dispatches'}</a><Icon name="right" size={14} /><span>{d.name || 'Untitled Dispatch'}</span>
          </nav>
        ) : null}

        <div className="tk-hero">
          <div className="tk-gallery" aria-hidden="true">
            {scenes.map((s, i) => <Photo key={s} scene={s} seed={i + 2} />)}
          </div>
          <div className="stub tk-card">
            <div className="tk-main">
              <div className="row" style={{ gap: 10 }}>
                <span className="eyebrow">{TYPES[d.type].label}</span>
                <StatusPill status={d.status} />
                {pending.length ? <StatusPill tone="amber">{plural(pending.length, 'suggestion')}</StatusPill> : null}
              </div>
              <h1 className="tk-title">{d.name || 'Untitled Dispatch'}</h1>
              <div className="tk-facts">
                <FactChip icon="calendar" text={fmtDate(d.date)} onClick={canEdit ? () => setQuick('when') : null} label="Edit date and time" />
                <FactChip icon="clock" text={fmtRange(d.startTime, d.endTime)} onClick={canEdit ? () => setQuick('when') : null} label="Edit date and time" />
                <FactChip icon="pin" text={d.location || 'Venue not set'} onClick={canEdit ? () => setQuick('where') : null} label="Edit location" />
                <FactChip icon="users" text={plural(d.guestCount, 'guest')} />
              </div>
              <div className="tk-route"><LifecycleTracker status={d.status} compact /></div>
            </div>
            <div className="tk-stub">
              <div className="row-between">
                <span className="num small">{d.ticketNo}</span>
                <span className="eyebrow">Dispatch Ticket</span>
              </div>
              <div>
                <p className="tk-stub-date">{fmtDate(d.date, 'day')}</p>
                <p className="tk-stub-time">{fmtTime(d.startTime)} · call {fmtTime(callTimeFor(d))}</p>
              </div>
              {na.label && !readOnly ? <Button variant="primary" className="btn-block" icon={na.icon} onClick={runNext}>{na.label}</Button> : null}
              <div className="tk-share">
                <AvatarStack people={people} max={4} />
                {isOwner ? <Button variant="secondary" size="sm" icon="share" onClick={() => setShare(true)}>Share</Button> : <span className="small muted">{plural(people.length, 'person', 'people')}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="tk-body">
          <div style={{ minWidth: 0 }}>
            <div className="tk-tabs"><Tabs tabs={tabs} value={current} onChange={onTab} /></div>
            <div className="tk-panel" key={current}>
              {current === 'overview' ? (
                <>
                  <div className="next-card">
                    <div className="grow">
                      <p className="eyebrow">What's next</p>
                      <h3>{na.title}</h3>
                      <p>{na.body}</p>
                    </div>
                    {na.label && !readOnly ? <Button variant="primary" icon={na.icon} onClick={runNext}>{na.label}</Button> : null}
                  </div>
                  <Card title="Event basics" action={<EditBtn step="basics" />}><BasicsFacts d={d} /></Card>
                  {visible.includes('materials') ? <Card title="Materials" action={<EditBtn step="materials" />}><MaterialsFacts d={d} /></Card> : null}
                  <QuoteCard d={d} readOnly={readOnly} isOwner={isOwner} />
                </>
              ) : null}
              {current === 'menu' ? (
                <>
                  <Card title="Vendor" action={<EditBtn step="vendor" />}>
                    <div className="stack">
                      <VendorFacts d={d} />
                      <Fulfilment d={d} canUpdate={!readOnly && role === 'vendor'} actor={actor} />
                    </div>
                  </Card>
                  <Card title="Food" action={<EditBtn step="food" />}><FoodFacts d={d} /></Card>
                  {visible.includes('services') ? <Card title="Services" action={<EditBtn step="services" />}><ServicesFacts d={d} /></Card> : null}
                </>
              ) : null}
              {current === 'staff' ? (
                <>
                  {d.quote?.paid && staffing(d).total ? <StaffingCard d={d} canAssign={canAssign} actor={actor} /> : null}
                  <Card title="Staff" action={<EditBtn step="staff" />}>
                    <StaffFacts d={d} canAssign={canAssign} onAssign={setAssignRole}
                      onWithdraw={(u) => { withdrawOffer(d.id, u, actor); toast('Offer withdrawn. The seat is open again.'); }} />
                  </Card>
                  {!readOnly ? (
                    <div className="row">
                      <Button variant="secondary" icon="phone" href={`#/staff/${d.id}`}>Open the Staff mobile view</Button>
                      <Button variant="ghost" icon="doc" href={`#/doc/${d.id}/staff-sheet`}>Staff Instruction Sheet</Button>
                    </div>
                  ) : null}
                </>
              ) : null}
              {current === 'guests' ? <Card title="Guest RSVP" action={<EditBtn step="rsvp" />}><RsvpFacts d={d} /></Card> : null}
              {current === 'timeline' ? <TimelineCard d={d} /> : null}
              {current === 'documents' ? <DocsCard d={d} readOnly={readOnly} /> : null}
              {current === 'activity' ? <ActivityCard d={d} /> : null}
            </div>
          </div>

          <aside className="tk-rail" aria-label="Ticket details">
            <Card title="Participants" action={isOwner ? <Button size="sm" variant="ghost" onClick={() => setShare(true)}>Manage</Button> : null}>
              <div className="people">
                {people.filter((p) => p.source !== 'staff').map((p) => (
                  <div className="person" key={p.userId || p.email}>
                    <Avatar userId={p.userId} email={p.email} size={36} />
                    <div className="grow">
                      <div className="person-name">{userById(p.userId)?.name || p.email}</div>
                      <div className="person-role">
                        {p.role === 'lead_planner' ? 'Lead Planner · Cülinary Expréss' : PARTICIPANT_ROLE_LABEL[p.role]}
                        {p.staffRole ? ` · ${p.staffRole}` : ''} · {PERMISSIONS[p.permission]}{p.pending ? ' · invite pending' : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {people.some((p) => p.source === 'staff') ? (
                  <div className="person">
                    <AvatarStack people={people.filter((p) => p.source === 'staff')} max={3} size={30} />
                    <div className="grow">
                      <div className="person-name">{people.filter((p) => p.source === 'staff').length} staff</div>
                      <div className="person-role">From the Staff step · Can view</div>
                    </div>
                    {visible.includes('staff') ? <Button size="sm" variant="quiet" onClick={() => onTab('staff')}>See all</Button> : null}
                  </div>
                ) : null}
              </div>
            </Card>
            <AutopilotCard d={d} canToggle={isOwner || (role === 'planner' && !readOnly)} actor={actor} />
            <button type="button" className="msg-entry" onClick={() => !readOnly && setMsgs(true)} disabled={readOnly}>
              <Icon name="message" size={22} />
              <span className="grow" style={{ minWidth: 0 }}>
                <strong style={{ fontWeight: 500 }}>Messages</strong> <span className="small muted">· {(state.threads[d.id] || []).length}</span>
                <span className="preview" style={{ display: 'block' }}>{(state.threads[d.id] || []).slice(-1)[0]?.text || 'Start the conversation'}</span>
              </span>
              <Icon name="right" />
            </button>
          </aside>
        </div>
      </div>

      {!readOnly ? (
        <>
          <ShareDialog open={share} onClose={() => setShare(false)} d={d} actor={actor} />
          <MessagesDrawer open={msgs} onClose={() => setMsgs(false)} d={d} actor={actor} />
          <QuickEdit kind={quick} onClose={() => setQuick(null)} d={d} actor={actor} suggest={perm === 'suggest'} />
          <AssignDialog role={assignRole} onClose={() => setAssignRole(null)} d={d} actor={actor} />
        </>
      ) : null}
    </TicketCtx.Provider>
  );
}

function StaffingCard({ d, canAssign, actor }) {
  const st = staffing(d);
  const people = (d.staff || []).flatMap((s) => s.assigned || []);
  const accepted = people.filter((u) => ACCEPTED.includes(d.staffStatus?.[u]));
  const offered = people.filter((u) => d.staffStatus?.[u] === 'offered');
  const lp = userById(d.leadPlannerId)?.name;
  const bars = [...accepted.map(() => 'is-on'), ...offered.map(() => 'is-offered'), ...Array.from({ length: st.open }, () => '')];
  return (
    <section className="card">
      <div className="row-between">
        <div>
          <p className="eyebrow">Staffing · {lp}, Lead Planner</p>
          <h3 className="card-title" style={{ marginTop: 6 }}>{st.accepted} of {st.total} seats accepted</h3>
        </div>
        {canAssign && st.open > 0 ? (
          <Button variant="primary" icon="users" onClick={() => { const n = offerSuggested(d.id, actor); toast(n ? `Offered ${plural(n, 'shift')} to suggested staff` : 'No free staff match the open seats'); }}>
            Offer open seats to suggested staff
          </Button>
        ) : null}
      </div>
      <div className="staffing-bar" aria-hidden="true">{bars.map((c, i) => <span key={i} className={c} />)}</div>
      <div className="row-between" style={{ marginTop: 10 }}>
        <p className="small muted">
          {st.open ? `${plural(st.open, 'open seat')}` : 'No open seats'} · {plural(st.offered, 'offer')} waiting · each person accepts or declines on their phone.
        </p>
        {st.offered > 0 ? (
          <button type="button" className="edit-link" style={{ margin: 0 }} onClick={() => { simulateReplies(d.id); toast('Demo: the other offered staff accepted'); }}>
            <Icon name="info" size={14} />Demo: simulate staff replies
          </button>
        ) : null}
      </div>
    </section>
  );
}

function AssignDialog({ role, onClose, d, actor }) {
  const state = useStore();
  if (!role) return null;
  const row = d.staff.find((r) => r.role === role);
  const open = row ? row.count - (row.assigned || []).length : 0;
  const list = candidatesFor(state, d, role);
  const match = list.filter((c) => c.match);
  const other = list.filter((c) => !c.match);
  const offer = (u) => {
    offerSeat(d.id, role, u.id, actor);
    toast(`${role} shift offered to ${u.name.split(' ')[0]}. They accept on their phone.`);
    if (open <= 1) onClose();
  };
  const Row = ({ c }) => (
    <div className={cx('picker-row', c.busy && 'is-busy')}>
      <Avatar userId={c.u.id} size={38} />
      <div className="grow">
        <div className="person-name">{c.u.name}</div>
        <div className="person-role">{c.busy ? `Booked that day · ${c.busy.name}` : `Usually ${c.u.title} · ${c.u.phone}`}</div>
      </div>
      <Button size="sm" variant={c.match ? 'primary' : 'secondary'} disabled={!!c.busy} onClick={() => offer(c.u)}>Offer shift</Button>
    </div>
  );
  return (
    <Dialog open onClose={onClose} title={`Assign ${role}`}
      description={`${plural(open, 'open seat')} on ${d.name}, ${fmtDate(d.date, 'day')} · call ${fmtTime(callTimeFor(d))}. The person gets the offer on their phone and accepts or declines.`}>
      {open <= 0 ? <p className="muted">All {role} seats are filled.</p> : (
        <div className="stack" style={{ gap: 4 }}>
          {match.length ? <p className="eyebrow">Usually work as {role}</p> : null}
          <div>{match.map((c) => <Row key={c.u.id} c={c} />)}</div>
          {other.length ? <p className="eyebrow" style={{ marginTop: 12 }}>Other staff</p> : null}
          <div>{other.map((c) => <Row key={c.u.id} c={c} />)}</div>
        </div>
      )}
    </Dialog>
  );
}

function FactChip({ icon, text, onClick, label }) {
  if (onClick) {
    return (
      <button type="button" className="tk-fact" onClick={onClick} aria-label={`${label}: ${text}`}>
        <Icon name={icon} size={16} /><span>{text}</span><Icon name="edit" size={14} className="edit-ic" />
      </button>
    );
  }
  return <span className="tk-fact"><Icon name={icon} size={16} /><span>{text}</span></span>;
}

function QuoteCard({ d, readOnly, isOwner }) {
  const q = d.quote?.lines ? d.quote : quoteFor(d);
  const paid = d.quote?.paid;
  return (
    <Card title="Estimate & payment" action={<MockTag>Mock pricing</MockTag>}>
      <table className="estimate">
        <tbody>
          {(q.lines || []).map((l, i) => <tr key={i}><td>{l.label}{l.note ? <span className="est-note">{l.note}</span> : null}</td><td>{money(l.amount)}</td></tr>)}
          <tr className="est-sub"><td>Platform fee and tax</td><td>{money((q.fee || 0) + (q.tax || 0))}</td></tr>
          <tr className="est-total"><td>{paid ? 'Total' : 'Current estimate'}</td><td>{money(q.total)}</td></tr>
        </tbody>
      </table>
      <div className="row-between" style={{ marginTop: 14 }}>
        <span className="small">
          {paid ? <><StatusPill tone="sage">Deposit paid</StatusPill> <span className="muted">{money(q.deposit)}{d.quote.paidAt ? ` on ${fmtStamp(d.quote.paidAt)}` : ''}</span></>
            : d.status === 'quoted' ? <><StatusPill tone="amber">Deposit due</StatusPill> <span className="muted">{money(q.deposit)}</span></>
              : <span className="muted">The estimate updates as you plan.</span>}
        </span>
        {!readOnly && isOwner && !paid ? (
          d.status === 'quoted' ? <Button size="sm" variant="primary" icon="card" href={`#/checkout/${d.id}`}>Pay deposit</Button>
            : <Button size="sm" variant="secondary" href={`#/builder/${d.id}/review`}>Review & Quote</Button>
        ) : null}
      </div>
    </Card>
  );
}

function Fulfilment({ d, canUpdate, actor }) {
  if (d.vendor?.kind !== 'page') {
    return <p className="small muted">Fulfilment updates arrive once {d.vendor?.name || 'the vendor'} joins the platform. Until then your Lead Planner updates it.</p>;
  }
  const idx = FULFILMENT.indexOf(d.fulfilment || 'pending');
  return (
    <div className="fulfil">
      <div className="row-between">
        <span className="subhead" style={{ margin: 0 }}>Fulfilment status</span>
        <StatusPill tone={idx === FULFILMENT.length - 1 ? 'sage' : idx > 0 ? 'amber' : 'neutral'}>{FULFILMENT_LABEL[d.fulfilment || 'pending']}</StatusPill>
      </div>
      <div className="fulfil-steps" aria-hidden="true">{FULFILMENT.slice(1).map((f, i) => <span key={f} className={cx(i < idx && 'is-on')} />)}</div>
      {canUpdate ? (
        <div className="row">
          {FULFILMENT.slice(1).map((f) => (
            <Button key={f} size="sm" variant={d.fulfilment === f ? 'primary' : 'secondary'} onClick={() => { setFulfilment(d.id, f, actor); toast(`Fulfilment: ${FULFILMENT_LABEL[f]}`); }}>{FULFILMENT_LABEL[f]}</Button>
          ))}
        </div>
      ) : <p className="tiny muted">The vendor updates this. It is a Vendor role action, whatever their permission level.</p>}
    </div>
  );
}

function TimelineCard({ d }) {
  const t = timelineFor(d);
  return (
    <Card title="Timeline" action={<span className="small muted">{fmtDate(d.date, 'day')}</span>}>
      <ol className="timeline">
        {t.map((x, i) => (
          <li key={i} className={cx(['Guests arrive', 'Event ends', 'Food service opens'].includes(x.label) && 'is-key')}>
            <span className="tl-time">{fmtTime(x.time)}</span>
            <span className="tl-dot" aria-hidden="true" />
            <span><span className="tl-label">{x.label}</span><span className="tl-who" style={{ display: 'block' }}>{x.who}</span></span>
          </li>
        ))}
      </ol>
      <p className="small muted" style={{ marginTop: 6 }}>Built from the start and end times. Change the time and the run sheet follows.</p>
    </Card>
  );
}

function DocsCard({ d, readOnly }) {
  const docs = [
    { name: 'Staff Instruction Sheet', meta: 'Roles, call time, contacts, run sheet, materials', href: `#/doc/${d.id}/staff-sheet` },
    { name: 'Driver Instructions', meta: 'Route, loading notes, drop-off contact' },
    { name: 'Labels', meta: 'Tray and allergen labels from the menu' },
    { name: 'Event Timeline', meta: 'Printable run sheet from the Timeline tab' },
  ];
  return (
    <Card title="Documents" action={<span className="small muted">Generated from this Dispatch</span>}>
      <div className="docs">
        {docs.map((x) => {
          const inner = (
            <>
              <span className="doc-thumb"><Icon name="doc" /></span>
              <span className="grow">
                <span className="doc-name" style={{ display: 'block' }}>{x.name}</span>
                <span className="doc-meta" style={{ display: 'block' }}>{x.meta}</span>
                <span className="tiny muted">{x.href ? 'Open preview' : 'Preview in the design phase'}</span>
              </span>
              {x.href ? <Icon name="right" /> : null}
            </>
          );
          return x.href && !readOnly ? <a key={x.name} className="doc" href={x.href}>{inner}</a> : <div key={x.name} className="doc">{inner}</div>;
        })}
      </div>
    </Card>
  );
}

function ActivityCard({ d }) {
  const items = [...d.activity].sort((a, b) => b.at.localeCompare(a.at));
  let lastDay = '';
  return (
    <Card title="Activity" action={<span className="small muted">{plural(items.length, 'entry', 'entries')}</span>}>
      <ul className="activity">
        {items.map((a, i) => {
          const day = new Date(a.at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={i}>
              {showDay ? <li className="act-day" style={{ display: 'block', border: 0 }}>{day}</li> : null}
              <li>
                <span className={cx('act-ic', `k-${a.kind}`)}><Icon name={ACT_ICON[a.kind] || 'dot'} size={15} /></span>
                <span>
                  <span className="act-text" style={{ display: 'block' }}>{a.text}</span>
                  <span className="act-meta">{userById(a.by)?.name || 'Someone'} · {new Date(a.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </span>
              </li>
            </React.Fragment>
          );
        })}
      </ul>
    </Card>
  );
}

function AutopilotCard({ d, canToggle, actor }) {
  const cps = autopilotCheckpoints(d);
  const done = cps.filter((c) => c.done).length;
  const lp = userById(d.leadPlannerId);
  return (
    <section className="card">
      <div className="ap-head">
        <div className="row" style={{ gap: 10 }}>
          <Icon name="route" size={22} />
          <h3 className="card-title" style={{ fontSize: 22 }}>Autopilot</h3>
        </div>
        <Toggle label="Autopilot" checked={d.autopilot.enabled} onChange={() => canToggle ? toggleAutopilot(d.id, actor) : toast('Only the owner can change Autopilot')} />
      </div>
      <p className="ap-status">
        {d.autopilot.enabled
          ? <><strong style={{ fontWeight: 500 }}>On.</strong> {lp?.name} is tracking {done} of {cps.length} checkpoints.</>
          : <><strong style={{ fontWeight: 500 }}>Off.</strong> You run the checkpoints yourself.</>}
      </p>
      <ul className="ap-list">
        {cps.map((c) => (
          <li key={c.label} className={cx(c.done && 'is-done')}>
            <span className="ap-tick">{c.done ? <Icon name="check" size={11} /> : null}</span>{c.label}
          </li>
        ))}
      </ul>
      <p className="ap-note">Your Lead Planner coordinates the checkpoints. The Ticket stays the single source of truth.</p>
    </section>
  );
}

function MessagesDrawer({ open, onClose, d, actor }) {
  const state = useStore();
  const [text, setText] = useState('');
  const thread = state.threads[d.id] || [];
  const endRef = React.useRef(null);
  useEffect(() => { if (open) setTimeout(() => endRef.current?.scrollIntoView(), 30); }, [open, thread.length]);
  const send = () => {
    if (!text.trim()) return;
    sendMessage(d.id, actor, text.trim());
    setText('');
  };
  return (
    <Drawer open={open} onClose={onClose} title="Messages"
      footer={(
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="input" aria-label="Message" placeholder={`Message as ${userById(actor)?.name}`} value={text} onChange={(e) => setText(e.target.value)} />
          <Button variant="primary" icon="send" type="submit" aria-label="Send" />
        </form>
      )}>
      <p className="small muted" style={{ marginBottom: 8 }}>Everyone on this Ticket sees this thread. Messages stay in this demo and are not sent anywhere.</p>
      {thread.map((m, i) => (
        <div key={i} className={cx('msg', m.by === actor && 'is-me')}>
          <Avatar userId={m.by} size={32} />
          <div style={{ minWidth: 0 }}>
            <p className="msg-meta">{userById(m.by)?.name} · {fmtStamp(m.at)}</p>
            <div className="msg-bubble">{m.text}</div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </Drawer>
  );
}

function QuickEdit({ kind, onClose, d, actor, suggest }) {
  const [v, setV] = useState({});
  useEffect(() => {
    if (kind === 'when') setV({ date: d.date, startTime: d.startTime, endTime: d.endTime });
    if (kind === 'where') setV({ location: d.location, venueNotes: d.venueNotes || '' });
  }, [kind]);
  const save = () => {
    if (suggest) {
      const n = suggestFields(d.id, v, actor);
      toast(n ? 'Suggestion sent for review' : 'Nothing changed');
    } else {
      saveFields(d.id, v, actor);
      toast('Saved to the Ticket');
    }
    onClose();
  };
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" icon={suggest ? 'send' : 'check'} onClick={save}>{suggest ? 'Send suggestion' : 'Save'}</Button>
    </>
  );
  return (
    <>
      <Dialog open={kind === 'when'} onClose={onClose} title="Date and time" description={suggest ? 'Your change goes to the owner as a suggestion.' : 'The timeline and staff call time update with it.'} footer={footer} size="sm">
        <div className="form-grid">
          <Input className="span-2" id="q-date" label="Date" type="date" value={v.date || ''} onChange={(e) => setV({ ...v, date: e.target.value })} />
          <Input id="q-start" label="Start time" type="time" value={v.startTime || ''} onChange={(e) => setV({ ...v, startTime: e.target.value })} />
          <Input id="q-end" label="End time" type="time" value={v.endTime || ''} onChange={(e) => setV({ ...v, endTime: e.target.value })} />
        </div>
      </Dialog>
      <Dialog open={kind === 'where'} onClose={onClose} title="Location" description={suggest ? 'Your change goes to the owner as a suggestion.' : 'Vendors and staff see the new address straight away.'} footer={footer} size="sm">
        <div className="stack">
          <Input id="q-loc" label="Venue address" value={v.location || ''} onChange={(e) => setV({ ...v, location: e.target.value })} />
          <Textarea id="q-notes" label="Arrival notes" optional value={v.venueNotes || ''} onChange={(e) => setV({ ...v, venueNotes: e.target.value })} />
        </div>
      </Dialog>
    </>
  );
}
