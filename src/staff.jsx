// Staff mobile Ticket. Designed at 390px first: one primary action at a time, 44px+ targets,
// and only what the person on shift needs.
import { userById, vendorById, timelineFor, callTimeFor, STAFF_STATUS_LABEL } from './data.js';
import { fmtDate, fmtTime, fmtRange } from './fmt.js';
import { useStore, toast } from './store.js';
import { setStaffStatus, toggleCheck, checklistFor, actorId, setSession } from './actions.js';
import { Button, Icon, Emblem, StatusPill, Checkbox, Avatar, cx } from './ui.jsx';

const FLOW = ['confirmed', 'on_way', 'arrived', 'completed'];
const ACTION = {
  confirmed: { label: "I'm on my way", icon: 'car', next: 'on_way', toast: 'Marked on your way. The coordinator can see it.' },
  on_way: { label: "I've arrived", icon: 'pin', next: 'arrived', toast: 'Checked in. Head to the briefing.' },
  arrived: { label: 'Complete my shift', icon: 'flag', next: 'completed', toast: 'Shift complete. Thank you!' },
};

function splitVenue(loc = '') {
  const i = loc.indexOf(',');
  return i > 0 ? [loc.slice(0, i), loc.slice(i + 1).trim()] : [loc, ''];
}

