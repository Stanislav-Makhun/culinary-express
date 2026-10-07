// Dispatch Builder: a stepped flow with a live summary. The same step screens are reused
// for per-section editing from the Ticket, and for suggestions from Can-suggest participants.
import {
  TYPES, STEPS, stepsFor, VENDORS, SERVICES, STAFF_ROLES, MATERIALS, SERVICE_STYLES,
  vendorById, serviceById, quoteFor, staffCount, userById, LIFECYCLE_LABEL,
} from './data.js';
import { fmtDate, fmtRange, money, plural, fieldText } from './fmt.js';
import { useStore, toast } from './store.js';
import {
  actorId, permissionFor, saveFields, suggestFields, approveQuote, nextStep, prevStep,
} from './actions.js';
import { go } from './router.js';
import {
  Button, Icon, Input, Textarea, Field, Segmented, Counter, Toggle, Checkbox, Photo, MockTag, cx, StepRail,
} from './ui.jsx';
import {
  TicketCtx, BasicsFacts, VendorFacts, FoodFacts, ServicesFacts, StaffFacts, RsvpFacts, MaterialsFacts,
} from './facts.jsx';

const { useState, useEffect, useMemo } = React;

export const STEP_FIELDS = {
  basics: ['type', 'name', 'date', 'startTime', 'endTime', 'location', 'venueNotes', 'guestCount', 'budget'],
  vendor: ['vendor', 'menuItems'],
  food: ['menuItems', 'serviceStyle', 'dietaryNotes'],
  services: ['services'],
  staff: ['staff', 'staffNotes'],
  rsvp: ['rsvp'],
  materials: ['materials'],
  review: [],
};
const STEP_COPY = {
  basics: ['Start with the basics', 'The type decides which steps you will see next. Everything here appears on the Ticket exactly as you enter it.'],
  vendor: ['Choose a restaurant', 'Vendor Pages pre-build your menu and prices. If your favourite place is not on the platform yet, add it by hand.'],
  food: ['Menu and service', 'Pick dishes and portions. Prices come from the Vendor Page.'],
  services: ['Add services', 'Optional add-ons from vendors on the platform. Each one joins the Ticket.'],
  staff: ['Staff the event', 'Choose roles and counts. Your Lead Planner assigns people once the deposit is in.'],
  rsvp: ['Guest RSVPs', 'Collect replies through an invitation link, or skip this and keep a headcount.'],
  materials: ['Materials', 'Mark who brings each item. Staff see the list on their phones.'],
  review: ['Review & Quote', 'Check every section, then approve the estimate and pay the deposit.'],
};
const TYPE_ICON = { catered_delivery: 'truck', catered_event: 'users', onsite_booking: 'fork' };

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, structuredClone(obj[k])]));

function validate(step, d) {
  const e = {};
  if (step === 'basics') {
    if (!d.name?.trim()) e.name = 'Give the Dispatch a name guests and vendors will recognise.';
    if (!d.date) e.date = 'Choose a date.';
    if (!d.location?.trim()) e.location = 'Add the venue address so vendors and staff know where to go.';
    if (!(d.guestCount > 0)) e.guestCount = 'Guest count must be at least 1.';
    if (d.startTime && d.endTime && d.startTime === d.endTime) e.endTime = 'End time must differ from the start time.';
  }
  if (step === 'vendor') {
    if (!d.vendor) e.vendor = 'Choose a restaurant, or add one with the Manual Vendor Template.';
    else if (d.vendor.kind === 'manual' && !d.vendor.name?.trim()) e.vendorName = 'Add the vendor name.';
  }
  if (step === 'food' && !(d.menuItems || []).some((i) => i.qty > 0 && i.name?.trim())) {
    e.menu = 'Add at least one menu item with a quantity.';
  }
  return e;
}

// Clear data for steps the chosen type hides, so the quote never includes invisible items.
function typeCleanup(d) {
  const patch = {};
  const visible = stepsFor(d.type).map((s) => s.key);
  if (!visible.includes('services')) patch.services = [];
  if (!visible.includes('staff')) { patch.staff = []; patch.staffNotes = ''; }
  if (!visible.includes('rsvp')) patch.rsvp = { enabled: false, guests: [] };
  if (!visible.includes('materials')) patch.materials = [];
  return patch;
}

