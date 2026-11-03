'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dataset, Shipment, ShipmentEvent, Task, generate, orderRoute, dist } from './data';

const KEY = 'expedicni-os-prototyp-v1';

interface Store {
  data: Dataset | null;
  assign: (ids: string[], driverId: string) => void;
  autoPlan: (ids: string[]) => number;
  startRoute: (driverId: string) => void;
  deliver: (id: string, receivedBy: string) => void;
  fail: (id: string, reason: string) => void;
  addTask: (t: Omit<Task, 'id' | 'done' | 'createdBy'>) => void;
  toggleTask: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function pushEvent(s: Shipment, ev: Omit<ShipmentEvent, 'at'>) {
  s.events = [...s.events, { ...ev, at: nowIso() }];
  s.status = ev.status;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Dataset | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let d: Dataset | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Dataset & { day?: string };
        if (parsed.day === new Date().toDateString()) d = parsed;
      }
    } catch {}
    setData(d ?? generate());
  }, []);

  // ukládání (s odstupem) do prohlížeče
  useEffect(() => {
    if (!data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...data, day: new Date().toDateString() }));
      } catch {}
    }, 800);
  }, [data]);

  // simulace živé polohy: vozy s rozjetou trasou se posouvají k další zastávce
  useEffect(() => {
    const t = setInterval(() => {
      setData((d) => {
        if (!d) return d;
        const next: { [driverId: string]: Shipment | undefined } = {};
        for (const s of d.shipments) {
          if (s.driverId && s.status === 'na_ceste') {
            const cur = next[s.driverId];
            if (!cur || (s.routeOrder ?? 0) < (cur.routeOrder ?? 0)) next[s.driverId] = s;
          }
        }
        const vehicles = d.vehicles.map((v) => {
          const target = next[v.driverId];
          if (!target) return v;
          const km = dist(v.lat, v.lng, target.lat, target.lng);
          if (km < 0.05) return v;
          const step = Math.min(1, 0.25 / km); // cca 250 m za tik
          const lat = v.lat + (target.lat - v.lat) * step;
          const lng = v.lng + (target.lng - v.lng) * step;
          const heading = (Math.atan2(target.lng - v.lng, target.lat - v.lat) * 180) / Math.PI;
          return { ...v, lat, lng, heading };
        });
        return { ...d, vehicles };
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const mutate = useCallback((fn: (d: Dataset) => Dataset) => setData((d) => (d ? fn(d) : d)), []);

  const assign = useCallback(
    (ids: string[], driverId: string) =>
      mutate((d) => {
        const set = new Set(ids);
        const shipments = d.shipments.map((s) => {
          if (!set.has(s.id)) return s;
          const c = { ...s, driverId, carrier: 'vlastni' as const };
          const name = d.drivers.find((r) => r.id === driverId)?.name;
          pushEvent(c, { status: 'prirazeno', text: `Přiřazeno řidiči ${name}`, source: 'Dispečink' });
          return c;
        });
        const v = d.vehicles.find((x) => x.driverId === driverId)!;
        orderRoute(shipments, driverId, v);
        return { ...d, shipments };
      }),
    [mutate]
  );

  const autoPlan = useCallback(
    (ids: string[]) => {
      let count = 0;
      mutate((d) => {
        const set = new Set(ids);
        const load: Record<string, number> = {};
        d.shipments.forEach((s) => {
          if (s.driverId && s.status !== 'doruceno' && s.status !== 'nedoruceno') load[s.driverId] = (load[s.driverId] ?? 0) + 1;
        });
        const touched = new Set<string>();
        const shipments = d.shipments.map((s) => {
          if (!set.has(s.id)) return s;
          // nejbližší vůz s ohledem na vytížení (zjednodušená náhrada za VROOM)
          let best = d.vehicles[0];
          let bestScore = Infinity;
          for (const v of d.vehicles) {
            const score = dist(v.lat, v.lng, s.lat, s.lng) + (load[v.driverId] ?? 0) * 0.6;
            if (score < bestScore) { bestScore = score; best = v; }
          }
          load[best.driverId] = (load[best.driverId] ?? 0) + 1;
          touched.add(best.driverId);
          count++;
          const c = { ...s, driverId: best.driverId, carrier: 'vlastni' as const };
          const name = d.drivers.find((r) => r.id === best.driverId)?.name;
          pushEvent(c, { status: 'prirazeno', text: `Automaticky naplánováno: řidič ${name}`, source: 'Plánovač tras' });
          return c;
        });
        touched.forEach((id) => orderRoute(shipments, id, d.vehicles.find((v) => v.driverId === id)!));
        return { ...d, shipments };
      });
      return ids.length || count;
    },
    [mutate]
  );

  const startRoute = useCallback(
    (driverId: string) =>
      mutate((d) => ({
        ...d,
        shipments: d.shipments.map((s) => {
          if (s.driverId !== driverId || s.status !== 'prirazeno') return s;
          const c = { ...s };
          pushEvent(c, { status: 'na_ceste', text: 'Zásilka naložena, řidič vyrazil', source: 'Aplikace řidiče' });
          return c;
        }),
      })),
    [mutate]
  );

  const deliver = useCallback(
    (id: string, receivedBy: string) =>
      mutate((d) => ({
        ...d,
        shipments: d.shipments.map((s) => {
          if (s.id !== id) return s;
          const c = { ...s, receivedBy };
          pushEvent(c, { status: 'doruceno', text: `Doručeno, převzal(a): ${receivedBy}`, source: 'Aplikace řidiče' });
          return c;
        }),
      })),
    [mutate]
  );

  const fail = useCallback(
    (id: string, reason: string) =>
      mutate((d) => ({
        ...d,
        shipments: d.shipments.map((s) => {
          if (s.id !== id) return s;
          const c = { ...s, failReason: reason };
          pushEvent(c, { status: 'nedoruceno', text: `Nedoručeno: ${reason}`, source: 'Aplikace řidiče' });
          return c;
        }),
      })),
    [mutate]
  );

  const addTask = useCallback(
    (t: Omit<Task, 'id' | 'done' | 'createdBy'>) =>
      mutate((d) => ({ ...d, tasks: [{ ...t, id: `t${Date.now()}`, done: false, createdBy: 'Admin' }, ...d.tasks] })),
    [mutate]
  );

  const toggleTask = useCallback(
    (id: string) => mutate((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
    [mutate]
  );

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    setData(generate(Math.floor(Math.random() * 1e6)));
  }, []);

  return <Ctx.Provider value={{ data, assign, autoPlan, startRoute, deliver, fail, addTask, toggleTask, reset }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider chybí');
  return s;
}
