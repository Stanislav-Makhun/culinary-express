// Landing page and sign-up stub.
import { setSession } from './actions.js';
import { useStore, toast } from './store.js';
import { go } from './router.js';
import { Button, Icon, Emblem, Wordmark, Photo, LifecycleTracker, StatusPill, Input, MockTag, cx } from './ui.jsx';

const { useState, useEffect } = React;

const HOW = [
  ['Choose any restaurant', 'Pick a Vendor Page, or bring a favourite place that is not on the platform yet.'],
  ['Choose any venue', 'A home, an office floor, a garden, or the restaurant’s own room.'],
  ['Event details & RSVPs', 'Date, guests and dietary notes. Invite guests and watch replies arrive in one list.'],
  ['Vendor partnerships', 'Add a florist, rentals, a photographer or music to the same Ticket.'],
  ['Staff selection', 'Coordinators, servers and bartenders, with their instructions on their phones.'],
  ['Dispatch', 'Approve the quote and pay the deposit. Your Lead Planner takes it from there.'],
];

export const ROLE_CARDS = [
  {
    role: 'client', label: 'Client', scene: 'dinner',
    benefit: 'Any restaurant, any venue. One ticket from planning to cleanup.',
    points: ['Build the whole event in one guided flow', 'See every change, suggestion and payment in one place', 'A Lead Planner watches the checkpoints for you'],
    cta: 'Plan a Dispatch',
  },
  {
    role: 'vendor', label: 'Vendor', scene: 'trattoria',
    benefit: 'Get booked for events, with no commissions.',
    points: ['Your Vendor Page pre-builds every order', 'Suggest changes instead of chasing emails', 'Update fulfilment status from the Ticket'],
    cta: 'Become a Vendor',
  },
  {
    role: 'staff', label: 'Staff', scene: 'staff',
    benefit: 'Every shift detail on your phone: where, when, what and who.',
    points: ['Call time, address and contacts on one screen', 'Checklists and status updates in a tap', 'Pay above the industry average'],
    cta: 'Join the Staff',
  },
  {
    role: 'office', label: 'Office Administrator', scene: 'office',
    benefit: 'Recurring team meals and office events, handled on one Office Plan.',
    points: ['Set up weekly lunches once', 'Headcounts and dietary notes kept per team', 'Every order lands on the same plan'],
    cta: 'Set up your office',
  },
];

export function LandingNav() {
  return (
    <header className="lnav">
      <div className="lnav-in">
        <a className="brand" href="#/" aria-label="Cülinary Expréss home">
          <Emblem size={46} />
          <Wordmark size="md" />
        </a>
        <nav className="lnav-links" aria-label="Landing">
          <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }}>How it works</a>
          <a href="#roles" onClick={(e) => { e.preventDefault(); document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' }); }}>Who it's for</a>
          <a href="#/signup?role=vendor">For vendors</a>
          <a href="#/dashboard">Sign in</a>
        </nav>
        <Button className="lnav-cta" variant="primary" href="#/signup?role=client">Plan a Dispatch</Button>
      </div>
    </header>
  );
}

