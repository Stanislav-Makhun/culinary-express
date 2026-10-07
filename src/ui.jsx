// Reusable UI pieces: Button, Input, Select, Segmented, Stepper, Card, Tabs, Dialog, Drawer,
// Avatar stack, Status pill, Lifecycle tracker, Photo placeholder and the logo emblem.
import { LIFECYCLE, LIFECYCLE_LABEL, userById } from './data.js';
import { initials } from './fmt.js';
import LOGO_SVG from '../assets/logo.svg';

const { useState, useEffect, useRef, useId } = React;

export const cx = (...a) => a.filter(Boolean).join(' ');

// ------------------------------------------------------------ icons (1.5px stroke)
const P = {
  calendar: 'M4 6.5h16v13H4zM4 10h16M8 4v4M16 4v4',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.3c1.8.8 3 2.8 3 5.7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v6h14v-6',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  phone: 'M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z',
  map: 'M9 4L3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20',
  message: 'M4 5h16v11H9l-5 4z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a3 3 0 0 1 3-3h1M18 9v6a3 3 0 0 1-3 3h-1',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z',
  warn: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  play: 'M8 5l11 7-11 7z',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  fork: 'M7 3v8a2 2 0 0 0 4 0V3M9 13v8M17 21V3c-2 1-3 3.5-3 7h3',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8',
  menu: 'M4 7h16M4 12h16M4 17h16',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.5 4.5M20 20v-3.5h-3.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  dot: 'M12 12.01',
  layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
  compare: 'M12 3v18M4 6h5v12H4zM15 6h5v12h-5z',
  car: 'M3 15v-3l2-5h9l4 5h3v3M6.5 17.5a1.8 1.8 0 1 0 0-.1M17 17.5a1.8 1.8 0 1 0 0-.1M8.5 17h6.5',
};
export function Icon({ name, size = 18, className, title }) {
  return (
    <svg className={cx('ic', className)} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      <path d={P[name] || P.dot} />
    </svg>
  );
}

// ------------------------------------------------------------ brand
export function Emblem({ size = 40, invert = false, className }) {
  return (
    <span className={cx('emblem', invert && 'emblem-invert', className)} style={{ width: size, height: size }}
      role="img" aria-label="Cülinary Expréss emblem" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
  );
}

export function Wordmark({ size = 'md' }) {
  return (
    <span className={cx('wordmark', `wordmark-${size}`)}>
      C<span className="acc">ü</span>linary Expr<span className="acc">é</span>ss
    </span>
  );
}

// ------------------------------------------------------------ buttons & form controls
export function Button({ variant = 'secondary', size, icon, iconRight, children, className, href, ...rest }) {
  const cls = cx('btn', `btn-${variant}`, size && `btn-${size}`, !children && 'btn-icon', className);
  const inner = (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 18} /> : null}
    </>
  );
  if (href) return <a className={cls} href={href} {...rest}>{inner}</a>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}

export function Field({ label, hint, required, optional, children, id, error, className }) {
  return (
    <div className={cx('field', className)}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true"> *</span> : null}
        {optional ? <span className="opt"> (optional)</span> : null}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ label, hint, required, optional, id, prefix, suffix, className, error, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} hint={hint} required={required} optional={optional} id={fid} error={error} className={className}>
      <div className={cx('input-wrap', error && 'has-error')}>
        {prefix ? <span className="affix">{prefix}</span> : null}
        <input id={fid} className="input" required={required} {...rest} />
        {suffix ? <span className="affix">{suffix}</span> : null}
      </div>
    </Field>
  );
}

export function Textarea({ label, hint, optional, id, className, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} hint={hint} optional={optional} id={fid} className={className}>
      <textarea id={fid} className="input textarea" rows={3} {...rest} />
    </Field>
  );
}

