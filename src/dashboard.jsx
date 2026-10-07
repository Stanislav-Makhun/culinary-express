// App header and the role dashboards. Client sees one list of Dispatches grouped by status.
import { TYPES, STEPS, userById, vendorById, callTimeFor } from './data.js';
import { fmtDate, fmtTime, plural, whenLabel } from './fmt.js';
import { useStore } from './store.js';
import { createDispatch, peopleWithAccess, actorId, hideSeeds } from './actions.js';
import { go } from './router.js';
import { Button, Icon, Emblem, Wordmark, Photo, StatusPill, AvatarStack, Avatar, Empty, cx } from './ui.jsx';

const ROLE_LABEL = { client: 'Client', vendor: 'Vendor', staff: 'Staff' };

export function AppHeader({ active }) {
  const state = useStore();
  const role = state.session.role;
  const d = state.dispatches.find((x) => x.id === state.session.lastDispatchId);
  const me = actorId(state, role === 'client' ? null : d);
  const u = userById(me);
  return (
    <header className="appbar">
      <div className="appbar-in">
        <a className="brand" href="#/dashboard" aria-label="Cülinary Expréss dashboard">
          <Emblem size={42} />
          <Wordmark size="md" />
        </a>
        <nav className="appnav" aria-label="Main">
          <a href="#/dashboard" className={cx(active === 'dashboard' && 'is-on')}>{role === 'vendor' ? 'Bookings' : role === 'staff' ? 'Shifts' : 'Dispatches'}</a>
        </nav>
        <div className="me">
          <Avatar userId={me} size={38} />
          <div className="me-text">
            <div className="me-name">{u?.name}</div>
            <div className="me-role">{ROLE_LABEL[role]}{role === 'vendor' ? ' · Vendor Page' : ''}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

const GROUPS = [
  { key: 'live', title: 'Live now', match: ['live'] },
  { key: 'upcoming', title: 'Confirmed', match: ['confirmed'] },
  { key: 'planning', title: 'In planning', match: ['inquiry', 'planning', 'quoted'] },
  { key: 'done', title: 'Completed', match: ['completed'] },
];

function nextLine(d) {
  const pending = d.suggestions.filter((s) => s.status === 'pending').length;
  if (pending) return { text: `${plural(pending, 'suggestion')} to review`, alert: true };
  if (d.status === 'inquiry' || d.status === 'planning') return { text: `Continue: ${STEPS.find((s) => s.key === (d.draftStep || 'basics'))?.label}` };
  if (d.status === 'quoted') return { text: 'Deposit due', alert: true };
  if (d.status === 'live') return { text: 'Happening now' };
  if (d.status === 'confirmed') return { text: whenLabel(d.date) };
  return { text: 'View summary' };
}

export function DispatchCard({ d, i, href, role }) {
  const n = nextLine(d);
  return (
    <a className="dcard" href={href || `#/ticket/${d.id}/overview`}>
      <Photo scene={d.photo} className="dcard-photo" seed={i}>
        <div className="dcard-top">
          <StatusPill status={d.status} tone={d.status === 'live' ? 'live' : undefined} />
          <span className="ticket-no">{d.ticketNo}</span>
        </div>
      </Photo>
      <div className="dcard-body">
        <span className="eyebrow">{TYPES[d.type].label}</span>
        <h3 className="dcard-name">{d.name || 'Untitled Dispatch'}</h3>
        <div className="keyfacts">
          <span>{fmtDate(d.date, 'day')}</span>
          <span>{fmtTime(d.startTime)}</span>
          <span>{plural(d.guestCount, 'guest')}</span>
        </div>
        <p className="dcard-loc"><Icon name="pin" size={14} />{d.location || 'Venue not set yet'}</p>
        <div className="dcard-foot">
          <AvatarStack people={peopleWithAccess(d)} max={4} size={28} />
          <span className={cx('dcard-next', n.alert && 'is-alert')}>{role === 'vendor' ? (d.suggestions.some((s) => s.status === 'pending') ? 'Suggestion pending' : whenLabel(d.date)) : n.text}<Icon name="right" size={14} /></span>
        </div>
      </div>
    </a>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export function ClientDashboard({ forceEmpty }) {
  const state = useStore();
  const list = forceEmpty || state.session.hideSeeds ? [] : state.dispatches;
  const u = userById(state.session.userId || 'u-maya');
  const live = list.filter((d) => d.status === 'live').length;
  const create = () => go(`/builder/${createDispatch()}/basics`);
  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="h1">{greeting()}, {u.name.split(' ')[0]}</h1>
          <p className="muted">{list.length ? `${plural(list.length, 'Dispatch', 'Dispatches')}${live ? ` · ${live} live now` : ''}` : 'Your Dispatches will appear here.'}</p>
        </div>
        <Button variant="primary" size="lg" icon="plus" onClick={create}>Create Dispatch</Button>
      </div>
      {!list.length ? (
        <Empty title="Plan your first Dispatch"
          body="A Dispatch holds everything for one event: the restaurant, the venue, menu, staff, guests and payments. Start with the basics and add the rest as you go."
          action={(
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button variant="primary" size="lg" icon="plus" onClick={create}>Create Dispatch</Button>
              {state.session.hideSeeds || forceEmpty ? <Button variant="ghost" onClick={() => { hideSeeds(false); go('/dashboard'); }}>Show sample Dispatches</Button> : null}
            </div>
          )} />
      ) : GROUPS.map((g) => {
        const items = list.filter((d) => g.match.includes(d.status)).sort((a, b) => (g.key === 'done' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
        if (!items.length) return null;
        return (
          <section className="group" key={g.key} aria-labelledby={`g-${g.key}`}>
            <div className="group-head"><h2 className="group-title" id={`g-${g.key}`}>{g.title}</h2><span className="group-count">{items.length}</span></div>
            <div className="cards">{items.map((d, i) => <DispatchCard key={d.id} d={d} i={i + g.key.length} />)}</div>
          </section>
        );
      })}
    </div>
  );
}

export function VendorDashboard() {
  const state = useStore();
  const vendorUser = 'u-bella';
  const mine = state.dispatches.filter((d) => d.participants.some((p) => p.role === 'vendor' && userById(p.userId)?.vendorId?.startsWith('v-')));
  const v = vendorById('v-bella');
  const bella = mine.filter((d) => d.participants.some((p) => p.userId === vendorUser));
  const other = mine.filter((d) => !bella.includes(d));
  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow">Vendor Page · {v.name}</p>
          <h1 className="h1">Bookings</h1>
          <p className="muted">Every Dispatch you are on. Commission: none.</p>
        </div>
      </div>
      {bella.length ? (
        <section className="group">
          <div className="group-head"><h2 className="group-title">{v.name}</h2><span className="group-count">{bella.length}</span></div>
          <div className="cards">{bella.map((d, i) => <DispatchCard key={d.id} d={d} i={i} role="vendor" />)}</div>
        </section>
      ) : <Empty title="No bookings yet" body="When a client picks your Vendor Page, the Dispatch appears here." />}
      {other.length ? (
        <section className="group">
          <div className="group-head"><h2 className="group-title">Other demo vendors</h2><span className="group-count">{other.length}</span></div>
          <p className="small muted" style={{ marginBottom: 14 }}>In the demo, the Vendor role views each Ticket as that Ticket's restaurant.</p>
          <div className="cards">{other.map((d, i) => <DispatchCard key={d.id} d={d} i={i + 3} role="vendor" />)}</div>
        </section>
      ) : null}
    </div>
  );
}

export function StaffShifts() {
  const state = useStore();
  const shifts = state.dispatches.filter((d) => (d.staff || []).some((s) => (s.assigned || []).length) && d.status !== 'completed');
  return (
    <div className="page page-narrow">
      <div className="dash-head">
        <div>
          <p className="eyebrow">Staff</p>
          <h1 className="h1">Your shifts</h1>
          <p className="muted">Open a shift for the call time, address, contacts and checklist.</p>
        </div>
      </div>
      {shifts.length ? (
        <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
          {shifts.map((d, i) => <DispatchCard key={d.id} d={d} i={i} href={`#/staff/${d.id}`} />)}
        </div>
      ) : <Empty title="No shifts yet" body="Shifts appear once a Lead Planner assigns you to a confirmed Dispatch." />}
    </div>
  );
}

export function Placeholder({ role }) {
  const label = { office: 'Office Administrator', vendor: 'Vendor', staff: 'Staff' }[role] || role;
  return (
    <div className="page">
      <div className="placeholder">
        <Emblem size={96} />
        <p className="eyebrow">{label} dashboard</p>
        <h1 className="h1">Office Plan is next on the roadmap.</h1>
        <p className="lead">This prototype covers the Client flow end to end. The {label} dashboard (recurring team meals, headcounts and one Office Plan) is out of scope for this round and shown as a placeholder.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button variant="primary" href="#/">Back to the website</Button>
          <Button variant="secondary" href="#/signup?role=client">Try the Client flow</Button>
        </div>
      </div>
    </div>
  );
}
