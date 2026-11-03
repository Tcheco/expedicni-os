'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CLIENTS, FAIL_REASONS, Shipment } from '@/lib/data';
import { StatusBadge } from '@/components/StatusBadge';
import MapView from '@/components/Map';
import { fmtKc, fmtTime } from '@/lib/format';

const isDone = (s: Shipment) => s.status === 'doruceno' || s.status === 'nedoruceno';

export default function RidicPage() {
  const { data, deliver, fail, startRoute } = useStore();
  const d = data!;
  const [driverId, setDriverId] = useState('r1');
  const [tab, setTab] = useState<'trasa' | 'mapa' | 'hotovo'>('trasa');
  const [sheet, setSheet] = useState<null | { id: string; mode: 'ok' | 'fail' }>(null);
  const [who, setWho] = useState('');
  const [photo, setPhoto] = useState(false);
  const [reason, setReason] = useState(FAIL_REASONS[0]);

  const driver = d.drivers.find((r) => r.id === driverId)!;
  const veh = d.vehicles.find((v) => v.driverId === driverId)!;
  const tasks = d.tasks.filter((t) => t.assignee === driverId && !t.done);
  const stops = useMemo(() => d.shipments.filter((s) => s.driverId === driverId).sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0)), [d.shipments, driverId]);
  const open = stops.filter((s) => !isDone(s));
  const done = stops.filter(isDone);
  const waiting = open.filter((s) => s.status === 'prirazeno').length;
  const current = open.find((s) => s.status === 'na_ceste');
  const cod = done.filter((s) => s.status === 'doruceno' && s.cod).reduce((a, s) => a + (s.cod ?? 0), 0);

  const openSheet = (id: string, mode: 'ok' | 'fail') => {
    const s = d.shipments.find((x) => x.id === id)!;
    setWho(s.recipient); setPhoto(false); setReason(FAIL_REASONS[0]); setSheet({ id, mode });
  };
  const confirm = () => {
    if (!sheet) return;
    if (sheet.mode === 'ok') deliver(sheet.id, who.trim() || 'Neuvedeno'); else fail(sheet.id, reason);
    setSheet(null);
  };
  const sheetShipment = sheet ? d.shipments.find((x) => x.id === sheet.id) : undefined;

  return (
    <div className="page driver-page">
      <div className="driver-picker">
        <label>Simulovat řidiče:{' '}
          <select value={driverId} onChange={(e) => { setDriverId(e.target.value); setTab('trasa'); }}>
            {d.drivers.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.depot}</option>)}
          </select>
        </label>
        <p className="muted small">Takto uvidí řidič aplikaci v telefonu (PWA, funguje i bez instalace z obchodu).</p>
      </div>

      <div className="phone">
        <div className="phone-inner">
          <div className="m-head">
            <div>
              <b>{driver.name}</b>
              <span className="small">{veh.plate} · {veh.type}</span>
            </div>
            <div className="m-progress">
              <span>{done.length}/{stops.length}</span>
              <div className="bar light"><span style={{ width: `${stops.length ? (done.length / stops.length) * 100 : 0}%` }} /></div>
            </div>
          </div>

          <div className="m-tabs">
            <button className={tab === 'trasa' ? 'active' : ''} onClick={() => setTab('trasa')}>Trasa ({open.length})</button>
            <button className={tab === 'mapa' ? 'active' : ''} onClick={() => setTab('mapa')}>Mapa</button>
            <button className={tab === 'hotovo' ? 'active' : ''} onClick={() => setTab('hotovo')}>Hotovo ({done.length})</button>
          </div>

          <div className="m-body">
            {tab === 'trasa' && (
              <>
                {tasks.map((t) => <div key={t.id} className="m-task">Úkol od dispečinku: <b>{t.title}</b> (do {fmtTime(t.due)})</div>)}
                {waiting > 0 && (
                  <div className="m-start">
                    <p>Máte {waiting} zásilek připravených k naložení.</p>
                    <button className="primary block" onClick={() => startRoute(driverId)}>Naloženo, vyrážím</button>
                  </div>
                )}
                {current && (
                  <div className="m-current">
                    <span className="small muted">Další zastávka · {current.routeOrder}. z {stops.length}</span>
                    <h2>{current.recipient}</h2>
                    <p>{current.street}, {current.city}</p>
                    <p className="small muted">{CLIENTS.find((c) => c.id === current.clientId)?.name} · {current.tracking} · {current.weightKg.toLocaleString('cs-CZ')} kg</p>
                    {current.cod && <p className="m-cod">Dobírka: {fmtKc(current.cod)}</p>}
                    <div className="m-row">
                      <a className="ghost" href={`https://www.openstreetmap.org/directions?to=${current.lat}%2C${current.lng}`} target="_blank" rel="noreferrer">Navigovat</a>
                      <a className="ghost" href="tel:+420000000000">Volat</a>
                    </div>
                    <div className="m-row">
                      <button className="btn-ok big" onClick={() => openSheet(current.id, 'ok')}>Doručeno</button>
                      <button className="btn-bad big" onClick={() => openSheet(current.id, 'fail')}>Nedoručeno</button>
                    </div>
                  </div>
                )}
                {!open.length && <div className="m-empty">Hotovo! Všechny zastávky jsou vyřízené. Vybráno na dobírkách: <b>{fmtKc(cod)}</b>.</div>}
                <ol className="m-list">
                  {open.filter((s) => s !== current).map((s) => (
                    <li key={s.id}>
                      <span className="m-num">{s.routeOrder}</span>
                      <div><b>{s.recipient}</b><br /><span className="small muted">{s.street}{s.cod ? ` · dobírka ${fmtKc(s.cod)}` : ''}</span></div>
                      {s.status === 'prirazeno' && <span className="small muted">k naložení</span>}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {tab === 'mapa' && (
              <MapView
                height={460}
                fitKey={driverId}
                points={[
                  ...stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, color: '#0f766e', label: String(s.routeOrder), kind: isDone(s) ? ('done' as const) : ('stop' as const), popup: `${s.routeOrder}. ${s.recipient}<br>${s.street}` })),
                  { id: 'me', lat: veh.lat, lng: veh.lng, color: '#0f172a', label: 'Já', kind: 'vehicle' as const },
                ]}
                lines={[{ color: '#0f766e', coords: [[veh.lat, veh.lng], ...open.map((s) => [s.lat, s.lng] as [number, number])] }]}
              />
            )}
            {tab === 'hotovo' && (
              <>
                <div className="m-sum">Doručeno {done.filter((s) => s.status === 'doruceno').length} · nedoručeno {done.filter((s) => s.status === 'nedoruceno').length} · dobírky {fmtKc(cod)}</div>
                <ul className="m-list">
                  {[...done].reverse().map((s) => (
                    <li key={s.id}>
                      <span className="m-num">{s.routeOrder}</span>
                      <div><b>{s.recipient}</b><br /><span className="small muted">{s.street} · {fmtTime(s.events[s.events.length - 1].at)}{s.failReason ? ` · ${s.failReason}` : ''}</span></div>
                      <StatusBadge status={s.status} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {sheet && sheetShipment && (
            <div className="m-sheet-bg" onClick={() => setSheet(null)}>
              <div className="m-sheet" onClick={(e) => e.stopPropagation()}>
                <h3>{sheet.mode === 'ok' ? 'Potvrdit doručení' : 'Zásilku se nepodařilo doručit'}</h3>
                <p className="small muted">{sheetShipment.tracking} · {sheetShipment.recipient}</p>
                {sheet.mode === 'ok' ? (
                  <>
                    <label>Kdo převzal<input value={who} onChange={(e) => setWho(e.target.value)} /></label>
                    {sheetShipment.cod && <p className="m-cod">Vybrat dobírku {fmtKc(sheetShipment.cod)}</p>}
                    <button className={`ghost block ${photo ? 'photo-ok' : ''}`} onClick={() => setPhoto(true)}>{photo ? '✓ Fotka doručení pořízena' : 'Vyfotit zásilku u dveří'}</button>
                    <div className="sign">Podpis prstem (ukázka)</div>
                  </>
                ) : (
                  <div className="reasons">
                    {FAIL_REASONS.map((r) => (
                      <label key={r} className="radio"><input type="radio" name="r" checked={reason === r} onChange={() => setReason(r)} /> {r}</label>
                    ))}
                  </div>
                )}
                <div className="m-row">
                  <button className="ghost" onClick={() => setSheet(null)}>Zpět</button>
                  <button className={sheet.mode === 'ok' ? 'btn-ok' : 'btn-bad'} onClick={confirm}>Potvrdit</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
