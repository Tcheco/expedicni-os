'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CARRIERS, CLIENTS, carrierById } from '@/lib/data';
import { CarrierBadge, StatusBadge } from '@/components/StatusBadge';
import MapView from '@/components/Map';
import { fmtDateTime, fmtNum, fmtTime } from '@/lib/format';

type F = 'vse' | 'cesta' | 'doruceno' | 'problem';

export default function KlientPage() {
  const { data } = useStore();
  const d = data!;
  const [clientId, setClientId] = useState('k1');
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('vse');
  const [openId, setOpenId] = useState<string | null>(null);

  const client = CLIENTS.find((c) => c.id === clientId)!;
  const mine = useMemo(() => d.shipments.filter((s) => s.clientId === clientId), [d.shipments, clientId]);
  const groups = {
    cesta: mine.filter((s) => !['doruceno', 'nedoruceno'].includes(s.status)),
    doruceno: mine.filter((s) => s.status === 'doruceno'),
    problem: mine.filter((s) => s.status === 'nedoruceno'),
  };
  const list = (f === 'vse' ? mine : groups[f]).filter((s) => {
    const ql = q.trim().toLowerCase();
    return !ql || `${s.tracking} ${s.recipient} ${s.city}`.toLowerCase().includes(ql);
  });
  const sel = openId ? d.shipments.find((s) => s.id === openId) : undefined;
  const selVeh = sel?.driverId && sel.status === 'na_ceste' ? d.vehicles.find((v) => v.driverId === sel.driverId) : undefined;
  const stopsBefore = sel?.driverId && selVeh
    ? d.shipments.filter((s) => s.driverId === sel.driverId && s.status === 'na_ceste' && (s.routeOrder ?? 0) < (sel.routeOrder ?? 0)).length
    : 0;
  const eta = selVeh ? new Date(Date.now() + (stopsBefore + 1) * 9 * 60000) : undefined;

  const byCarrier = CARRIERS.map((c) => ({ c, n: mine.filter((s) => s.carrier === c.id).length })).filter((x) => x.n);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Moje zásilky</h1>
          <p className="muted">Klientský portál · přihlášen jako <b>{client.name}</b></p>
        </div>
        <label className="muted small">Simulovat klienta:{' '}
          <select value={clientId} onChange={(e) => { setClientId(e.target.value); setOpenId(null); }}>
            {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="kpis">
        <button className={`kpi click ${f === 'vse' ? 'on' : ''}`} onClick={() => setF('vse')}><span className="kpi-label">Dnes odesláno</span><span className="kpi-value">{fmtNum(mine.length)}</span></button>
        <button className={`kpi click ${f === 'cesta' ? 'on' : ''}`} onClick={() => setF('cesta')}><span className="kpi-label">Na cestě</span><span className="kpi-value">{fmtNum(groups.cesta.length)}</span></button>
        <button className={`kpi click good ${f === 'doruceno' ? 'on' : ''}`} onClick={() => setF('doruceno')}><span className="kpi-label">Doručeno</span><span className="kpi-value">{fmtNum(groups.doruceno.length)}</span></button>
        <button className={`kpi click bad ${f === 'problem' ? 'on' : ''}`} onClick={() => setF('problem')}><span className="kpi-label">Vyžaduje pozornost</span><span className="kpi-value">{fmtNum(groups.problem.length)}</span></button>
      </div>
      <p className="muted small">Podle dopravce: {byCarrier.map((x) => `${x.c.name} ${x.n}`).join(' · ')}</p>

      <div className="client-grid">
        <section className="card">
          <div className="filters"><input placeholder="Hledat číslo zásilky, příjemce nebo město…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="table-wrap tall">
            <table className="table">
              <thead><tr><th>Zásilka</th><th>Příjemce</th><th>Dopravce</th><th>Stav</th><th>Poslední událost</th></tr></thead>
              <tbody>
                {list.map((s) => {
                  const last = s.events[s.events.length - 1];
                  return (
                    <tr key={s.id} className={openId === s.id ? 'sel' : ''} onClick={() => setOpenId(s.id)}>
                      <td className="mono">{s.tracking}</td>
                      <td>{s.recipient}<br /><small className="muted">{s.city}</small></td>
                      <td><CarrierBadge carrier={s.carrier} /></td>
                      <td><StatusBadge status={s.status} /></td>
                      <td><small>{fmtTime(last.at)} {last.text}</small></td>
                    </tr>
                  );
                })}
                {!list.length && <tr><td colSpan={5} className="empty">Žádné zásilky.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card detail">
          {!sel ? (
            <div className="empty big">Vyberte zásilku vlevo a uvidíte její cestu.</div>
          ) : (
            <>
              <div className="card-head">
                <div>
                  <h2 className="mono">{sel.tracking}</h2>
                  <p className="muted small">{sel.recipient}, {sel.street}, {sel.city} · {sel.weightKg.toLocaleString('cs-CZ')} kg</p>
                </div>
                <StatusBadge status={sel.status} />
              </div>
              <p className="small">Přepravuje: <b style={{ color: carrierById(sel.carrier).color }}>{carrierById(sel.carrier).name}</b>
                {sel.carrier !== 'vlastni' && <span className="muted"> · stav převzat z trackingu dopravce</span>}</p>
              {eta && (
                <div className="eta">Řidič je na cestě. Před vámi {stopsBefore} {stopsBefore === 1 ? 'zastávka' : stopsBefore >= 2 && stopsBefore <= 4 ? 'zastávky' : 'zastávek'}, odhad doručení kolem <b>{fmtTime(eta.toISOString())}</b>.</div>
              )}
              {selVeh && (
                <MapView height={220} fitKey={sel.id} points={[
                  { id: 'cil', lat: sel.lat, lng: sel.lng, color: '#0f766e', label: 'Cíl', kind: 'stop' },
                  { id: 'veh', lat: selVeh.lat, lng: selVeh.lng, color: '#0f172a', label: 'Vůz', kind: 'vehicle' },
                ]} />
              )}
              <h3>Časová osa</h3>
              <ol className="timeline">
                {[...sel.events].reverse().map((e, i) => (
                  <li key={i} className={`tl st-${e.status} ${i === 0 ? 'first' : ''}`}>
                    <span className="tl-time">{fmtDateTime(e.at)}</span>
                    <span className="tl-text">{e.text}</span>
                    <span className="tl-src">{e.source}{e.place ? ` · ${e.place}` : ''}</span>
                  </li>
                ))}
              </ol>
              <p className="note">Jednotná časová osa: události všech dopravců převádíme do stejných stavů, takže klient vidí vždy stejný formát bez ohledu na dopravce.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