export function Select({ label, hint, id, options, className, bare, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  const sel = (
    <div className={cx('select-wrap', bare && 'select-bare')}>
      <select id={fid} className="input select" aria-label={bare ? label : undefined} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="down" size={16} className="select-chev" />
    </div>
  );
  if (bare) return sel;
  return <Field label={label} hint={hint} id={fid} className={className}>{sel}</Field>;
}

export function Segmented({ value, onChange, options, label, size, className }) {
  return (
    <div className={cx('segmented', size && `segmented-${size}`, className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={cx('seg', value === o.value && 'is-on')} onClick={() => onChange(o.value)}>
          {o.icon ? <Icon name={o.icon} size={16} /> : null}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Counter({ value, onChange, min = 0, max = 999, step = 1, label }) {
  return (
    <div className="counter" role="group" aria-label={label}>
      <button type="button" className="counter-btn" aria-label={`Decrease ${label}`} disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}><Icon name="minus" size={16} /></button>
      <input className="counter-val" inputMode="numeric" aria-label={label} value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }} />
      <button type="button" className="counter-btn" aria-label={`Increase ${label}`} disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}><Icon name="plus" size={16} /></button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }) {
  const auto = useId();
  return (
    <button id={id || auto} type="button" role="switch" aria-checked={checked} aria-label={label}
      className={cx('toggle', checked && 'is-on')} onClick={() => onChange(!checked)}>
      <span className="toggle-knob" />
    </button>
  );
}

export function Checkbox({ checked, onChange, children, className }) {
  return (
    <label className={cx('check', checked && 'is-on', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check-box" aria-hidden="true"><Icon name="check" size={14} /></span>
      <span className="check-text">{children}</span>
    </label>
  );
}

// ------------------------------------------------------------ surfaces
export function Card({ title, eyebrow, action, children, className, flush, id }) {
  return (
    <section className={cx('card', flush && 'card-flush', className)} id={id}>
      {title || action ? (
        <header className="card-head">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h3 className="card-title">{title}</h3> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  return (
    <div className={cx('tabs', className)} role="tablist" ref={ref}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value}
          className={cx('tab', value === t.value && 'is-on')} onClick={() => onChange(t.value)}>
          {t.label}
          {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Dialog({ open, onClose, title, description, children, footer, size, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const f = ref.current?.querySelector('[data-autofocus], input, select, textarea, button:not(.dialog-x)');
      f?.focus();
    }, 30);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      document.body.classList.remove('no-scroll');
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('dialog', size && `dialog-${size}`, className)} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="dialog-head">
          <div>
            <h2 className="dialog-title">{title}</h2>
            {description ? <p className="dialog-desc">{description}</p> : null}
          </div>
          <button type="button" className="dialog-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer ? <footer className="dialog-foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="overlay overlay-drawer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="dialog-head">
          <h2 className="dialog-title">{title}</h2>
          <button type="button" className="dialog-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}

// ------------------------------------------------------------ people
const TONES = ['t1', 't2', 't3', 't4', 't5', 't6'];
const toneFor = (id = '') => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

export function Avatar({ userId, email, size = 32, ring }) {
  const u = userById(userId);
  const name = u?.name || email || '?';
  return (
    <span className={cx('avatar', toneFor(userId || email), ring && 'avatar-ring', !u && 'avatar-pending')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} title={name}>
      {u ? initials(u.name) : <Icon name="mail" size={Math.round(size * 0.5)} />}
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 30 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="avatar-stack" aria-label={`${people.length} people`}>
      {shown.map((p) => <Avatar key={p.userId || p.email} userId={p.userId} email={p.email} size={size} ring />)}
      {extra > 0 ? <span className="avatar avatar-more avatar-ring" style={{ width: size, height: size }}>+{extra}</span> : null}
    </span>
  );
}

// ------------------------------------------------------------ status
export function StatusPill({ status, children, tone }) {
  const t = tone || {
    inquiry: 'neutral', planning: 'neutral', quoted: 'amber', confirmed: 'sage', live: 'live', completed: 'muted',
  }[status] || 'neutral';
  return (
    <span className={cx('pill', `pill-${t}`)}>
      {t === 'live' ? <span className="live-dot" aria-hidden="true" /> : null}
      {children || LIFECYCLE_LABEL[status]}
    </span>
  );
}

// The route line: stops joined by a dotted line. Used for the lifecycle and the builder stepper.
export function LifecycleTracker({ status, compact }) {
  const idx = LIFECYCLE.indexOf(status);
  return (
    <ol className={cx('route', compact && 'route-compact')} aria-label="Dispatch lifecycle">
      {LIFECYCLE.map((s, i) => (
        <li key={s} className={cx('stop', i < idx && 'is-done', i === idx && 'is-current')}
          aria-current={i === idx ? 'step' : undefined}>
          <span className="stop-dot">{i < idx ? <Icon name="check" size={12} /> : null}</span>
          <span className="stop-label">{LIFECYCLE_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function StepRail({ steps, current, onPick, reached }) {
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <ol className="route route-steps" aria-label="Builder steps">
      {steps.map((s, i) => {
        const can = reached.includes(s.key) || i <= idx;
        return (
          <li key={s.key} className={cx('stop', i < idx && 'is-done', i === idx && 'is-current')}
            aria-current={i === idx ? 'step' : undefined}>
            <button type="button" className="stop-btn" disabled={!can} onClick={() => onPick(s.key)}>
              <span className="stop-dot">{i < idx ? <Icon name="check" size={12} /> : <span className="stop-num">{i + 1}</span>}</span>
              <span className="stop-label">{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ------------------------------------------------------------ photo placeholders
// Warm duotone "photographs" built from gradients and a silhouette, so no remote images are needed.
const SCENES = {
  glasshouse: { a: '#3b2f25', b: '#c9a978', c: '#f2dcb4', sil: 'arches' },
  loft: { a: '#2a2622', b: '#9c8a74', c: '#e8d8bf', sil: 'windows' },
  buffet: { a: '#3a2a1f', b: '#b9824f', c: '#f0c993', sil: 'table' },
  garden: { a: '#2b2f24', b: '#8f9a6f', c: '#e6e0b8', sil: 'trees' },
  trattoria: { a: '#35241c', b: '#b0714a', c: '#f1c79a', sil: 'glasses' },
  spice: { a: '#3a2418', b: '#c0773a', c: '#f4c27d', sil: 'bowls' },
  grill: { a: '#221d1a', b: '#8c5a3c', c: '#e6a96c', sil: 'flames' },
  dinner: { a: '#2d241e', b: '#a7835b', c: '#f3d6a6', sil: 'glasses' },
  staff: { a: '#262321', b: '#7f746a', c: '#e2d6c6', sil: 'table' },
  office: { a: '#25272a', b: '#7c7f80', c: '#dcdad3', sil: 'windows' },
  florals: { a: '#2f2626', b: '#a7787a', c: '#f0d4cf', sil: 'trees' },
};
const SIL = {
  arches: 'M0 100V55c0-14 9-24 20-24s20 10 20 24v45M40 100V55c0-14 9-24 20-24s20 10 20 24v45M80 100V55c0-14 9-24 20-24s20 10 20 24v45M120 100V55c0-14 9-24 20-24s20 10 20 24v45M160 100V55c0-14 9-24 20-24s20 10 20 24v45',
  windows: 'M10 20h40v55H10zM60 20h40v55H60zM110 20h40v55h-40zM160 20h40v55h-40zM30 20v55M80 20v55M130 20v55M180 20v55M10 47h190',
  table: 'M10 78h180M20 78v22M180 78v22M40 78c0-9 8-14 14-14s14 5 14 14M95 78c0-12 10-18 18-18s18 6 18 18M150 78c0-8 6-12 11-12s11 4 11 12',
  trees: 'M30 100V60M30 60c-14 0-18-22 0-30 18 8 14 30 0 30zM100 100V50M100 50c-18 0-22-28 0-38 22 10 18 38 0 38zM165 100V65M165 65c-12 0-15-18 0-25 15 7 12 25 0 25z',
  glasses: 'M40 100V78M30 100h20M40 78c-9 0-12-10-11-28h22c1 18-2 28-11 28zM90 100V74M80 100h20M90 74c-10 0-13-12-12-32h24c1 20-2 32-12 32zM150 100V80M140 100h20M150 80c-8 0-10-9-9-24h18c1 15-1 24-9 24z',
  bowls: 'M20 80c0 12 14 18 30 18s30-6 30-18zM90 74c0 14 18 22 38 22s38-8 38-22zM40 70c4-8 16-8 20 0M120 62c6-10 20-10 26 0',
  flames: 'M60 100c-20 0-26-24-8-44 0 14 10 16 12 4 14 14 18 40-4 40zM130 100c-24 0-30-30-8-54 0 18 12 20 14 6 16 18 20 48-6 48z',
};
export function Photo({ scene = 'dinner', className, label, children, seed = 0 }) {
  const s = SCENES[scene] || SCENES.dinner;
  const x1 = 18 + ((seed * 37) % 60);
  const x2 = 70 - ((seed * 23) % 40);
  const style = {
    backgroundColor: s.a,
    backgroundImage: [
      `radial-gradient(circle at ${x1}% 28%, ${s.c}cc 0, ${s.c}00 18%)`,
      `radial-gradient(circle at ${x2}% 18%, ${s.c}aa 0, ${s.c}00 12%)`,
      `radial-gradient(circle at ${(x1 + 40) % 95}% 40%, ${s.c}88 0, ${s.c}00 9%)`,
      `radial-gradient(ellipse at 50% 120%, ${s.b} 0, ${s.b}00 70%)`,
      `linear-gradient(160deg, ${s.b}55, ${s.a} 75%)`,
    ].join(','),
  };
  return (
    <div className={cx('photo', className)} style={style} role={label ? 'img' : undefined} aria-label={label}>
      <svg className="photo-sil" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d={SIL[s.sil]} fill="none" stroke={s.c} strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="photo-grain" aria-hidden="true" />
      {children}
    </div>
  );
}

export function Empty({ title, body, action, emblem = true }) {
  return (
    <div className="empty">
      {emblem ? <Emblem size={88} className="empty-emblem" /> : null}
      <h3 className="empty-title">{title}</h3>
      {body ? <p className="empty-body">{body}</p> : null}
      {action}
    </div>
  );
}

export function MockTag({ children = 'Mock' }) {
  return <span className="mock-tag"><Icon name="info" size={14} />{children}</span>;
}
