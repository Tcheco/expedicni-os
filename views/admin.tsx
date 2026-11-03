'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CARRIERS, CLIENTS, DISPATCHERS, carrierById } from '@/lib/data';
import { fmtDate, fmtKc, fmtNum, fmtTime, pct } from '@/lib/format';

export default function AdminPage() {
  const { data, addTask, toggleTask } = useStore();
  const d = data!;
  const y = d.yesterday;
  const driverName = (id: string) => d.drivers.find((r) => r.id === id)?.name ?? id;
  const assigneeName = (id: string) => DISPATCHERS.find((x) => x.id === id)?.name ?? driverName(id);

  const today = useMemo(() => {
    const s = d.shipments;
    return {
      total: s.length,
      delivered: s.filter((x) => x.status === 'doruceno').length,
      failed: s.filter((x) => x.status === 'nedoruceno').length,
      unassigned: s.filter((x) => x.carrier === 'vlastni' && !x.driverId).length,
      onRoad: new Set(s.filter((x) => x.status === 'na_ceste' && x.driverId).map((x) => x.driverId)).size,
    };
  }, [d.shipments]);

  const ranked = [...y.drivers].map((r) => ({ ...r, rate: r.delivered / r.stops })).sort((a, b) => b.rate - a.rate);
  const maxHour = Math.max(...y.byHour.map((h) => h.delivered));
  const maxFail = Math.max(...y.failReasons.map((f) => f.count));

  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('d1');
  const [due, setDue] = useState('14:00');
  const [prio, setPrio] = useState<'normalni' | 'vysoka'>('normalni');
  const [showDone, setShowDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const [h, m] = due.split(':').map(Number);
    const dt = new Date(); dt.setHours(h, m, 0, 0);
    addTask({ title: title.trim(), assignee, due: dt.toISOString(), priority: prio });
    setTitle('');
  };

  const tasks = d.tasks.filter((t) => showDone || !t.done);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dobré ráno, tady je včerejšek</h1>
          <p className="muted">Výsledky za {fmtDate(y.date)}</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Zásilek celkem" value={fmtNum(y.total)} />
        <Kpi label="Doručeno" value={fmtNum(y.delivered)} sub={pct(y.delivered, y.total)} tone="good" />
        <Kpi label="Nedoručeno" value={fmtNum(y.failed)} sub={pct(y.failed, y.total)} tone="bad" />
        <Kpi label="Předáno dopravcům" value={fmtNum(y.handedToCarriers)} />
        <Kpi label="Vybráno na dobírkách" value={fmtKc(y.codCollected)} />
        <Kpi label="Zastávek na řidiče" value={fmtNum(y.avgStopsPerDriver)} sub="průměr" />
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Podle dopravce</h2>
          <table className="table">
            <thead><tr><th>Dopravce</th><th className="num">Zásilek</th><th className="num">Doručeno</th><th className="num">Nedoručeno</th><th>Úspěšnost</th></tr></thead>
            <tbody>
              {y.byCarrier.map((c) => {
                const car = carrierById(c.carrier);
                const r = c.delivered / c.total;
                return (
                  <tr key={c.carrier}>
                    <td><span className="dot" style={{ background: car.color }} /> {car.name}</td>
                    <td className="num">{fmtNum(c.total)}</td>
                    <td className="num">{fmtNum(c.delivered)}</td>
                    <td className="num">{fmtNum(c.failed)}</td>
                    <td><div className="bar"><span style={{ width: `${r * 100}%`, background: car.color }} /></div><small>{pct(c.delivered, c.total)}</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Doručení vlastní flotily během dne</h2>
          <div className="hours">
            {y.byHour.map((h) => (
              <div key={h.hour} className="hour" title={`${h.hour}:00 – ${h.delivered} doručení`}>
                <span className="hval">{h.delivered}</span>
                <div className="hbar" style={{ height: `${(h.delivered / maxHour) * 100}%` }} />
                <span className="hlab">{h.hour}</span>
              </div>
            ))}
          </div>
          <h3>Důvody nedoručení</h3>
          {y.failReasons.map((f) => (
            <div key={f.reason} className="hrow">
              <span>{f.reason}</span>
              <div className="bar"><span style={{ width: `${(f.count / maxFail) * 100}%` }} className="bad-bg" /></div>
              <b>{f.count}</b>
            </div>
          ))}
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Řidiči včera</h2>
          <div className="split">
            <div>
              <h3>Nejlepší úspěšnost</h3>
              <DriverList rows={ranked.slice(0, 5)} name={driverName} />
            </div>
            <div>
              <h3>Potřebují pozornost</h3>
              <DriverList rows={ranked.slice(-5).reverse()} name={driverName} warn />
            </div>
          </div>
        </section>
        <section className="card">
          <h2>Klienti včera</h2>
          <table className="table compact">
            <thead><tr><th>Klient</th><th className="num">Zásilek</th><th className="num">Doručeno</th></tr></thead>
            <tbody>
              {[...y.byClient].sort((a, b) => b.total - a.total).map((c) => (
                <tr key={c.clientId}><td>{CLIENTS.find((k) => k.id === c.clientId)?.name}</td><td className="num">{fmtNum(c.total)}</td><td className="num">{pct(c.delivered, c.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <h2 className="section-title">Dnes</h2>
      <div className="kpis">
        <Kpi label="Dnešních zásilek" value={fmtNum(today.total)} />
        <Kpi label="Zatím doručeno" value={fmtNum(today.delivered)} tone="good" />
        <Kpi label="Nedoručeno" value={fmtNum(today.failed)} tone="bad" />
        <Kpi label="Nepřiřazeno (vlastní rozvoz)" value={fmtNum(today.unassigned)} tone={today.unassigned ? 'warn' : undefined} />
        <Kpi label="Vozů na trase" value={`${today.onRoad} / ${d.vehicles.length}`} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Úkoly</h2>
          <label className="check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> zobrazit hotové</label>
        </div>
        <form className="task-form" onSubmit={submit}>
          <input placeholder="Nový úkol, např. Zkontrolovat vratky Pet Market" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Komu">
            <optgroup label="Dispečeři">{DISPATCHERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
            <optgroup label="Řidiči">{d.drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
          </select>
          <input type="time" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Termín" />
          <select value={prio} onChange={(e) => setPrio(e.target.value as 'normalni' | 'vysoka')} aria-label="Priorita">
            <option value="normalni">Normální</option><option value="vysoka">Vysoká</option>
          </select>
          <button className="primary" type="submit">Přidělit</button>
        </form>
        <ul className="tasks">
          {tasks.map((t) => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} aria-label="Hotovo" />
              <div className="t-main">
                <span className="t-title">{t.title}</span>
                <span className="muted small">{assigneeName(t.assignee)} · do {fmtTime(t.due)}</span>
              </div>
              {t.priority === 'vysoka' && <span className="badge st-nedoruceno">Vysoká</span>}
            </li>
          ))}
        </ul>
      </section>
      <p className="note">Dopravci: {CARRIERS.map((c) => c.name).join(', ')}. Data dopravců jsou v prototypu simulovaná; v MVP přijdou přes Balíkobot.</p>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'warn' }) {
  return (
    <div className={`kpi ${tone ?? ''}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

function DriverList({ rows, name, warn }: { rows: { driverId: string; stops: number; delivered: number; failed: number; km: number; rate: number }[]; name: (id: string) => string; warn?: boolean }) {
  return (
    <ul className="dlist">
      {rows.map((r) => (
        <li key={r.driverId}>
          <span>{name(r.driverId)}</span>
          <span className="muted small">{r.stops} zast. · {r.km} km</span>
          <b className={warn ? 'bad-t' : 'good-t'}>{pct(r.delivered, r.stops)}</b>
        </li>
      ))}
    </ul>
  );
}
