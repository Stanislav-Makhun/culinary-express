// Staff Instruction Sheet, Compare (before/after), About panel and the demo toolbar.
import {
  TYPES, userById, vendorById, timelineFor, callTimeFor, makeCompareDispatch, FIELD_LABELS, FIELD_STEP,
  STAFF_STATUS_LABEL,
} from './data.js';
import { fmtDate, fmtTime, fmtRange, plural, money } from './fmt.js';
import { useStore, resetDemo, toast } from './store.js';
import { setSession, hideSeeds, createDispatch } from './actions.js';
import { go } from './router.js';
import { Button, Icon, Emblem, Wordmark, Dialog, Empty, cx } from './ui.jsx';
import { TicketView } from './ticket.jsx';
import BEFORE_IMG from '../assets/before-dispatch.jpg';

const { useState, useEffect } = React;

// ------------------------------------------------------------ Staff Instruction Sheet
export function StaffSheet({ id }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  if (!d) return <div className="page"><Empty title="Document not found" action={<Button href="#/dashboard" variant="primary">Back</Button>} /></div>;
  const vendor = d.vendor?.kind === 'page' ? vendorById(d.vendor.vendorId)?.name : d.vendor?.name;
  const roster = (d.staff || []).flatMap((s) => (s.assigned?.length ? s.assigned.map((u) => ({ role: s.role, u })) : Array.from({ length: s.count }, () => ({ role: s.role, u: null }))));
  const coord = (d.staff || []).find((s) => s.role === 'Coordinator')?.assigned?.[0];
  return (
    <div className="sheet-wrap">
      <div className="sheet-bar">
        <Button variant="secondary" icon="arrowLeft" href={`#/ticket/${id}/documents`}>Back to Documents</Button>
        <span className="small muted">Print preview · generated from {d.ticketNo}</span>
      </div>
      <article className="sheet" aria-label="Staff Instruction Sheet">
        <header className="sheet-head">
          <Emblem size={56} />
          <div>
            <p style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#666' }}>Cülinary Expréss · Staff Instruction Sheet</p>
            <h1>{d.name}</h1>
          </div>
          <div className="sheet-no">{d.ticketNo}<br />{TYPES[d.type].label}</div>
        </header>

        <h2>Assignment</h2>
        <dl className="sheet-grid">
          <div><dt>Date</dt><dd>{fmtDate(d.date, 'full')}</dd></div>
          <div><dt>Call time</dt><dd>{fmtTime(callTimeFor(d))}</dd></div>
          <div><dt>Event time</dt><dd>{fmtRange(d.startTime, d.endTime)}</dd></div>
          <div><dt>{FIELD_LABELS.guestCount}</dt><dd>{d.guestCount}</dd></div>
          <div><dt>{FIELD_LABELS.serviceStyle}</dt><dd>{d.serviceStyle || '—'}</dd></div>
          <div><dt>{FIELD_LABELS.vendor}</dt><dd>{vendor || '—'}</dd></div>
          <div style={{ gridColumn: '1 / -1' }}><dt>{FIELD_LABELS.location}</dt><dd>{d.location}</dd></div>
          {d.venueNotes ? <div style={{ gridColumn: '1 / -1' }}><dt>{FIELD_LABELS.venueNotes}</dt><dd>{d.venueNotes}</dd></div> : null}
        </dl>

        <h2>Instructions</h2>
        <p>{d.staffNotes || 'No extra notes from the client.'}</p>
        {d.dietaryNotes ? <p style={{ marginTop: 8 }}><strong>{FIELD_LABELS.dietaryNotes}:</strong> {d.dietaryNotes}</p> : null}
        <p style={{ marginTop: 8 }}><strong>Dress code:</strong> black shirt, black trousers, non-slip shoes. Aprons provided.</p>

        <h2>Team</h2>
        <div className="sheet-scroll">
        <table>
          <thead><tr><th>Role</th><th>Name</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {roster.length ? roster.map((r, i) => (
              <tr key={i}><td>{r.role}</td><td>{r.u ? userById(r.u).name : 'To be assigned'}</td><td className="nw">{r.u ? userById(r.u).phone : '—'}</td><td>{r.u ? STAFF_STATUS_LABEL[d.staffStatus?.[r.u] || 'assigned'] : '—'}</td></tr>
            )) : <tr><td colSpan="4">No staff on this Dispatch.</td></tr>}
          </tbody>
        </table>
        </div>

        <h2>Run of show</h2>
        <table>
          <tbody>
            {timelineFor(d).map((t, i) => <tr key={i}><td style={{ width: 90, fontFamily: 'var(--mono)' }}>{fmtTime(t.time)}</td><td>{t.label}</td><td style={{ color: '#666' }}>{t.who}</td></tr>)}
          </tbody>
        </table>

        {d.materials?.length ? (
          <>
            <h2>Materials</h2>
            <table>
              <tbody>
                {d.materials.map((m) => <tr key={m.item}><td>{m.item}</td><td style={{ color: '#666' }}>{m.providedBy === 'vendor' ? `${vendor} provides` : 'Client provides'}</td></tr>)}
              </tbody>
            </table>
          </>
        ) : null}

        <h2>Contacts</h2>
        <table>
          <tbody>
            <tr><td>Lead Planner</td><td>{userById(d.leadPlannerId).name}</td><td>{userById(d.leadPlannerId).phone}</td></tr>
            {coord ? <tr><td>On-site coordinator</td><td>{userById(coord).name}</td><td>{userById(coord).phone}</td></tr> : null}
            {d.vendor?.kind === 'page' ? <tr><td>Vendor</td><td>{vendor}</td><td>{userById(vendorById(d.vendor.vendorId).userId).phone}</td></tr> : null}
          </tbody>
        </table>

        <footer className="sheet-foot">
          <span>Generated by the Operations Document Engine from Dispatch {d.ticketNo}.</span>
          <span>Changes on the Ticket update this sheet.</span>
        </footer>
      </article>
    </div>
  );
}