export function StaffView({ id }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  const me = d ? actorId({ ...state, session: { ...state.session, role: 'staff' } }, d) : null;
  const row = d ? (d.staff || []).find((s) => (s.assigned || []).includes(me)) : null;
  const notes = (
    <div className="phone-notes">
      <p className="eyebrow">Staff mobile view</p>
      <h2 className="h2">The shift, on one screen.</h2>
      <ul>
        <li>Designed at 390px. On a phone this view fills the screen.</li>
        <li>One primary action at a time: On my way, Arrived, Completed.</li>
        <li>Every status update and check-in is written to the Ticket's Activity.</li>
        <li>Built from the same Dispatch the client planned. Nothing is retyped.</li>
      </ul>
      {d ? <Button variant="secondary" icon="arrowLeft" href={`#/ticket/${d.id}/staff`} onClick={() => setSession({ role: 'client' })}>Back to the Client's Ticket</Button> : null}
    </div>
  );
  return (
    <div className="phone-stage">
      {notes}
      <div className="phone" aria-label="Phone preview">
        <div className="phone-screen">
          <div className="phone-scroll">
            {!d || !row ? <NoShift d={d} /> : <Shift d={d} me={me} row={row} />}
          </div>
          {d && row ? <Dock d={d} me={me} /> : null}
        </div>
      </div>
    </div>
  );
}

function NoShift({ d }) {
  return (
    <div className="sm">
      <div className="sm-top"><div className="sm-top-l"><Emblem size={38} /><div><div className="sm-hello">Cülinary Expréss</div><div className="sm-me">Shifts</div></div></div></div>
      <div className="sm-empty">
        <Icon name="calendar" size={32} />
        <h2 className="h3">{d ? 'Staff are not assigned yet' : 'Shift not found'}</h2>
        <p className="muted">{d ? `${d.name} gets its team once the deposit is paid. Assigned staff see the shift here.` : 'It may have been removed when the demo was reset.'}</p>
        <Button variant="secondary" href="#/dashboard">See all shifts</Button>
      </div>
    </div>
  );
}

function Shift({ d, me, row }) {
  const u = userById(me);
  const status = d.staffStatus?.[me] || 'confirmed';
  const call = callTimeFor(d);
  const coordId = (d.staff || []).find((s) => s.role === 'Coordinator')?.assigned?.[0];
  const coord = coordId && coordId !== me ? userById(coordId) : null;
  const lp = userById(d.leadPlannerId);
  const [place, addr] = splitVenue(d.location);
  const vendor = d.vendor?.kind === 'page' ? vendorById(d.vendor.vendorId)?.name : d.vendor?.name;
  const list = checklistFor(d, me);
  const done = list.filter((c) => c.done).length;
  const instructions = [
    `Report to ${coord ? coord.name.split(' ')[0] : lp.name.split(' ')[0]} at the service entrance by ${fmtTime(call)}.`,
    d.staffNotes,
    d.serviceStyle ? `${d.serviceStyle} service from ${vendor}.` : null,
    d.dietaryNotes ? `Dietary: ${d.dietaryNotes}` : null,
    'Black shirt, black trousers, non-slip shoes. Aprons are provided.',
  ].filter(Boolean);
  const tl = timelineFor(d);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.location)}`;
  const contacts = [
    coord ? { u: coord, role: 'On-site coordinator' } : null,
    { u: lp, role: 'Lead Planner · Cülinary Expréss' },
  ].filter(Boolean);
  return (
    <div className="sm">
      <div className="sm-top">
        <div className="sm-top-l">
          <Avatar userId={me} size={40} />
          <div><div className="sm-hello">Your shift, {u.name.split(' ')[0]}</div><div className="sm-me">{fmtDate(d.date, 'day')}</div></div>
        </div>
        <StatusPill tone={status === 'completed' ? 'sage' : status === 'confirmed' ? 'neutral' : 'amber'}>{STAFF_STATUS_LABEL[status]}</StatusPill>
      </div>

      <section className="sm-ticket stub" aria-label="Assignment">
        <div className="stub-sec">
          <div className="sm-role"><span className="sm-role-name">{row.role}</span><span className="num tiny" style={{ color: '#b9b2a5' }}>{d.ticketNo}</span></div>
          <h1 className="sm-event">{d.name}</h1>
          <p className="sm-date">{fmtDate(d.date, 'full')}</p>
        </div>
        <div className="stub-perf" />
        <div className="stub-sec">
          <div className="sm-call">
            <div><div className="k">Call time</div><div className="v">{fmtTime(call)}</div></div>
            <div><div className="k">Event</div><div className="v small">{fmtRange(d.startTime, d.endTime)}</div></div>
          </div>
        </div>
      </section>

      <section className="sm-card" aria-label="Location">
        <div className="sm-card-title">Where</div>
        <p className="sm-place">{place}</p>
        {addr ? <p className="sm-addr">{addr}</p> : null}
        {d.venueNotes ? <p className="sm-note"><Icon name="info" size={16} /><span>{d.venueNotes}</span></p> : null}
        <Button variant="secondary" className="sm-btn" icon="map" href={mapUrl} target="_blank" rel="noopener">Open in Maps</Button>
      </section>

      <section className="sm-card" aria-label="Instructions">
        <div className="sm-card-title">Instructions</div>
        <ol className="sm-instr">
          {instructions.map((t, i) => <li key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span><span>{t}</span></li>)}
        </ol>
      </section>

      <section className="sm-card" aria-label="Checklist">
        <div className="sm-card-title">Checklist <span className="sm-progress">{done}/{list.length}</span></div>
        <div className="sm-check">
          {list.map((c) => (
            <Checkbox key={c.id} checked={c.done} onChange={() => toggleCheck(d.id, me, c.id)}>{c.text}</Checkbox>
          ))}
        </div>
      </section>

      {d.materials?.length ? (
        <section className="sm-card" aria-label="Materials">
          <div className="sm-card-title">Materials to set up</div>
          {d.materials.map((m) => (
            <div className="sm-mat" key={m.item}>
              <span>{m.item}</span>
              <span className="small muted">{m.providedBy === 'vendor' ? `${vendor} brings` : 'Client provides'}</span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="sm-card" aria-label="Contacts">
        <div className="sm-card-title">Contacts</div>
        {contacts.map(({ u: c, role }) => (
          <div className="sm-contact" key={c.id}>
            <Avatar userId={c.id} size={44} />
            <div className="who">
              <div className="nm">{c.name}</div>
              <div className="rl">{role}</div>
              <div className="ph">{c.phone}</div>
            </div>
            <a className="sm-call-btn" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={`Call ${c.name}`}><Icon name="phone" size={20} /></a>
          </div>
        ))}
      </section>

      <section className="sm-card" aria-label="Shift timeline">
        <div className="sm-card-title">Run of show</div>
        <ul className="sm-tl">
          {tl.map((t, i) => (
            <li key={i} className={cx(i === 0 && 'is-me')}><span className="t">{fmtTime(t.time)}</span><span>{t.label}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Dock({ d, me }) {
  const status = d.staffStatus?.[me] || 'confirmed';
  const a = ACTION[status];
  const idx = FLOW.indexOf(status);
  const undo = () => setStaffStatus(d.id, me, FLOW[Math.max(0, idx - 1)]);
  return (
    <div className="sm-dock">
      <div className="sm-steps" aria-hidden="true">
        {['On my way', 'Arrived', 'Completed'].map((l, i) => (
          <div key={l} className={cx(idx > i && 'is-on')}><span />{l}</div>
        ))}
      </div>
      {a ? (
        <Button variant="primary" className="sm-primary" icon={a.icon}
          onClick={() => { setStaffStatus(d.id, me, a.next); toast(a.toast); }}>{a.label}</Button>
      ) : (
        <div className="sm-done"><Icon name="check" />Shift complete</div>
      )}
      {idx > 0 ? <button type="button" className="sm-undo" onClick={undo}>Undo last update</button> : null}
    </div>
  );
}
