// Share dialog: invite by search or email with a role and permission, manage people with access,
// set link access and copy the link. Replaces today's separate Connect Partner and Share link cards.
import {
  USERS, userById, PERMISSIONS, PERMISSION_HINT, ROLE_DEFAULT_PERMISSION, PARTICIPANT_ROLE_LABEL,
} from './data.js';
import { toast } from './store.js';
import { invite, changePermission, removeParticipant, setLinkAccess, peopleWithAccess } from './actions.js';
import { Button, Dialog, Icon, Avatar, Select, cx } from './ui.jsx';

const { useState, useEffect, useMemo } = React;

const ROLE_OPTS = [
  { value: 'co_planner', label: 'Co-planner' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'staff', label: 'Staff' },
];
const PERM_OPTS = Object.entries(PERMISSIONS).map(([value, label]) => ({ value, label }));
const roleForUser = (u) => (u.kind === 'vendor' ? 'vendor' : u.kind === 'staff' ? 'staff' : 'co_planner');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ShareDialog({ open, onClose, d, actor }) {
  const [q, setQ] = useState('');
  const [chosen, setChosen] = useState(null);
  const [role, setRole] = useState('co_planner');
  const [perm, setPerm] = useState('edit');
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(0);
  const [confirmPublic, setConfirmPublic] = useState(false);

  useEffect(() => { if (!open) { setQ(''); setChosen(null); setRole('co_planner'); setPerm('edit'); setConfirmPublic(false); } }, [open]);

  const people = peopleWithAccess(d);
  const has = new Set(people.map((p) => p.userId).filter(Boolean));
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const list = USERS.filter((u) => !has.has(u.id) && u.kind !== 'lead_planner' && (u.name + ' ' + u.email + ' ' + u.title).toLowerCase().includes(t)).slice(0, 6);
    const items = list.map((u) => ({ kind: 'user', u }));
    if (EMAIL.test(q.trim()) && !USERS.some((u) => u.email.toLowerCase() === t)) items.push({ kind: 'email', email: q.trim() });
    return items;
  }, [q, people.length]);

  const choose = (r) => {
    const nextRole = r.kind === 'user' ? roleForUser(r.u) : role;
    setChosen(r);
    setRole(nextRole);
    setPerm(ROLE_DEFAULT_PERMISSION[nextRole]);
    setQ('');
    setFocus(false);
  };
  const onRole = (r) => { setRole(r); setPerm(ROLE_DEFAULT_PERMISSION[r]); };
  const send = () => {
    let target = chosen;
    if (!target && EMAIL.test(q.trim())) target = { kind: 'email', email: q.trim() };
    if (!target) return toast('Search for someone or type an email address');
    invite(d.id, target.kind === 'user' ? { userId: target.u.id } : { email: target.email }, role, perm, actor);
    toast(target.kind === 'user' ? `${target.u.name} added as ${PARTICIPANT_ROLE_LABEL[role]}` : `Invitation to ${target.email} recorded (mock, no email sent)`);
    setChosen(null);
    setQ('');
  };
  const link = `${window.location.href.split('#')[0]}#ticket.${d.id}`;
  const copy = async (e) => {
    const input = e.currentTarget.parentElement.querySelector('input');
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied');
    } catch (err) {
      input?.select();
      toast('Press Ctrl+C or ⌘C to copy the selected link');
    }
  };
  const onKey = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg" title={`Share “${d.name || 'Untitled Dispatch'}”`}
      description="Invite co-planners, vendors and staff. Each person's role sets their default permission, which you can change.">
      <div className="invite-row">
        {chosen ? (
          <div className="chosen invite-search">
            {chosen.kind === 'user' ? <Avatar userId={chosen.u.id} size={30} /> : <Avatar email={chosen.email} size={30} />}
            <span className="grow small" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {chosen.kind === 'user' ? chosen.u.name : chosen.email}
            </span>
            <button type="button" className="dialog-x" style={{ margin: 0, width: 32, height: 32 }} aria-label="Clear" onClick={() => setChosen(null)}><Icon name="x" size={16} /></button>
          </div>
        ) : (
          <div className="invite-search">
            <Icon name="search" className="lead" />
            <input className="input" id="share-q" aria-label="Search people and vendors, or type an email" placeholder="Name, vendor or email"
              value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} onKeyDown={onKey} autoComplete="off" />
            {focus && results.length ? (
              <div className="results" role="listbox">
                {results.map((r, i) => (
                  <button key={r.kind === 'user' ? r.u.id : r.email} type="button" role="option" aria-selected={i === active}
                    className={cx('result', i === active && 'is-active')} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(r)}>
                    {r.kind === 'user' ? <Avatar userId={r.u.id} size={30} /> : <Avatar email={r.email} size={30} />}
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>{r.kind === 'user' ? r.u.name : `Invite ${r.email}`}</span>
                      <span className="tiny muted">{r.kind === 'user' ? `${r.u.title} · ${r.u.email}` : 'Not on the platform yet. They will be asked to sign up.'}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <Select bare label="Role" value={role} onChange={(e) => onRole(e.target.value)} options={ROLE_OPTS} />
        <Select bare label="Permission" value={perm} onChange={(e) => setPerm(e.target.value)} options={PERM_OPTS} />
        <Button variant="primary" onClick={send}>Invite</Button>
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>
        {PARTICIPANT_ROLE_LABEL[role]} defaults to {PERMISSIONS[ROLE_DEFAULT_PERMISSION[role]]}. {PERMISSION_HINT[perm]}
        {role === 'vendor' ? ' Vendors can always update fulfilment status.' : ''}
      </p>

      <div className="share-sec">
        <h4>People with access · {people.length}</h4>
        {people.map((p) => {
          const key = p.userId || p.email;
          const u = userById(p.userId);
          const fixed = p.role === 'owner' ? 'Owner' : p.role === 'lead_planner' ? 'Lead Planner · Can edit' : p.source === 'staff' ? `Staff · ${PERMISSIONS[p.permission]}` : null;
          return (
            <div className="access-row" key={key}>
              <Avatar userId={p.userId} email={p.email} size={36} />
              <div className="who">
                <div className="person-name">{u?.name || p.email}{p.userId === actor ? ' (you)' : ''}</div>
                <div className="person-role">
                  {p.role === 'lead_planner' ? 'Cülinary Expréss' : p.source === 'staff' ? `Added from the Staff step · ${p.staffRole}` : p.pending ? 'Invite pending · not signed up yet' : `${PARTICIPANT_ROLE_LABEL[p.role]} · ${u?.email || ''}`}
                </div>
              </div>
              {fixed ? <span className="fixed">{fixed}</span> : (
                <Select bare label={`Permission for ${u?.name || p.email}`} value={p.permission}
                  options={[...PERM_OPTS, { value: '__remove', label: 'Remove access' }]}
                  onChange={(e) => {
                    if (e.target.value === '__remove') { removeParticipant(d.id, key, actor); toast(`Removed ${u?.name || p.email}`); }
                    else changePermission(d.id, key, e.target.value, actor);
                  }} />
              )}
            </div>
          );
        })}
        <p className="tiny muted" style={{ marginTop: 8 }}>Guests RSVP through their invitation link and never appear here.</p>
      </div>

      <div className="share-sec">
        <h4>Link access</h4>
        <label className={cx('link-opt', d.linkAccess === 'invited_only' && 'is-on')}>
          <input type="radio" name="link" checked={d.linkAccess === 'invited_only'} onChange={() => { setLinkAccess(d.id, 'invited_only', actor); setConfirmPublic(false); }} />
          <span><Icon name="lock" size={16} /> <strong style={{ fontWeight: 500 }}>Only invited people</strong><span className="small muted" style={{ display: 'block' }}>People above can open the link after signing in.</span></span>
        </label>
        <label className={cx('link-opt', d.linkAccess === 'anyone_view' && 'is-on')}>
          <input type="radio" name="link" checked={d.linkAccess === 'anyone_view'} onChange={() => { if (d.linkAccess !== 'anyone_view') setConfirmPublic(true); }} />
          <span className="grow">
            <Icon name="globe" size={16} /> <strong style={{ fontWeight: 500 }}>Anyone with the link can view</strong>
            <span className="small muted" style={{ display: 'block' }}>No sign-in needed. View only.</span>
            {confirmPublic && d.linkAccess !== 'anyone_view' ? (
              <span className="warn">
                <Icon name="warn" size={16} />
                <span>
                  The event address and contact details become visible to anyone who has the link.
                  <span className="row" style={{ marginTop: 8 }}>
                    <Button size="sm" variant="danger" onClick={(e) => { e.preventDefault(); setLinkAccess(d.id, 'anyone_view', actor); setConfirmPublic(false); }}>Turn on public link</Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); setConfirmPublic(false); }}>Keep it private</Button>
                  </span>
                </span>
              </span>
            ) : null}
            {d.linkAccess === 'anyone_view' ? (
              <span className="warn"><Icon name="warn" size={16} /><span>On. The address and contact details are visible to anyone with the link.</span></span>
            ) : null}
          </span>
        </label>
      </div>

      <div className="share-sec">
        <h4>Copy link</h4>
        <div className="copy-row">
          <input className="input" readOnly value={link} aria-label="Ticket link" onFocus={(e) => e.target.select()} />
          <Button variant="secondary" icon="copy" onClick={copy}>Copy link</Button>
        </div>
      </div>
    </Dialog>
  );
}