// ------------------------------------------------------------ Compare
export function Compare() {
  const d = makeCompareDispatch();
  const [tab, setTab] = useState('overview');
  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow">Before / after</p>
          <h1 className="h1">The same inquiry, as a Ticket</h1>
          <p className="muted" style={{ maxWidth: '68ch' }}>Left: today's dispatch page for the “Party” inquiry (screenshot). Right: the same answers on the new Dispatch Ticket, read-only.</p>
        </div>
      </div>
      <div className="cmp-notes">
        <div className="cmp-note"><strong>Nothing dropped</strong>“Tasty” and “10” were typed into today's form and never shown again. In the Builder every field has a home and a label.</div>
        <div className="cmp-note"><strong>Labelled, without seconds</strong>“Hosts 100” becomes Guest count. “00:30:00 – 06:00:00” becomes 12:30 AM – 6:00 AM.</div>
        <div className="cmp-note"><strong>One Share, private by default</strong>The single partner slot and the public link become People with access, with roles and permissions.</div>
      </div>
      <div className="compare">
        <section className="cmp-pane" aria-label="Today's dispatch page">
          <div className="cmp-head"><strong>Today · plan.culinary.express</strong><span className="small muted">Screenshot</span></div>
          <div className="cmp-scroll"><img src={BEFORE_IMG} alt="Today's dispatch details page for the Party inquiry" /></div>
        </section>
        <section className="cmp-pane" aria-label="New Dispatch Ticket">
          <div className="cmp-head"><strong>New · Dispatch Ticket</strong><span className="small muted">Read-only preview</span></div>
          <div className="cmp-scroll cmp-after"><TicketView d={d} tab={tab} onTab={setTab} readOnly /></div>
        </section>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ About
export const ASSUMPTIONS = [
  ['Lead Planner', 'An internal Cülinary Expréss participant on every Dispatch (Ava Laurent in the demo), with Can edit.'],
  ['Dispatch types', "The blueprint's three: Catered Delivery, Catered Event, Onsite Booking. Wholesale/Retail is out of scope."],
  ['Product name', 'Cülinary Expréss throughout. The emblem artwork still reads “The Express” and is used unchanged; confirm with the client.'],
  ['Figma transfer', 'This prototype is a standalone alignment artifact and does not feed the Figma file directly.'],
  ['Lifecycle triggers', 'Inquiry when Basics is saved · Planning once a vendor is chosen · Quoted when the quote is approved · Confirmed when the deposit is paid · Live on “Start event” · Completed on “Mark completed”.'],
  ['Pricing', 'Mock: menu prices per portion, staff hourly for event hours plus 1 hour setup, 8% platform fee, 8.25% tax on food and services, 30% deposit, balance due 5 days out. USD.'],
  ['Payments', 'Square is mocked. The test card is prefilled and nothing is charged.'],
  ['Staff assignment', 'Staff are auto-assigned from a seeded pool when the deposit is paid. In production the Lead Planner assigns them.'],
  ['Staff call time', 'Two hours before the start time for every role.'],
  ['Vendor participant', 'Choosing a Vendor Page adds that restaurant to the Ticket as Vendor · Can suggest.'],
  ['Fulfilment status', 'Awaiting vendor → Accepted → Preparing → Out for delivery → Delivered & set. A Vendor role action, independent of permission.'],
  ['Changing type', 'Switching to a type that hides steps clears the data in those steps, so the quote never includes hidden items.'],
  ['Unpaid quote edits', 'Editing a Dispatch after its quote is approved (but before payment) moves it back to Planning so the quote is approved again.'],
  ['Demo personas', 'Client = Maya Chen. Vendor = the restaurant on the Ticket you are viewing (Bella Cucina by default). Staff = Diego Ramos when assigned, otherwise the first assigned person.'],
  ['Location data', 'Seed venues are fictional addresses in Portland, OR. Phone numbers use the 555 range.'],
  ['Messages and email', 'Messages, invitations and receipts are stored in this browser only. Nothing is sent.'],
  ['Compare screen', 'Today\'s form has an unlabelled field holding “10”. Its meaning is unclear, so the rebuilt Ticket does not guess at it. “Tasty” becomes a menu item for the 100 guests.'],
  ['Deep links', 'Routes look like #/ticket/cx-1024/overview. When shared from the artifact page, use the dotted form #ticket.cx-1024 (the host strips other characters).'],
];

const SCRIPT = [
  ['Landing', 'Scroll to “One Ticket. Four ways in.” and press Plan a Dispatch on the Client card.'],
  ['Sign-up', 'Client is preselected and the demo name is filled in. Press Continue.'],
  ['Dashboard', 'One list grouped by status. Point out the Live lunch. Press Create Dispatch.'],
  ['Basics', 'Keep Catered Event (note “every step”). Name it “Chen Anniversary Dinner”, add a venue, set 80 guests, budget 12,000. Continue.'],
  ['Vendor', 'Pick Bella Cucina. (Mention the Manual Vendor Template below the list.) Continue.'],
  ['Food → Materials', 'Use “Start with a set menu”, then the staff suggestion chip, add two guests, tick a few materials. Watch the live summary and budget bar.'],
  ['Review & Quote', 'Every section is labelled with an Edit link. Press Approve quote & pay deposit.'],
  ['Checkout', 'Mock Square, clearly labelled. Pay. The confirmation shows assigned staff. Open the Ticket.'],
  ['Ticket', 'Walk the header: lifecycle route, next action, ticket stub. Open Share, show roles, permissions and link access.'],
  ['Suggest', 'In the demo toolbar switch to Vendor. On Event basics press Suggest edit, change Guest count 80 → 70, Send suggestion.'],
  ['Accept', 'Switch to Client. The Overview shows “80 guests → 70 guests · suggested by Bella Cucina”. Accept, then open Activity.'],
  ['Staff', 'Switch to Staff (or press Staff mobile). Tick a checklist item, press I’m on my way, then I’ve arrived. Back on the Ticket, Activity shows each update.'],
];

export function FieldCoverage() {
  // Self-check: every Builder field must have a label and a rendering step on the Ticket.
  const missing = Object.keys(FIELD_STEP).filter((k) => !FIELD_LABELS[k]);
  return (
    <p className={cx('coverage', missing.length && 'is-bad')}>
      <Icon name={missing.length ? 'warn' : 'check'} size={16} />
      {missing.length
        ? `Missing labels: ${missing.join(', ')}`
        : `${Object.keys(FIELD_STEP).length} Builder fields, all labelled. The Review step and the Ticket render them with the same components.`}
    </p>
  );
}

export function About({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} size="lg" title="About this prototype"
      description="A clickable, front-end-only alignment prototype of the Cülinary Expréss key flow (UI/UX MVP Blueprint v1.0). Everything external is mocked and data lives in this browser.">
      <h3 className="about-h" style={{ marginTop: 6 }}>Demo script · 5 minutes</h3>
      <ol className="script">
        {SCRIPT.map(([t, b]) => <li key={t}><span><span className="t">{t}.</span> {b}</span></li>)}
      </ol>
      <h3 className="about-h">Assumptions</h3>
      <ul className="about-list">
        {ASSUMPTIONS.map(([t, b]) => <li key={t}><strong>{t}.</strong> {b}</li>)}
      </ul>
      <h3 className="about-h">Field coverage</h3>
      <FieldCoverage />
      <h3 className="about-h">Out of scope</h3>
      <p className="small muted">Authentication, backend, real payments and email, full Live Operations, subscriptions (Vendor Pro, Office Plan, Autopilot Pro), Super and Office Administrator dashboards, guest-facing RSVP pages, Wholesale/Retail, the physical brochure, native apps.</p>
    </Dialog>
  );
}

