// Mock Square checkout and confirmation. Clearly labelled: no payment is taken.
import { TYPES, userById, quoteFor } from './data.js';
import { fmtDate, fmtRange, money, plural } from './fmt.js';
import { useStore, toast } from './store.js';
import { payDeposit, actorId } from './actions.js';
import { go } from './router.js';
import { Button, Icon, Input, Emblem, StatusPill, LifecycleTracker, Empty } from './ui.jsx';

const { useState } = React;

export function Checkout({ id }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({ name: 'Maya Chen', number: '4242 4242 4242 4242', exp: '12 / 28', cvc: '123', zip: '97209' });
  if (!d) return <div className="page page-narrow"><Empty title="Nothing to pay for" action={<Button href="#/dashboard" variant="primary">Back to Dispatches</Button>} /></div>;
  const q = quoteFor(d);
  if (d.quote?.paid) {
    return (
      <div className="page page-narrow">
        <Empty title="Deposit already paid" body={`The deposit for ${d.name} was received.`} action={<Button variant="primary" href={`#/ticket/${id}/overview`}>Open the Ticket</Button>} />
      </div>
    );
  }
  const pay = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      payDeposit(id, actorId(state, d));
      go(`/confirmed/${id}`);
    }, 1100);
  };
  return (
    <div className="page">
      <div className="tk-crumb"><a href={`#/builder/${id}/review`}><Icon name="arrowLeft" size={14} /> Back to Review & Quote</a></div>
      <div className="bhead">
        <div>
          <p className="eyebrow">Checkout · {d.ticketNo}</p>
          <h1 className="bhead-title">Pay the deposit</h1>
        </div>
      </div>
      <div className="checkout">
        <div className="stub">
          <div className="stub-sec">
            <p className="eyebrow">{TYPES[d.type].label}</p>
            <p className="sum-name">{d.name}</p>
            <p className="small muted" style={{ marginTop: 6 }}>{fmtDate(d.date)} · {fmtRange(d.startTime, d.endTime)} · {plural(d.guestCount, 'guest')}</p>
          </div>
          <div className="stub-perf" />
          <div className="stub-sec">
            <table className="estimate">
              <tbody>
                {q.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td>{money(l.amount)}</td></tr>)}
                <tr className="est-sub"><td>Platform fee and tax</td><td>{money(q.fee + q.tax)}</td></tr>
                <tr className="est-total"><td>Total</td><td>{money(q.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="stub-perf" />
          <div className="stub-sec">
            <div className="sum-total"><span className="eyebrow">Due today · 30% deposit</span><span className="amt">{money(q.deposit)}</span></div>
            <p className="tiny muted" style={{ marginTop: 6 }}>Balance of {money(q.total - q.deposit)} due 5 days before the event.</p>
          </div>
        </div>

        <form className="square" onSubmit={pay}>
          <div className="row-between">
            <span className="square-brand"><span className="square-logo" aria-hidden="true" />Square</span>
            <span className="mock-tag"><Icon name="info" size={14} />Mock checkout</span>
          </div>
          <div className="mock-banner">
            <Icon name="info" />
            <span>This is a mock of the Square payment step. No card is charged and nothing leaves your browser. The test card is filled in for you.</span>
          </div>
          <Input id="pay-name" label="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
          <Input id="pay-num" label="Card number" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} prefix={<Icon name="card" size={18} />} />
          <div className="form-grid-3">
            <Input id="pay-exp" label="Expiry" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
            <Input id="pay-cvc" label="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
            <Input id="pay-zip" label="ZIP" value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value })} />
          </div>
          <Button variant="primary" size="xl" type="submit" className="btn-block" disabled={busy}>
            {busy ? <><span className="spinner" aria-hidden="true" />Processing</> : `Pay ${money(q.deposit)} deposit`}
          </Button>
          <p className="tiny muted" style={{ textAlign: 'center' }}>Mock payment · Powered by Square in production</p>
        </form>
      </div>
    </div>
  );
}

export function Confirmed({ id }) {
  const state = useStore();
  const d = state.dispatches.find((x) => x.id === id);
  if (!d) return null;
  const lp = userById(d.leadPlannerId);
  return (
    <div className="page page-narrow">
      <div className="confirm">
        <div className="confirm-road" aria-hidden="true"><Emblem size={120} className="confirm-car" /></div>
        <StatusPill status="confirmed">Deposit received · {money(d.quote?.deposit)}</StatusPill>
        <h1 className="h1">You're confirmed.</h1>
        <p className="lead">{d.name} is booked for {fmtDate(d.date, 'full')}. {lp.name} is your Lead Planner and is running the checkpoints with Autopilot.</p>
        <div className="stub" style={{ width: 'min(520px, 100%)', textAlign: 'left', marginTop: 10 }}>
          <div className="stub-sec">
            <div className="row-between"><span className="num small">{d.ticketNo}</span><span className="eyebrow">Dispatch Ticket</span></div>
            <p className="sum-name">{d.name}</p>
          </div>
          <div className="stub-perf" />
          <div className="stub-sec"><LifecycleTracker status={d.status} compact /></div>
          {(d.staff || []).some((x) => x.count > 0) ? (
            <>
              <div className="stub-perf" />
              <div className="stub-sec">
                <p className="eyebrow" style={{ marginBottom: 6 }}>Next: staffing</p>
                <p className="small">{lp.name} now offers each of the {(d.staff || []).reduce((n, x) => n + x.count, 0)} staff seats. Each person accepts on their phone, and you can follow it on the Ticket's Staff tab.</p>
              </div>
            </>
          ) : null}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
          <Button variant="primary" size="lg" iconRight="arrowRight" href={`#/ticket/${id}/overview`}>Open the Dispatch Ticket</Button>
        </div>
        <p className="tiny muted">A receipt would be emailed in production. Nothing is sent from this prototype.</p>
      </div>
    </div>
  );
}