export function Landing() {
  return (
    <div>
      <LandingNav />
      <section className="hero">
        <div>
          <p className="eyebrow">Cater Builder & Fulfiller</p>
          <h1 className="hero-title" style={{ marginTop: 18 }}>Create the <em>Moment</em>.</h1>
          <p className="hero-sub">
            Pick any restaurant and any venue. Cülinary Expréss turns your plan into one shared Dispatch Ticket
            that vendors, staff and your Lead Planner work from, from the first menu idea to the last chair stacked.
          </p>
          <div className="hero-ctas">
            <Button variant="primary" size="xl" iconRight="arrowRight" href="#/signup?role=client">Plan a Dispatch</Button>
            <Button variant="secondary" size="xl" href="#/signup?role=vendor">Become a Vendor</Button>
          </div>
          <p className="hero-meta">How will you expréss it?</p>
        </div>
        <div className="hero-visual">
          <Photo scene="glasshouse" className="hero-photo" seed={3} label="Candlelit dinner in a glasshouse" />
          <Emblem size={104} className="hero-emblem" />
          <div className="stub mini-ticket hero-ticket" aria-label="Example Dispatch Ticket">
            <div className="stub-sec">
              <div className="row-between"><span className="num tiny">CX-1024</span><StatusPill status="confirmed" /></div>
              <p className="name">Whitfield Rehearsal Dinner</p>
              <div className="facts">
                <span><Icon name="calendar" size={14} />Sat, Oct 24</span>
                <span><Icon name="clock" size={14} />6:30 PM</span>
                <span><Icon name="users" size={14} />60 guests</span>
              </div>
            </div>
            <div className="stub-perf" />
            <div className="stub-sec"><LifecycleTracker status="confirmed" compact /></div>
          </div>
        </div>
      </section>

      <div className="facts-strip">
        <div className="facts-strip-in">
          <div className="fact-cell"><span className="fact-big">3</span><span className="fact-small">ways to dispatch: delivery, full event or onsite booking</span></div>
          <div className="fact-cell"><span className="fact-big">1</span><span className="fact-small">Ticket shared by everyone working the event</span></div>
          <div className="fact-cell"><span className="fact-big">0%</span><span className="fact-small">commission for vendors</span></div>
          <div className="fact-cell"><span className="fact-big">390px</span><span className="fact-small">is all a staff member needs: the shift lives on their phone</span></div>
        </div>
      </div>

      <section className="lsection" id="how">
        <div className="lsection-head">
          <h2 className="h1">From idea to <em className="serif" style={{ color: 'var(--champagne)' }}>Dispatch</em> in six stops.</h2>
          <p>Each stop fills in the same Ticket. Nothing is typed twice, and everyone you invite sees the same version.</p>
        </div>
        <ol className="how">
          {HOW.map(([t, b], i) => (
            <li key={t}>
              <span className="how-dot">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="lsection" id="roles">
        <div className="lsection-head">
          <h2 className="h1">One Ticket. Four ways in.</h2>
          <p>Whether you are hosting, cooking, serving or ordering for an office, you start from the part that is yours.</p>
        </div>
        <div className="roles">
          {ROLE_CARDS.map((r, i) => (
            <article className="role-card" key={r.role}>
              <Photo scene={r.scene} className="role-photo" seed={i + 5}><span className="pill pill-solid">{r.label}</span></Photo>
              <div className="role-body">
                <h3 className="role-benefit">{r.benefit}</h3>
                <ul className="role-points">
                  {r.points.map((p) => <li key={p}><Icon name="check" size={16} />{p}</li>)}
                </ul>
                <Button variant={r.role === 'client' ? 'primary' : 'secondary'} iconRight="arrowRight" href={`#/signup?role=${r.role}`}>{r.cta}</Button>
              </div>
            </article>
          ))}
        </div>
        <p className="also"><strong>Also on the platform:</strong> Guests RSVP through their invitation link; administrators manage the network.</p>
      </section>

      <section className="closer">
        <div className="closer-in">
          <Emblem size={120} invert />
          <div>
            <h2>Your next event, <em>expréssed</em>.</h2>
            <p>Start a Dispatch in a few minutes, or talk it through with a Lead Planner first.</p>
          </div>
          <div className="closer-ctas">
            <Button variant="light" size="lg" iconRight="arrowRight" href="#/signup?role=client">Plan a Dispatch</Button>
            <Button variant="outline-light" size="lg" icon="calendar" onClick={() => toast('Mock: this opens the meeting calendar')}>Schedule a meeting</Button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="stack">
          <a className="brand" href="#/"><Emblem size={52} /><Wordmark /></a>
          <p className="muted small" style={{ maxWidth: '36ch' }}>A hospitality operations platform. Any restaurant, any venue, one Dispatch Ticket.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <ul>
            <li><a href="#/signup?role=client">Plan a Dispatch</a></li>
            <li><a href="#/signup?role=vendor">Become a Vendor</a></li>
            <li><a href="#/signup?role=staff">Join the Staff</a></li>
            <li><a href="#/signup?role=office">Office Plan</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }}>How it works</a></li>
            <li><button type="button" className="link" onClick={() => toast('Mock: Terms page')}>Terms</button></li>
            <li><button type="button" className="link" onClick={() => toast('Mock: Privacy page')}>Privacy</button></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><span style={{ userSelect: 'all' }}>plan@culinary.express</span></li>
            <li><button type="button" className="link" onClick={() => toast('Mock: this opens the meeting calendar')}>Schedule a meeting</button></li>
          </ul>
        </div>
        <div className="footer-legal">
          <span>© 2026 Farmers Table LLC d/b/a Cülinary Expréss</span>
          <span>Prototype for alignment. Not a live product.</span>
        </div>
      </footer>
    </div>
  );
}

const SIGNUP_ROLES = [
  { value: 'client', label: 'Client', hint: 'Plan and own Dispatches', name: 'Maya Chen', email: 'maya.chen@example.com' },
  { value: 'vendor', label: 'Vendor', hint: 'Restaurants and service vendors', name: 'Marco Bellini', email: 'events@bellacucina.example' },
  { value: 'staff', label: 'Staff', hint: 'Work shifts at events', name: 'Diego Ramos', email: 'diego.ramos@example.com' },
  { value: 'office', label: 'Office Administrator', hint: 'Recurring office meals', name: 'Grace Okoye', email: 'grace.okoye@example.com' },
];

export function Signup({ role: initial }) {
  const start = SIGNUP_ROLES.find((r) => r.value === initial) || SIGNUP_ROLES[0];
  const [role, setRole] = useState(start.value);
  const [name, setName] = useState(start.name);
  const [email, setEmail] = useState(start.email);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    const r = SIGNUP_ROLES.find((x) => x.value === initial) || SIGNUP_ROLES[0];
    setRole(r.value); setName(r.name); setEmail(r.email); setTouched(false);
  }, [initial]);
  const pickRole = (v) => {
    setRole(v);
    if (!touched) {
      const r = SIGNUP_ROLES.find((x) => x.value === v);
      setName(r.name);
      setEmail(r.email);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    if (role === 'office') return go('/home/office');
    setSession({ role, signupRole: role });
    go(role === 'client' ? '/dashboard' : '/dashboard');
  };
  const card = ROLE_CARDS.find((r) => r.role === role);
  return (
    <div>
      <LandingNav />
      <div className="signup">
        <Photo scene={card.scene} className="signup-art" seed={7}>
          <p className="display">Create the Moment.</p>
          <p>{card.benefit}</p>
        </Photo>
        <form className="signup-form" onSubmit={submit}>
          <div className="stack" style={{ gap: 10 }}>
            <MockTag>Demo sign-up · no account is created</MockTag>
            <h1 className="h1">Create your account</h1>
            <p className="muted">Choose how you will use Cülinary Expréss. You can add more roles later.</p>
          </div>
          <div className="role-pick" role="radiogroup" aria-label="I am joining as">
            {SIGNUP_ROLES.map((r) => (
              <button type="button" key={r.value} role="radio" aria-checked={role === r.value}
                className={cx('role-opt', role === r.value && 'is-on')} onClick={() => pickRole(r.value)}>
                <span className="radio" aria-hidden="true" />
                <strong>{r.label}</strong>
                <span>{r.hint}</span>
              </button>
            ))}
          </div>
          <Input id="su-name" label="Full name" value={name} onChange={(e) => { setName(e.target.value); setTouched(true); }} />
          <Input id="su-email" label="Work email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setTouched(true); }} />
          <Button variant="primary" size="lg" type="submit" iconRight="arrowRight" className="btn-block">Continue</Button>
          <p className="small muted">Already have an account? <a className="link" href="#/dashboard">Sign in</a></p>
        </form>
      </div>
    </div>
  );
}
