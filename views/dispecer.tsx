'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CARRIERS, CLIENTS, CarrierId, STATUS_LABEL, Status, carrierById } from '@/lib/data';
import MapView, { MapPoint } from '@/components/Map';
import { CarrierBadge, StatusBadge } from '@/components/StatusBadge';
import { fmtNum, fmtTime } from '@/lib/format';

const PAGE = 50;

export default function DispecerPage() {
  const { data, assign, autoPlan } = useStore();
  const d = data!;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | Status | 'nepriazene'>('nepriazene');
  const [carrier, setCarrier] = useState<'' | CarrierId>('');
  const [city, setCity] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState('');
  const [focusDriver, setFocusDriver] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const driverName = (id?: string) => (id ? d.drivers.find((r) => r.id === id)?.name ?? '' : '');
  const clientName = (id: string) => CLIENTS.find((c) => c.id === id)?.name ?? '';
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 3500); };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return d.shipments.filter((s) => {
      if (status === 'nepriazene') { if (!(s.carrier === 'vlastni' && !s.driverId)) return false; }
      else if (status && s.status !== status) return false;
      if (carrier && s.carrier !== carrier) return false;
      if (city && s.city !== city) return false;
      if (ql && !(`${s.tracking} ${s.recipient} ${s.street} ${clientName(s.clientId)} ${driverName(s.driverId)}`.toLowerCase().includes(ql))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.shipments, q, status, carrier, city]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { nepriazene: 0 };
    d.shipments.forEach((s) => { c[s.status] = (c[s.status] ?? 0) + 1; if (s.carrier === 'vlastni' && !s.driverId) c.nepriazene++; });
    return c;
  }, [d.shipments]);

  const driverLoad = useMemo(() => {
    const m: Record<string, { open: number; done: number }> = {};
    d.drivers.forEach((r) => (m[r.id] = { open: 0, done: 0 }));
    d.shipments.forEach((s) => {
      if (!s.driverId) return;
      if (s.status === 'doruceno' || s.status === 'nedoruceno') m[s.driverId].done++; else m[s.driverId].open++;
    });
    return m;
  }, [d.shipments, d.drivers]);

  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const allOnPage = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const canAssign = (id: string) => {
    const s = d.shipments.find((x) => x.id === id)!;
    return s.status !== 'doruceno' && s.status !== 'predano_dopravci';
  };

  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setSel((p) => { const n = new Set(p); rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id))); return n; });
  const selectAllFiltered = () => setSel(new Set(filtered.map((s) => s.id)));

  const doAssign = () => {
    const ids = [...sel].filter(canAssign);
    if (!target || !ids.length) return;
    assign(ids, target);
    flash(`${ids.length} zásilek přiřazeno řidiči ${driverName(target)}.`);
    setSel(new Set());
    setFocusDriver(target);
  };
  const doAuto = () => {
    const ids = [...sel].filter(canAssign);
    if (!ids.length) return;
    autoPlan(ids);
    flash(`Naplánováno ${ids.length} zásilek k nejbližším volným vozům a seřazeny trasy.`);
    setSel(new Set());
  };

  // mapa
  const focusStops = focusDriver ? d.shipments.filter((s) => s.driverId === focusDriver).sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0)) : [];
  const focusVeh = focusDriver ? d.vehicles.find((v) => v.driverId === focusDriver) : undefined;
  const points: MapPoint[] = [];
  if (focusDriver && focusVeh) {
    focusStops.forEach((s) => points.push({ id: s.id, lat: s.lat, lng: s.lng, color: '#0f766e', label: String(s.routeOrder), kind: s.status === 'doruceno' || s.status === 'nedoruceno' ? 'done' : 'stop', popup: `<b>${s.routeOrder}. ${s.recipient}</b><br>${s.street}, ${s.city}<br>${STATUS_LABEL[s.status]}` }));
  } else {
    filtered.slice(0, 800).forEach((s) => points.push({ id: s.id, lat: s.lat, lng: s.lng, color: carrierById(s.carrier).color, selected: sel.has(s.id), kind: s.status === 'doruceno' ? 'done' : 'stop', popup: `<b>${s.tracking}</b><br>${s.recipient}, ${s.street}<br>${STATUS_LABEL[s.status]}` }));
  }
  d.vehicles.forEach((v) => {
    if (focusDriver && v.driverId !== focusDriver) return;
    const load = driverLoad[v.driverId];
    points.push({ id: 'veh:' + v.driverId, lat: v.lat, lng: v.lng, color: load.open ? '#0f172a' : '#64748b', label: v.id.replace('v', ''), kind: 'vehicle', popup: `<b>${driverName(v.driverId)}</b><br>${v.plate} · ${v.type}<br>Otevřené: ${load.open}, hotové: ${load.done}` });
  });
  const lines = focusVeh ? [{ color: '#0f766e', coords: [[focusVeh.lat, focusVeh.lng] as [number, number], ...focusStops.filter((s) => s.status !== 'doruceno' && s.status !== 'nedoruceno').map((s) => [s.lat, s.lng] as [number, number])] }] : [];

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1>Dispečink</h1>
          <p className="muted">{fmtNum(d.shipments.length)} dnešních zásilek · {d.vehicles.length} vozů · klikněte na vůz v mapě pro jeho trasu</p>
        </div>
      </div>

      <div className="chips">
        <Chip active={status === 'nepriazene'} onClick={() => { setStatus('nepriazene'); setPage(0); }} label="Nepřiřazené" n={counts.nepriazene} warn />
        <Chip active={status === ''} onClick={() => { setStatus(''); setPage(0); }} label="Vše" n={d.shipments.length} />
        {(['na_sklade', 'prirazeno', 'na_ceste', 'predano_dopravci', 'doruceno', 'nedoruceno'] as Status[]).map((s) => (
          <Chip key={s} active={status === s} onClick={() => { setStatus(s); setPage(0); }} label={STATUS_LABEL[s]} n={counts[s] ?? 0} />
        ))}
      </div>

      <div className="disp">
        <section className="card disp-list">
          <div className="filters">
            <input placeholder="Hledat číslo, příjemce, adresu, klienta…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            <select value={carrier} onChange={(e) => { setCarrier(e.target.value as CarrierId | ''); setPage(0); }} aria-label="Dopravce">
              <option value="">Všichni dopravci</option>
              {CARRIERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={city} onChange={(e) => { setCity(e.target.value); setPage(0); }} aria-label="Oblast">
              <option value="">Všechny oblasti</option>
              {['Praha', 'Brno', 'Plzeň', 'Ostrava'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="actionbar">
            <span><b>{sel.size}</b> vybráno</span>
            <button className="ghost small" onClick={selectAllFiltered}>Vybrat všech {fmtNum(filtered.length)}</button>
            {sel.size > 0 && <button className="ghost small" onClick={() => setSel(new Set())}>Zrušit výběr</button>}
            <span className="grow" />
            <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Řidič">
              <option value="">Vyberte řidiče…</option>
              {d.drivers.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.depot.split(' – ')[0]}, {driverLoad[r.id].open} otevř.)</option>)}
            </select>
            <button className="primary small" disabled={!sel.size || !target} onClick={doAssign}>Přiřadit</button>
            <button className="accent small" disabled={!sel.size} onClick={doAuto} title="Rozdělí vybrané zásilky k nejbližším vozům s ohledem na vytížení">Naplánovat automaticky</button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Vybrat stránku" /></th>
                  <th>Zásilka</th><th>Příjemce</th><th>Dopravce</th><th>Stav</th><th>Řidič</th><th className="num">Kg</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className={sel.has(s.id) ? 'sel' : ''} onClick={() => toggle(s.id)}>
                    <td><input type="checkbox" checked={sel.has(s.id)} onChange={() => toggle(s.id)} onClick={(e) => e.stopPropagation()} aria-label="Vybrat" /></td>
                    <td><span className="mono">{s.tracking}</span><br /><small className="muted">{clientName(s.clientId)}</small></td>
                    <td>{s.recipient}<br /><small className="muted">{s.street}, {s.city}</small></td>
                    <td><CarrierBadge carrier={s.carrier} /></td>
                    <td><StatusBadge status={s.status} /><br /><small className="muted">{fmtTime(s.events[s.events.length - 1].at)}</small></td>
                    <td>{s.driverId ? <button className="link" onClick={(e) => { e.stopPropagation(); setFocusDriver(s.driverId!); }}>{driverName(s.driverId)}</button> : <span className="muted">–</span>}</td>
                    <td className="num">{s.weightKg.toLocaleString('cs-CZ')}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="empty">Nic neodpovídá filtru.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>← Předchozí</button>
            <span>Strana {page + 1} z {pages} ({fmtNum(filtered.length)} zásilek)</span>
            <button className="ghost small" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Další →</button>
          </div>
        </section>

        <section className="card disp-map">
          <div className="card-head">
            <h2>{focusDriver ? `Trasa: ${driverName(focusDriver)}` : 'Mapa zásilek a vozů'}</h2>
            {focusDriver && <button className="ghost small" onClick={() => setFocusDriver(null)}>Zpět na vše</button>}
          </div>
          <MapView points={points} lines={lines} height={520} fitKey={focusDriver ?? `all-${status}-${carrier}-${city}`} onPointClick={(id) => { if (id.startsWith('veh:')) setFocusDriver(id.slice(4)); else if (!focusDriver) toggle(id); }} />
          {focusDriver && focusVeh ? (
            <div className="route-info">
              <p className="muted small">{focusVeh.plate} · {focusVeh.type} · {driverLoad[focusDriver].done} hotovo / {driverLoad[focusDriver].open} zbývá</p>
              <ol className="stops">
                {focusStops.map((s) => (
                  <li key={s.id} className={s.status === 'doruceno' || s.status === 'nedoruceno' ? 'done' : ''}>
                    <span>{s.routeOrder}. {s.recipient}, {s.street}</span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="legend">
              {CARRIERS.map((c) => <span key={c.id}><i style={{ background: c.color }} />{c.short}</span>)}
              <span><i className="veh" />Vůz (poloha živě)</span>
              {filtered.length > 800 && <span className="muted">Mapa ukazuje prvních 800 zásilek z filtru.</span>}
            </div>
          )}
        </section>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Chip({ active, onClick, label, n, warn }: { active: boolean; onClick: () => void; label: string; n: number; warn?: boolean }) {
  return (
    <button className={`chip ${active ? 'active' : ''} ${warn && n ? 'warn' : ''}`} onClick={onClick}>
      {label} <b>{fmtNum(n)}</b>
    </button>
  );
}