// ------------------------------------------------------------ demo toolbar
export function DemoToolbar({ route }) {
  const state = useStore();
  const [open, setOpen] = useState(false);
  const [about, setAbout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const role = state.session.role;
  const [p0, p1] = route.parts;
  const ctxId = ['ticket', 'staff', 'builder', 'edit', 'checkout', 'confirmed', 'doc'].includes(p0) ? p1 : state.session.lastDispatchId;
  useEffect(() => { if (!open) setConfirmReset(false); }, [open]);
  useEffect(() => {
    const onOpen = () => setAbout(true);
    window.addEventListener('cx-about', onOpen);
    return () => window.removeEventListener('cx-about', onOpen);
  }, []);

  const lastDispatch = state.dispatches.find((d) => d.id === ctxId) || state.dispatches.find((d) => d.id === state.session.lastDispatchId) || state.dispatches[0];
  const staffable = (d) => d && (d.staff || []).some((s) => (s.assigned || []).length);
  const staffTarget = staffable(lastDispatch) ? lastDispatch : state.dispatches.find((d) => staffable(d) && d.status !== 'completed');

  const switchRole = (r) => {
    setSession({ role: r });
    if (r === 'staff') {
      if (p0 === 'ticket' && p1) go(`/staff/${p1}`);
      else if (staffTarget) go(`/staff/${staffTarget.id}`);
    } else if (p0 === 'staff' && p1) go(`/ticket/${p1}/overview`);
    else if (p0 === 'edit' || p0 === 'builder') go(`/ticket/${p1}/overview`);
    else if (p0 === 'home') go('/dashboard');
    toast(`Viewing as ${r === 'client' ? 'Client · Maya Chen' : r === 'vendor' ? 'Vendor' : 'Staff'}`);
  };
  const builderTarget = () => {
    const draft = [...state.dispatches].reverse().find((d) => ['inquiry', 'planning', 'quoted'].includes(d.status));
    if (role !== 'client') setSession({ role: 'client' });
    if (draft) go(`/builder/${draft.id}/${draft.draftStep || 'basics'}`);
    else go(`/builder/${createDispatch()}/basics`);
    setOpen(false);
  };
  const nav = (path, asRole) => { if (asRole && role !== asRole) setSession({ role: asRole }); go(path); setOpen(false); };

  return (
    <div className={cx('demo', p0 === 'staff' && 'is-lifted')}>
      {open ? (
        <div className="demo-panel" role="dialog" aria-label="Demo controls">
          <div>
            <h4>View as</h4>
            <div className="demo-roles" role="radiogroup" aria-label="Role">
              {['client', 'vendor', 'staff'].map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} className={cx(role === r && 'is-on')} onClick={() => switchRole(r)}>
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4>Jump to</h4>
            <div className="demo-links">
              <a href="#/" onClick={() => setOpen(false)}><Icon name="globe" size={16} />Landing</a>
              <a href="#/dashboard" onClick={() => setOpen(false)}><Icon name="grid" size={16} />Dashboard</a>
              <button type="button" onClick={builderTarget}><Icon name="layers" size={16} />Builder</button>
              <button type="button" onClick={() => nav(`/ticket/${lastDispatch?.id}/overview`, role === 'staff' ? 'client' : null)}><Icon name="doc" size={16} />Ticket</button>
              <button type="button" onClick={() => staffTarget ? nav(`/staff/${staffTarget.id}`, 'staff') : toast('No Dispatch has staff assigned yet')}><Icon name="phone" size={16} />Staff mobile</button>
              <a href="#/compare" onClick={() => setOpen(false)}><Icon name="compare" size={16} />Compare</a>
              <button type="button" onClick={() => { hideSeeds(true); nav('/dashboard', 'client'); }}><Icon name="box" size={16} />Empty state</button>
              <button type="button" onClick={() => { setAbout(true); setOpen(false); }}><Icon name="info" size={16} />About</button>
            </div>
          </div>
          <div className="demo-foot">
            {confirmReset ? (
              <>
                <button type="button" className="danger" onClick={() => { resetDemo(); setOpen(false); go('/dashboard'); toast('Demo reset to the seed data'); }}>Yes, reset</button>
                <button type="button" onClick={() => setConfirmReset(false)}>Cancel</button>
              </>
            ) : (
              <button type="button" className="danger" onClick={() => setConfirmReset(true)}><Icon name="refresh" size={15} /> Reset demo</button>
            )}
          </div>
          {confirmReset ? <p className="demo-note">Restores the three seed Dispatches and clears everything you created.</p> : null}
        </div>
      ) : null}
      <button type="button" className="demo-pill" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="badge">Demo</span>
        <span>{role === 'client' ? 'Client' : role === 'vendor' ? 'Vendor' : 'Staff'}</span>
        <Icon name={open ? 'down' : 'up'} size={16} />
      </button>
      <About open={about} onClose={() => setAbout(false)} />
    </div>
  );
}