export function Builder({ id, step, mode, ret }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  const [draft, setDraft] = useState(() => (d ? structuredClone(d) : null));
  const [errors, setErrors] = useState({});
  const [showSum, setShowSum] = useState(false);

  useEffect(() => {
    if (d) setDraft(structuredClone(d));
    setErrors({});
    window.scrollTo({ top: 0 });
  }, [id, step]);

  if (!d || !draft) {
    return (
      <div className="page page-narrow">
        <div className="empty"><h3 className="empty-title">This Dispatch no longer exists</h3><Button variant="primary" href="#/dashboard">Back to Dispatches</Button></div>
      </div>
    );
  }

  const actor = actorId(state, d);
  const perm = permissionFor(state, d);
  const suggestMode = mode === 'edit' && perm === 'suggest';
  const steps = stepsFor(draft.type);
  const known = STEPS.find((s) => s.key === step);
  if (!known || !steps.some((s) => s.key === step)) {
    setTimeout(() => go(`/builder/${id}/review`), 0);
    return null;
  }
  const set = (patch) => setDraft((x) => ({ ...x, ...patch }));
  const stepIdx = steps.findIndex((s) => s.key === step);
  const reached = steps.slice(0, Math.max(stepIdx, steps.findIndex((s) => s.key === d.draftStep)) + 1).map((s) => s.key);

  const patchFor = () => {
    let patch = pick(draft, STEP_FIELDS[step]);
    if (step === 'basics') patch = { ...patch, ...typeCleanup(draft) };
    return patch;
  };

  const commit = (draftStep) => {
    const errs = validate(step, draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast('Check the highlighted fields', 'warn');
      return false;
    }
    if (step !== 'review') {
      saveFields(id, patchFor(), actor, { creating: `Saved ${STEPS.find((s) => s.key === step).label}`, draftStep });
    }
    return true;
  };

  const onContinue = () => {
    const next = nextStep(draft, step);
    if (!commit(next)) return;
    go(ret === 'review' ? `/builder/${id}/review` : `/builder/${id}/${next}`);
  };
  const onBack = () => {
    const prev = prevStep(draft, step);
    if (step !== 'review') saveFields(id, patchFor(), actor, { creating: `Saved ${STEPS.find((s) => s.key === step).label}` });
    go(prev ? `/builder/${id}/${prev}` : '/dashboard');
  };
  const onSaveDraft = (exit) => {
    if (step !== 'review') saveFields(id, patchFor(), actor, { creating: `Saved ${STEPS.find((s) => s.key === step).label}`, draftStep: step });
    toast('Draft saved. Pick up where you left off from Dispatches.');
    if (exit) go('/dashboard');
  };
  const onEditSave = () => {
    const errs = validate(step, draft);
    setErrors(errs);
    if (Object.keys(errs).length) return toast('Check the highlighted fields', 'warn');
    if (suggestMode) {
      const n = suggestFields(id, patchFor(), actor);
      toast(n ? `Suggestion sent to ${userById(d.ownerId)?.name.split(' ')[0]} for review` : 'Nothing changed');
    } else {
      saveFields(id, patchFor(), actor);
      toast('Saved to the Ticket');
    }
    go(`/ticket/${id}/${ret || 'overview'}`);
  };

  const StepBody = { basics: BasicsStep, vendor: VendorStep, food: FoodStep, services: ServicesStep, staff: StaffStep, rsvp: RsvpStep, materials: MaterialsStep, review: ReviewStep }[step];
  const [title, sub] = STEP_COPY[step];
  const summary = <Summary d={step === 'review' ? d : draft} />;

  return (
    <div className="page">
      {mode === 'edit' ? (
        <>
          <div className="tk-crumb"><a href={`#/ticket/${id}/${ret || 'overview'}`}><Icon name="arrowLeft" size={14} /> Back to Ticket</a></div>
          {suggestMode ? (
            <div className="tk-banner">
              <Icon name="edit" />
              <span>You can suggest changes as <strong>{userById(actor)?.name}</strong>. {userById(d.ownerId)?.name.split(' ')[0]} accepts or rejects each one on the Ticket.</span>
            </div>
          ) : null}
          <div className="bhead">
            <div>
              <p className="eyebrow">{suggestMode ? 'Suggesting changes' : 'Editing'} · {d.name} · {d.ticketNo}</p>
              <h1 className="bhead-title">{STEPS.find((s) => s.key === step).label}</h1>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bhead">
            <div>
              <p className="eyebrow">{d.status === 'inquiry' ? 'New Dispatch' : `Dispatch · ${LIFECYCLE_LABEL[d.status]}`} · {d.ticketNo}</p>
              <h1 className="bhead-title">{draft.name?.trim() || 'Untitled Dispatch'}</h1>
            </div>
            <div className="row">
              <Button variant="secondary" icon="check" onClick={() => onSaveDraft(false)}>Save draft</Button>
              <Button variant="quiet" onClick={() => onSaveDraft(true)}>Save & exit</Button>
            </div>
          </div>
          <div className="bsteps">
            <StepRail steps={steps} current={step} reached={reached}
              onPick={(k) => { if (step !== 'review') saveFields(id, patchFor(), actor, { creating: `Saved ${STEPS.find((s) => s.key === step).label}` }); go(`/builder/${id}/${k}`); }} />
          </div>
        </>
      )}

      <div className="msum">
        <button type="button" className="msum-bar" aria-expanded={showSum} onClick={() => setShowSum(!showSum)}>
          <Icon name="doc" />
          <span><strong>Summary</strong> <span className="muted small">· {plural(draft.guestCount || 0, 'guest')}</span></span>
          <span className="amt">{money(quoteFor(step === 'review' ? d : draft).total)}</span>
          <Icon name={showSum ? 'up' : 'down'} />
        </button>
        {showSum ? <div className="msum-body">{summary}</div> : null}
      </div>

      <div className="bgrid">
        <div className="bform" key={step}>
          <div className="bstep-head">
            {mode !== 'edit' ? <p className="eyebrow">Step {stepIdx + 1} of {steps.length}</p> : null}
            <h2>{title}</h2>
            <p>{sub}</p>
          </div>
          <TicketCtx.Provider value={{ d, canResolve: false, actor, readOnly: true }}>
            <StepBody d={d} draft={draft} set={set} errors={errors} id={id} actor={actor} />
          </TicketCtx.Provider>
          {mode === 'edit' ? (
            <div className="bnav">
              <Button variant="quiet" href={`#/ticket/${id}/${ret || 'overview'}`}>Cancel</Button>
              <div className="bnav-right">
                <Button variant="primary" size="lg" icon={suggestMode ? 'send' : 'check'} onClick={onEditSave}>
                  {suggestMode ? 'Send suggestion' : 'Save changes'}
                </Button>
              </div>
            </div>
          ) : step !== 'review' ? (
            <div className="bnav">
              <Button variant="ghost" icon="arrowLeft" onClick={onBack}>{stepIdx === 0 ? 'Dispatches' : 'Back'}</Button>
              <div className="bnav-right">
                <Button variant="primary" size="lg" iconRight="arrowRight" onClick={onContinue}>
                  {ret === 'review' ? 'Save and return to review' : `Continue to ${STEPS.find((s) => s.key === nextStep(draft, step))?.label}`}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <aside className="summary" aria-label="Live summary">{summary}</aside>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ live summary
function Summary({ d }) {
  const q = quoteFor(d);
  const v = d.vendor?.kind === 'page' ? vendorById(d.vendor.vendorId)?.name : d.vendor?.name;
  const items = (d.menuItems || []).filter((i) => i.qty > 0);
  const portions = items.reduce((s, i) => s + i.qty, 0);
  const visible = stepsFor(d.type).map((s) => s.key);
  const rows = [
    ['Date', d.date ? fmtDate(d.date) : null],
    ['Time', d.startTime && d.endTime ? fmtRange(d.startTime, d.endTime) : null],
    ['Venue', d.location || null],
    ['Guests', d.guestCount ? plural(d.guestCount, 'guest') : null],
    ['Vendor', v || null],
    ['Menu', items.length ? `${plural(items.length, 'dish', 'dishes')} · ${portions} portions` : null],
    ['Style', items.length ? d.serviceStyle : null],
    visible.includes('services') && ['Services', d.services.length ? d.services.map((s) => serviceById(s.vendorId)?.category).join(', ') : null],
    visible.includes('staff') && ['Staff', staffCount(d) ? d.staff.filter((s) => s.count).map((s) => `${s.count} ${s.role}`).join(', ') : null],
    visible.includes('rsvp') && ['RSVP', d.rsvp.enabled ? `On · ${plural(d.rsvp.guests.length, 'guest')}` : 'Off'],
    visible.includes('materials') && ['Materials', d.materials.length ? plural(d.materials.length, 'item') : null],
  ].filter(Boolean);
  const pct = d.budget ? Math.min(100, Math.round((q.total / d.budget) * 100)) : 0;
  return (
    <div className="stub">
      <div className="stub-sec">
        <p className="eyebrow">{TYPES[d.type]?.label} · Summary</p>
        <p className={cx('sum-name', !d.name?.trim() && 'is-empty')}>{d.name?.trim() || 'Untitled Dispatch'}</p>
      </div>
      <div className="stub-perf" />
      <div className="stub-sec">
        <dl className="sum-list">
          {rows.map(([k, val]) => (
            <div className="sum-item" key={k}><dt>{k}</dt><dd className={val ? undefined : 'is-empty'}>{val || 'Not set'}</dd></div>
          ))}
        </dl>
      </div>
      <div className="stub-perf" />
      <div className="stub-sec">
        <div className="sum-total"><span className="eyebrow">Estimate</span><span className="amt">{money(q.total)}</span></div>
        <div className="row-between small muted" style={{ marginTop: 4 }}>
          <span>Deposit (30%)</span><span className="num">{money(q.deposit)}</span>
        </div>
        {d.budget ? (
          <>
            <div className={cx('budget-bar', q.total > d.budget && 'is-over')}><span style={{ width: `${pct}%` }} /></div>
            <p className="tiny muted" style={{ marginTop: 6 }}>{q.total > d.budget ? `${money(q.total - d.budget)} over` : `${money(d.budget - q.total)} under`} your {money(d.budget)} budget</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ steps
function BasicsStep({ draft, set, errors }) {
  const hidden = (t) => STEPS.filter((s) => !stepsFor(t).some((x) => x.key === s.key)).map((s) => s.label);
  return (
    <>
      <div>
        <p className="subhead">Dispatch type</p>
        <div className="type-cards" role="radiogroup" aria-label="Dispatch type">
          {Object.entries(TYPES).map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={draft.type === k}
              className={cx('type-card', draft.type === k && 'is-on')} onClick={() => set({ type: k })}>
              <span className="radio" aria-hidden="true" />
              <Icon name={TYPE_ICON[k]} size={22} />
              <strong>{t.label}</strong>
              <span className="tc-blurb">{t.blurb}</span>
              <span className="tc-steps">{stepsFor(k).length} steps{hidden(k).length ? ` · skips ${hidden(k).join(', ')}` : ' · every step'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <Input className="span-2" id="f-name" label="Dispatch name" required value={draft.name} error={errors.name}
          placeholder="e.g. Whitfield Rehearsal Dinner" onChange={(e) => set({ name: e.target.value })} />
        <Input id="f-date" label="Date" type="date" required value={draft.date} error={errors.date} onChange={(e) => set({ date: e.target.value })} />
        <Field label="Guest count" id="f-guests" error={errors.guestCount} hint="Used for portions, staff and seating">
          <Counter label="Guest count" value={draft.guestCount || 0} min={1} max={2000} step={5} onChange={(n) => set({ guestCount: n })} />
        </Field>
        <Input id="f-start" label="Start time" type="time" required value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
        <Input id="f-end" label="End time" type="time" required value={draft.endTime} error={errors.endTime} onChange={(e) => set({ endTime: e.target.value })} />
        <Input className="span-2" id="f-loc" label="Venue address" required value={draft.location} error={errors.location}
          placeholder="Venue name, street, city" onChange={(e) => set({ location: e.target.value })} />
        <Textarea className="span-2" id="f-notes" label="Arrival notes" optional value={draft.venueNotes || ''}
          placeholder="Loading dock, parking, who to ask for" hint="Shown to vendors and staff on the day"
          onChange={(e) => set({ venueNotes: e.target.value })} />
        <Input id="f-budget" label="Budget" optional prefix="$" inputMode="numeric" value={draft.budget ?? ''}
          placeholder="10,000" hint="We compare the estimate against it"
          onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); set({ budget: Number.isFinite(n) ? n : null }); }} />
      </div>
    </>
  );
}

function VendorStep({ draft, set, errors }) {
  const [q, setQ] = useState('');
  const [manual, setManual] = useState(draft.vendor?.kind === 'manual');
  const list = VENDORS.filter((v) => (v.name + v.cuisine + v.area + v.tags.join(' ')).toLowerCase().includes(q.toLowerCase()));
  const pickPage = (v) => {
    setManual(false);
    const keep = draft.vendor?.kind === 'page' && draft.vendor.vendorId === v.id;
    set({ vendor: { kind: 'page', vendorId: v.id }, menuItems: keep ? draft.menuItems : [] });
  };
  const m = draft.vendor?.kind === 'manual' ? draft.vendor : { kind: 'manual', name: '', contact: '' };
  const openManual = () => {
    setManual(true);
    set({ vendor: m, menuItems: (draft.menuItems || []).filter((i) => !i.itemId) });
  };
  return (
    <>
      <div className="invite-search">
        <Icon name="search" className="lead" />
        <input className="input" aria-label="Search Vendor Pages" placeholder="Search restaurants, cuisines or neighbourhoods"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {errors.vendor ? <p className="field-error">{errors.vendor}</p> : null}
      <div className="vlist" role="radiogroup" aria-label="Vendor Pages">
        {list.map((v, i) => {
          const on = draft.vendor?.kind === 'page' && draft.vendor.vendorId === v.id;
          return (
            <button type="button" key={v.id} role="radio" aria-checked={on} className={cx('vrow', on && 'is-on')} onClick={() => pickPage(v)}>
              <Photo scene={v.photo} className="vrow-photo" seed={i} />
              <span className="vrow-body">
                <span className="vrow-name">{v.name}</span>
                <span className="vrow-meta">{v.cuisine} · {v.area} · {v.minGuests}+ guests · {v.leadDays} days notice</span>
                <span className="vrow-about">{v.about}</span>
                <span className="vrow-tags">{v.tags.map((t) => <span key={t} className={cx('tag', t.includes('Farm') && 'tag-accent')}>{t}</span>)}</span>
              </span>
              <span className="vrow-side">
                <span className="vrow-price">from {money(v.from)}<small>per guest</small></span>
                <span className="radio-dot" aria-hidden="true">{on ? <Icon name="check" size={13} /> : null}</span>
              </span>
            </button>
          );
        })}
        {!list.length ? <p className="muted">No Vendor Pages match “{q}”. Add the restaurant by hand below.</p> : null}
      </div>
      <div className="or-line">or</div>
      <div className={cx('manual-box', manual && 'is-on')}>
        <div className="row-between">
          <div>
            <p className="subhead" style={{ margin: 0 }}>Vendor not on the platform?</p>
            <p className="small muted">The Manual Vendor Template gives you the same flow. We invite the vendor to confirm.</p>
          </div>
          {!manual ? <Button variant="secondary" icon="plus" onClick={openManual}>Use Manual Vendor Template</Button> : null}
        </div>
        {manual ? (
          <div className="form-grid">
            <Input id="mv-name" label="Vendor name" required value={m.name} error={errors.vendorName}
              placeholder="e.g. Nonna's Kitchen" onChange={(e) => set({ vendor: { ...m, name: e.target.value } })} />
            <Input id="mv-contact" label="Vendor contact" optional value={m.contact} placeholder="Email or phone"
              onChange={(e) => set({ vendor: { ...m, contact: e.target.value } })} />
            <p className="span-2 small muted">You will add menu items by hand in the next step.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function FoodStep({ draft, set, errors, id }) {
  const v = draft.vendor?.kind === 'page' ? vendorById(draft.vendor.vendorId) : null;
  const items = draft.menuItems || [];
  const qtyOf = (mid) => items.find((i) => i.itemId === mid)?.qty || 0;
  const setQty = (m, qty) => {
    const rest = items.filter((i) => i.itemId !== m.id);
    set({ menuItems: qty > 0 ? [...rest, { itemId: m.id, name: m.name, qty }].sort((a, b) => v.menu.findIndex((x) => x.id === a.itemId) - v.menu.findIndex((x) => x.id === b.itemId)) : rest });
  };
  if (!draft.vendor) {
    return <div className="panel-cream">Choose a vendor first. <a className="link" href={`#/builder/${id}/vendor`}>Go to Vendor</a></div>;
  }
  const courses = v ? [...new Set(v.menu.map((m) => m.course))] : [];
  return (
    <>
      {v ? (
        <div className="stack">
          <div className="row-between">
            <p className="subhead" style={{ margin: 0 }}>{v.name} menu</p>
            <button type="button" className="suggest-chip"
              onClick={() => set({ menuItems: items.length ? items.map((i) => ({ ...i, qty: draft.guestCount })) : ['Starter', 'Main', 'Dessert'].map((c) => v.menu.find((m) => m.course === c)).filter(Boolean).map((m) => ({ itemId: m.id, name: m.name, qty: draft.guestCount })) })}>
              <Icon name="users" size={16} />{items.length ? `Set every dish to ${draft.guestCount} portions` : `Start with a set menu for ${draft.guestCount}`}
            </button>
          </div>
          {courses.map((c) => (
            <div key={c} className="menu-course">
              <p className="eyebrow" style={{ margin: '6px 0 2px' }}>{c}</p>
              {v.menu.filter((m) => m.course === c).map((m) => (
                <div key={m.id} className={cx('menu-row', qtyOf(m.id) > 0 && 'is-on')}>
                  <span className="mi-name">{m.name}</span>
                  <span className="price">{money(m.price)} / portion</span>
                  <Counter label={`${m.name} portions`} value={qtyOf(m.id)} step={5} onChange={(n) => setQty(m, n)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="stack">
          <p className="subhead" style={{ margin: 0 }}>Menu items from {draft.vendor.name || 'your vendor'}</p>
          {items.map((it, n) => (
            <div className="manual-row" key={n}>
              <Input className="mr-name" label="Item" value={it.name} placeholder="e.g. Lasagna tray"
                onChange={(e) => set({ menuItems: items.map((x, j) => (j === n ? { ...x, name: e.target.value } : x)) })} />
              <Field label="Quantity"><Counter label="Quantity" value={it.qty} onChange={(q) => set({ menuItems: items.map((x, j) => (j === n ? { ...x, qty: q } : x)) })} /></Field>
              <Input label="Price" optional prefix="$" inputMode="numeric" value={it.price ?? ''}
                onChange={(e) => { const p = parseInt(e.target.value.replace(/\D/g, ''), 10); set({ menuItems: items.map((x, j) => (j === n ? { ...x, price: Number.isFinite(p) ? p : undefined } : x)) }); }} />
              <Button variant="quiet" icon="x" aria-label={`Remove ${it.name || 'item'}`} onClick={() => set({ menuItems: items.filter((_, j) => j !== n) })} />
            </div>
          ))}
          <div><Button variant="secondary" icon="plus" onClick={() => set({ menuItems: [...items, { name: '', qty: draft.guestCount }] })}>Add menu item</Button></div>
          <p className="small muted">Leave the price empty and the vendor prices it when they confirm.</p>
        </div>
      )}
      {errors.menu ? <p className="field-error">{errors.menu}</p> : null}
      <div>
        <p className="subhead">Service style</p>
        <Segmented label="Service style" value={draft.serviceStyle} onChange={(s) => set({ serviceStyle: s })}
          options={SERVICE_STYLES.map((s) => ({ value: s, label: s }))} />
      </div>
      <Textarea id="f-diet" label="Dietary notes" optional value={draft.dietaryNotes} placeholder="Allergies, vegetarian counts, table notes"
        onChange={(e) => set({ dietaryNotes: e.target.value })} />
    </>
  );
}

function ServicesStep({ draft, set }) {
  const on = (s) => draft.services.some((x) => x.vendorId === s.id);
  const toggle = (s) => set({ services: on(s) ? draft.services.filter((x) => x.vendorId !== s.id) : [...draft.services, { vendorId: s.id, category: s.category }] });
  return (
    <div className="svc-grid">
      {SERVICES.map((s) => (
        <button type="button" key={s.id} className={cx('svc', on(s) && 'is-on')} aria-pressed={on(s)} onClick={() => toggle(s)}>
          <span className="check-box" aria-hidden="true"><Icon name="check" size={14} /></span>
          <span className="grow">
            <span className="svc-cat">{s.category}</span>
            <span className="svc-name" style={{ display: 'block' }}>{s.name}</span>
            <span className="svc-detail">{s.detail}</span>
          </span>
          <span className="svc-price">{money(s.price)}</span>
        </button>
      ))}
    </div>
  );
}

function StaffStep({ draft, set }) {
  const g = draft.guestCount || 0;
  const rec = {
    Coordinator: 1,
    Server: Math.max(1, Math.ceil(g / 15)),
    Bartender: Math.max(1, Math.ceil(g / 60)),
    Attendant: g > 80 ? 1 : 0,
    Cleaner: g > 60 ? 1 : 0,
  };
  const count = (role) => draft.staff.find((s) => s.role === role)?.count || 0;
  const setCount = (role, n) => {
    const existing = draft.staff.find((s) => s.role === role);
    const rest = draft.staff.filter((s) => s.role !== role);
    const row = { role, count: n, assigned: (existing?.assigned || []).slice(0, n) };
    const order = STAFF_ROLES.map((r) => r.role);
    set({ staff: (n > 0 ? [...rest, row] : rest).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)) });
  };
  const applyRec = () => set({
    staff: STAFF_ROLES.filter((r) => rec[r.role]).map((r) => ({ role: r.role, count: rec[r.role], assigned: [] })),
  });
  return (
    <>
      <div>
        <button type="button" className="suggest-chip" onClick={applyRec}>
          <Icon name="sparkle" size={16} />Suggested for {g} guests: {Object.entries(rec).filter(([, n]) => n).map(([r, n]) => `${n} ${r.toLowerCase()}${n > 1 ? 's' : ''}`).join(', ')}
        </button>
      </div>
      <div>
        {STAFF_ROLES.map((r) => (
          <div className="staff-row" key={r.role}>
            <div><div className="sr-role">{r.role}</div><div className="sr-blurb">{r.blurb}</div></div>
            <span className="rate">{money(r.rate)}/h</span>
            <Counter label={`${r.role} count`} value={count(r.role)} max={40} onChange={(n) => setCount(r.role, n)} />
          </div>
        ))}
      </div>
      <Textarea id="f-staffnotes" label="Notes for staff" optional value={draft.staffNotes} placeholder="Timing cues, dress code changes, anything the team should know"
        hint="Appears on each staff member's phone and on the Staff Instruction Sheet" onChange={(e) => set({ staffNotes: e.target.value })} />
    </>
  );
}

function RsvpStep({ draft, set }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const r = draft.rsvp;
  const add = () => {
    if (!name.trim()) return;
    set({ rsvp: { ...r, guests: [...r.guests, { name: name.trim(), email: email.trim(), status: 'pending' }] } });
    setName('');
    setEmail('');
  };
  return (
    <>
      <div className="row-between panel-cream">
        <div className="grow">
          <p style={{ fontWeight: 500 }}>Collect RSVPs</p>
          <p className="small muted">Guests reply through their invitation link. Replies appear in the Ticket's Guests tab.</p>
        </div>
        <Toggle label="Collect RSVPs" checked={r.enabled} onChange={(v) => set({ rsvp: { ...r, enabled: v } })} />
      </div>
      {r.enabled ? (
        <>
          <form className="guest-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <Input id="g-name" label="Guest name" value={name} placeholder="Full name" onChange={(e) => setName(e.target.value)} />
            <Input id="g-email" label="Email" type="email" value={email} placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
            <Button variant="secondary" icon="plus" type="submit">Add guest</Button>
          </form>
          <div className="guest-list">
            {r.guests.map((g, i) => (
              <div className="guest-item" key={i}>
                <span className="grow"><strong style={{ fontWeight: 500 }}>{g.name}</strong> <span className="small muted">{g.email}</span></span>
                <Button variant="quiet" size="sm" icon="x" aria-label={`Remove ${g.name}`} onClick={() => set({ rsvp: { ...r, guests: r.guests.filter((_, j) => j !== i) } })} />
              </div>
            ))}
            {!r.guests.length ? <p className="small muted">No guests yet. Add a few now or later from the Ticket.</p> : null}
          </div>
          <p className="small muted">Invitations are mocked in this prototype. Nothing is emailed.</p>
        </>
      ) : <p className="muted">Skip this and keep a headcount of {draft.guestCount}. You can turn RSVPs on later.</p>}
    </>
  );
}

function MaterialsStep({ draft, set }) {
  const get = (item) => draft.materials.find((m) => m.item === item);
  const toggle = (item, on) => set({ materials: on ? [...draft.materials, { item, providedBy: 'vendor' }] : draft.materials.filter((m) => m.item !== item) });
  const setBy = (item, by) => set({ materials: draft.materials.map((m) => (m.item === item ? { ...m, providedBy: by } : m)) });
  return (
    <div>
      {MATERIALS.map((item) => {
        const m = get(item);
        return (
          <div className="mat-row" key={item}>
            <Checkbox checked={!!m} onChange={(on) => toggle(item, on)}>{item}</Checkbox>
            {m ? (
              <Segmented size="sm" label={`${item} provided by`} value={m.providedBy} onChange={(v) => setBy(item, v)}
                options={[{ value: 'vendor', label: 'Vendor provides' }, { value: 'us', label: 'We provide' }]} />
            ) : <span className="small muted">Not needed</span>}
          </div>
        );
      })}
    </div>
  );
}

function ReviewStep({ d, id, actor }) {
  const q = quoteFor(d);
  const steps = stepsFor(d.type).filter((s) => s.key !== 'review');
  const SECTION = {
    basics: <BasicsFacts d={d} />,
    vendor: <VendorFacts d={d} />,
    food: <FoodFacts d={d} />,
    services: <ServicesFacts d={d} />,
    staff: <StaffFacts d={d} assigned={false} />,
    rsvp: <RsvpFacts d={d} />,
    materials: <MaterialsFacts d={d} />,
  };
  const missing = steps.filter((s) => Object.keys(validate(s.key, d)).length);
  const paid = d.quote?.paid;
  return (
    <>
      {steps.map((s) => (
        <section className="rv-sec" key={s.key}>
          <div className="rv-sec-head">
            <h3>{s.label}</h3>
            <a className="edit-link" href={`#/builder/${id}/${s.key}?ret=review`}><Icon name="edit" size={15} />Edit</a>
          </div>
          {SECTION[s.key]}
        </section>
      ))}
      <section className="rv-sec">
        <div className="rv-sec-head"><h3>Estimate</h3><MockTag>Mock pricing</MockTag></div>
        <table className="estimate">
          <tbody>
            {q.lines.map((l, i) => (
              <tr key={i}><td>{l.label}{l.note ? <span className="est-note">{l.note}</span> : null}</td><td>{money(l.amount)}</td></tr>
            ))}
            <tr className="est-sub"><td>Platform fee (8%)</td><td>{money(q.fee)}</td></tr>
            <tr className="est-sub"><td>Tax (8.25% on food and services)</td><td>{money(q.tax)}</td></tr>
            <tr className="est-total"><td>Estimated total</td><td>{money(q.total)}</td></tr>
          </tbody>
        </table>
      </section>
      <div className="deposit-box">
        <div>
          <p className="eyebrow" style={{ color: '#b9b2a5' }}>Deposit due today · 30%</p>
          <p className="amt">{money(q.deposit)}</p>
          <p className="small muted">The balance of {money(q.total - q.deposit)} is due 5 days before the event.</p>
        </div>
        {paid ? (
          <Button variant="light" size="lg" iconRight="arrowRight" href={`#/ticket/${id}/overview`}>Deposit paid · open Ticket</Button>
        ) : (
          <Button variant="light" size="lg" iconRight="arrowRight" disabled={missing.length > 0}
            onClick={() => { approveQuote(id, actor); go(`/checkout/${id}`); }}>
            Approve quote & pay deposit
          </Button>
        )}
      </div>
      {missing.length && !paid ? (
        <p className="field-error">Finish {missing.map((s) => s.label).join(', ')} before approving the quote.</p>
      ) : null}
    </>
  );
}
