// App entry: router, header choice, toasts and the demo toolbar.
import { useRoute, go } from './router.js';
import { useStore, onToast } from './store.js';
import { Icon } from './ui.jsx';
import { Landing, Signup } from './landing.jsx';
import { AppHeader, ClientDashboard, VendorDashboard, StaffShifts, Placeholder } from './dashboard.jsx';
import { Builder } from './builder.jsx';
import { Checkout, Confirmed } from './checkout.jsx';
import { TicketPage } from './ticket.jsx';
import { StaffView } from './staff.jsx';
import { StaffSheet, Compare, DemoToolbar } from './extras.jsx';
import { createDispatch } from './actions.js';

const { useState, useEffect } = React;

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => onToast((t) => {
    setItems((x) => [...x.slice(-1), t]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 2800);
  }), []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => <div className="toast" key={t.id}><Icon name={t.tone === 'warn' ? 'warn' : 'check'} size={16} />{t.text}</div>)}
    </div>
  );
}

const TITLES = { '': 'Cülinary Expréss', signup: 'Sign up', dashboard: 'Dispatches', builder: 'Dispatch Builder', edit: 'Edit', checkout: 'Checkout', confirmed: 'Confirmed', ticket: 'Dispatch Ticket', staff: 'Your shift', doc: 'Staff Instruction Sheet', compare: 'Before / after' };

function App() {
  const route = useRoute();
  const state = useStore();
  const [p0 = '', p1, p2] = route.parts;
  const role = state.session.role;

  useEffect(() => { window.scrollTo({ top: 0 }); }, [p0, p1]);
  useEffect(() => {
    document.title = p0 ? `${TITLES[p0] || 'Prototype'} · Cülinary Expréss` : 'Cülinary Expréss';
    if (p0 === 'new') go(`/builder/${createDispatch()}/basics`);
  }, [p0, p1]);

  let screen;
  let chrome = 'app';
  switch (p0) {
    case '':
    case 'landing': screen = <Landing />; chrome = 'none'; break;
    case 'signup': screen = <Signup role={route.q.role || 'client'} />; chrome = 'none'; break;
    case 'dashboard':
      screen = role === 'vendor' ? <VendorDashboard /> : role === 'staff' ? <StaffShifts /> : <ClientDashboard forceEmpty={route.q.empty === '1'} />;
      break;
    case 'home': screen = <Placeholder role={p1} />; break;
    case 'builder': screen = <Builder id={p1} step={p2 || 'basics'} mode="create" ret={route.q.ret} />; break;
    case 'edit': screen = <Builder id={p1} step={p2 || 'basics'} mode="edit" ret={route.q.ret} />; break;
    case 'checkout': screen = <Checkout id={p1} />; break;
    case 'confirmed': screen = <Confirmed id={p1} />; break;
    case 'ticket': screen = <TicketPage id={p1} tab={p2} />; break;
    case 'staff': screen = <StaffView id={p1} />; chrome = 'none'; break;
    case 'doc': screen = <StaffSheet id={p1} />; chrome = 'none'; break;
    case 'compare': screen = <Compare />; break;
    default: screen = <Landing />; chrome = 'none';
  }
  return (
    <>
      {chrome === 'app' ? <AppHeader active={p0} /> : null}
      <main id="main">{screen}</main>
      <DemoToolbar route={route} />
      <Toasts />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
