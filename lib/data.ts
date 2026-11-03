// Testovací data prototypu. Vše je generované deterministicky (stejný seed = stejná data).

export type CarrierId = 'vlastni' | 'cp' | 'balikovna' | 'dpd' | 'ppl' | 'zasilkovna';
export type Status =
  | 'prijato'
  | 'na_sklade'
  | 'prirazeno'
  | 'na_ceste'
  | 'predano_dopravci'
  | 'doruceno'
  | 'nedoruceno';

export interface Carrier { id: CarrierId; name: string; color: string; short: string }
export interface Driver { id: string; name: string; phone: string; vehicleId: string; depot: string }
export interface Vehicle { id: string; plate: string; type: string; driverId: string; lat: number; lng: number; heading: number }
export interface Client { id: string; name: string; contact: string }
export interface Dispatcher { id: string; name: string }
export interface ShipmentEvent { at: string; status: Status; text: string; source: string; place?: string }
export interface Shipment {
  id: string;
  tracking: string;
  clientId: string;
  recipient: string;
  street: string;
  city: string;
  lat: number;
  lng: number;
  carrier: CarrierId;
  status: Status;
  driverId?: string;
  routeOrder?: number;
  weightKg: number;
  cod?: number;
  createdAt: string;
  events: ShipmentEvent[];
  failReason?: string;
  receivedBy?: string;
}
export interface Task {
  id: string;
  title: string;
  assignee: string; // id dispečera nebo řidiče
  due: string;
  done: boolean;
  priority: 'normalni' | 'vysoka';
  createdBy: string;
}

export const CARRIERS: Carrier[] = [
  { id: 'vlastni', name: 'Vlastní flotila', short: 'Vlastní', color: '#0f766e' },
  { id: 'cp', name: 'Česká pošta', short: 'ČP', color: '#c2410c' },
  { id: 'balikovna', name: 'Balíkovna', short: 'Balíkovna', color: '#b45309' },
  { id: 'dpd', name: 'DPD', short: 'DPD', color: '#b91c1c' },
  { id: 'ppl', name: 'PPL', short: 'PPL', color: '#1d4ed8' },
  { id: 'zasilkovna', name: 'Zásilkovna', short: 'Zásilkovna', color: '#be123c' },
];
export const carrierById = (id: CarrierId) => CARRIERS.find((c) => c.id === id)!;

export const STATUS_LABEL: Record<Status, string> = {
  prijato: 'Přijato',
  na_sklade: 'Na skladě',
  prirazeno: 'Přiřazeno řidiči',
  na_ceste: 'Na cestě',
  predano_dopravci: 'Předáno dopravci',
  doruceno: 'Doručeno',
  nedoruceno: 'Nedoručeno',
};

export const FAIL_REASONS = [
  'Adresát nezastižen',
  'Odmítnuto adresátem',
  'Chybná adresa',
  'Nedostupné místo doručení',
  'Poškozená zásilka',
];

// ---------- pseudonáhoda ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Jan', 'Petr', 'Pavel', 'Martin', 'Tomáš', 'Jiří', 'Lukáš', 'Jakub', 'Michal', 'David', 'Ondřej', 'Filip', 'Marek', 'Karel', 'Roman', 'Eva', 'Jana', 'Lucie', 'Petra', 'Kateřina', 'Tereza', 'Markéta', 'Veronika', 'Lenka', 'Zuzana'];
const LAST_M = ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Marek', 'Pokorný', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček', 'Doležal', 'Zeman', 'Kolář'];
const LAST_F = ['Nováková', 'Svobodová', 'Novotná', 'Dvořáková', 'Černá', 'Procházková', 'Kučerová', 'Veselá', 'Horáková', 'Němcová', 'Marková', 'Pokorná', 'Králová', 'Růžičková', 'Benešová', 'Fialová', 'Sedláčková', 'Doležalová', 'Zemanová', 'Kolářová'];
const STREETS = ['Vinohradská', 'Na Pankráci', 'Bělehradská', 'Korunní', 'Plzeňská', 'Evropská', 'Sokolovská', 'Českomoravská', 'Jugoslávských partyzánů', 'Milady Horákové', 'Nádražní', 'Husova', 'Masarykova', 'Palackého', 'Komenského', 'Riegrova', 'Lidická', 'Údolní', 'Kotlářská', 'Žabovřeská'];

// Rozvozové oblasti vlastní flotily (střed a rozptyl)
const AREAS = [
  { city: 'Praha', lat: 50.0755, lng: 14.4378, spread: 0.09, weight: 0.55 },
  { city: 'Brno', lat: 49.1951, lng: 16.6068, spread: 0.06, weight: 0.25 },
  { city: 'Plzeň', lat: 49.7384, lng: 13.3736, spread: 0.04, weight: 0.1 },
  { city: 'Ostrava', lat: 49.8209, lng: 18.2625, spread: 0.05, weight: 0.1 },
];
const DEPOTS = ['Praha – Chrášťany', 'Brno – Modřice', 'Plzeň – Borská pole', 'Ostrava – Hrabová'];

export const CLIENTS: Client[] = [
  { id: 'k1', name: 'Zahrada Online s.r.o.', contact: 'eshop@zahrada-online.example' },
  { id: 'k2', name: 'Bylinkárna Hana', contact: 'hana@bylinkarna.example' },
  { id: 'k3', name: 'TechParts CZ', contact: 'expedice@techparts.example' },
  { id: 'k4', name: 'Kávovar.cz', contact: 'sklad@kavovar.example' },
  { id: 'k5', name: 'Dětský svět', contact: 'info@detskysvet.example' },
  { id: 'k6', name: 'Sportovna Brno', contact: 'obchod@sportovna.example' },
  { id: 'k7', name: 'Knihy pod lampou', contact: 'objednavky@knihy.example' },
  { id: 'k8', name: 'Pet Market', contact: 'zakaznici@petmarket.example' },
  { id: 'k9', name: 'Kosmetika Lila', contact: 'lila@kosmetika.example' },
  { id: 'k10', name: 'Nábytek Dub', contact: 'rozvoz@nabytekdub.example' },
];

export const DISPATCHERS: Dispatcher[] = [
  { id: 'd1', name: 'Alena Kopecká' },
  { id: 'd2', name: 'Radek Mach' },
  { id: 'd3', name: 'Simona Urbanová' },
];

export interface Dataset {
  drivers: Driver[];
  vehicles: Vehicle[];
  shipments: Shipment[];
  tasks: Task[];
  yesterday: YesterdayStats;
}

export interface YesterdayStats {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  handedToCarriers: number;
  codCollected: number;
  avgStopsPerDriver: number;
  byCarrier: { carrier: CarrierId; total: number; delivered: number; failed: number }[];
  byHour: { hour: number; delivered: number }[];
  drivers: { driverId: string; stops: number; delivered: number; failed: number; km: number }[];
  failReasons: { reason: string; count: number }[];
  byClient: { clientId: string; total: number; delivered: number }[];
}

function iso(d: Date) {
  return d.toISOString();
}

export function generate(seed = 42): Dataset {
  const rnd = mulberry32(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const person = () => (rnd() < 0.5 ? `${pick(FIRST.slice(0, 15))} ${pick(LAST_M)}` : `${pick(FIRST.slice(15))} ${pick(LAST_F)}`);
  const pickArea = () => {
    const r = rnd();
    let acc = 0;
    for (const a of AREAS) { acc += a.weight; if (r <= acc) return a; }
    return AREAS[0];
  };

  // 50 aut a 50 řidičů
  const drivers: Driver[] = [];
  const vehicles: Vehicle[] = [];
  const driverArea: Record<string, (typeof AREAS)[number]> = {};
  for (let i = 1; i <= 50; i++) {
    const area = i <= 26 ? AREAS[0] : i <= 39 ? AREAS[1] : i <= 45 ? AREAS[2] : AREAS[3];
    const dId = `r${i}`;
    const vId = `v${i}`;
    driverArea[dId] = area;
    const name = i % 4 === 0 ? `${pick(FIRST.slice(15))} ${pick(LAST_F)}` : `${pick(FIRST.slice(0, 15))} ${pick(LAST_M)}`;
    drivers.push({ id: dId, name, phone: `+420 7${String(10 + i).padStart(2, '0')} ${Math.floor(100 + rnd() * 899)} ${Math.floor(100 + rnd() * 899)}`, vehicleId: vId, depot: DEPOTS[AREAS.indexOf(area)] });
    const letters = 'ABCEHJKLMPSTUZ';
    vehicles.push({
      id: vId,
      plate: `${Math.floor(1 + rnd() * 9)}${letters[Math.floor(rnd() * letters.length)]}${Math.floor(rnd() * 9)} ${Math.floor(1000 + rnd() * 8999)}`,
      type: i % 7 === 0 ? 'Iveco Daily 3,5 t' : i % 3 === 0 ? 'Ford Transit Custom' : 'Renault Kangoo E-Tech',
      driverId: dId,
      lat: area.lat + (rnd() - 0.5) * area.spread * 1.4,
      lng: area.lng + (rnd() - 0.5) * area.spread * 2,
      heading: rnd() * 360,
    });
  }

  // Dnešní zásilky
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (h: number, m: number) => iso(new Date(today.getTime() + (h * 60 + m) * 60000));
  const shipments: Shipment[] = [];
  const N = 1400;
  for (let i = 0; i < N; i++) {
    const area = pickArea();
    const carrierRoll = rnd();
    const carrier: CarrierId =
      carrierRoll < 0.5 ? 'vlastni' : carrierRoll < 0.62 ? 'zasilkovna' : carrierRoll < 0.74 ? 'ppl' : carrierRoll < 0.85 ? 'dpd' : carrierRoll < 0.94 ? 'cp' : 'balikovna';
    const client = pick(CLIENTS);
    const prefix = { vlastni: 'EX', cp: 'DR', balikovna: 'BV', dpd: '0150', ppl: '4071', zasilkovna: 'Z' }[carrier];
    const tracking = `${prefix}${String(Math.floor(rnd() * 1e9)).padStart(9, '0')}${carrier === 'cp' || carrier === 'balikovna' ? 'CZ' : ''}`;
    const createdMin = Math.floor(rnd() * 120);
    const events: ShipmentEvent[] = [
      { at: at(5, createdMin % 60 + 0), status: 'prijato', text: 'Data zásilky přijata od odesílatele', source: client.name },
      { at: at(6, 10 + (createdMin % 40)), status: 'na_sklade', text: 'Zásilka naskladněna v depu', source: 'Expediční OS', place: DEPOTS[AREAS.indexOf(area)] },
    ];
    let status: Status = 'na_sklade';
    let driverId: string | undefined;
    let failReason: string | undefined;
    let receivedBy: string | undefined;
    const recipient = person();

    if (carrier === 'vlastni') {
      const r = rnd();
      // asi 25 % ještě nepřiřazeno, aby dispečer měl co dělat
      if (r > 0.25) {
        const candidates = drivers.filter((d) => driverArea[d.id] === area);
        driverId = pick(candidates).id;
        status = 'prirazeno';
        events.push({ at: at(6, 45), status: 'prirazeno', text: `Přiřazeno řidiči`, source: 'Expediční OS' });
        if (r > 0.4) {
          status = 'na_ceste';
          events.push({ at: at(7, 30 + Math.floor(rnd() * 25)), status: 'na_ceste', text: 'Zásilka naložena, řidič vyrazil', source: 'Aplikace řidiče' });
        }
        if (r > 0.62) {
          const h = 8 + Math.floor(rnd() * Math.max(1, Math.min(9, now.getHours() - 8)));
          if (rnd() < 0.93) {
            status = 'doruceno';
            receivedBy = rnd() < 0.8 ? recipient : 'Soused / recepce';
            events.push({ at: at(h, Math.floor(rnd() * 60)), status: 'doruceno', text: `Doručeno, převzal(a): ${receivedBy}`, source: 'Aplikace řidiče' });
          } else {
            status = 'nedoruceno';
            failReason = pick(FAIL_REASONS);
            events.push({ at: at(h, Math.floor(rnd() * 60)), status: 'nedoruceno', text: `Nedoručeno: ${failReason}`, source: 'Aplikace řidiče' });
          }
        }
      }
    } else {
      const name = carrierById(carrier).name;
      status = 'predano_dopravci';
      events.push({ at: at(9, Math.floor(rnd() * 50)), status: 'predano_dopravci', text: `Předáno dopravci ${name} (svoz)`, source: 'Expediční OS', place: DEPOTS[AREAS.indexOf(area)] });
      const r = rnd();
      if (r > 0.3) {
        status = 'na_ceste';
        events.push({ at: at(12, Math.floor(rnd() * 59)), status: 'na_ceste', text: carrier === 'zasilkovna' ? 'Zásilka na cestě na výdejní místo' : 'Zásilka v přepravě, třídicí centrum', source: `${name} (tracking)` });
      }
      if (r > 0.75 && now.getHours() >= 14) {
        status = 'doruceno';
        events.push({ at: at(14, Math.floor(rnd() * 59)), status: 'doruceno', text: carrier === 'zasilkovna' || carrier === 'balikovna' ? 'Uloženo na výdejním místě, vyzvednuto' : 'Doručeno adresátovi', source: `${name} (tracking)` });
      }
    }
    // události nikdy v budoucnosti
    const evs = events.filter((e) => new Date(e.at) <= now || e.status === 'prijato');
    shipments.push({
      id: `s${i + 1}`,
      tracking,
      clientId: client.id,
      recipient,
      street: `${pick(STREETS)} ${Math.floor(1 + rnd() * 180)}`,
      city: area.city,
      lat: area.lat + (rnd() - 0.5) * area.spread * 1.4,
      lng: area.lng + (rnd() - 0.5) * area.spread * 2,
      carrier,
      status: evs[evs.length - 1].status,
      driverId,
      weightKg: Math.round((0.2 + rnd() * 14) * 10) / 10,
      cod: rnd() < 0.3 ? Math.round(200 + rnd() * 3800) : undefined,
      createdAt: evs[0].at,
      events: evs,
      failReason,
      receivedBy,
    });
  }
  // pořadí na trase pro každého řidiče: jednoduché nejbližší-soused
  for (const d of drivers) orderRoute(shipments, d.id, vehicles.find((v) => v.driverId === d.id)!);

  // Včerejší statistiky
  const yDate = new Date(today.getTime() - 86400000);
  const byCarrier = CARRIERS.map((c) => {
    const total = Math.round((c.id === 'vlastni' ? 700 : 80 + rnd() * 120));
    const failed = Math.round(total * (0.02 + rnd() * 0.05));
    return { carrier: c.id, total, delivered: total - failed - Math.round(total * rnd() * 0.03), failed };
  });
  const own = byCarrier[0];
  const driversStats = drivers.map((d) => {
    const stops = Math.round(own.total / 50 + (rnd() - 0.5) * 10);
    const failed = Math.round(stops * rnd() * 0.12);
    return { driverId: d.id, stops, delivered: stops - failed, failed, km: Math.round(60 + rnd() * 110) };
  });
  const total = byCarrier.reduce((s, c) => s + c.total, 0);
  const delivered = byCarrier.reduce((s, c) => s + c.delivered, 0);
  const failed = byCarrier.reduce((s, c) => s + c.failed, 0);
  const byHour = Array.from({ length: 12 }, (_, k) => {
    const hour = 7 + k;
    const peak = Math.exp(-Math.pow(hour - 12, 2) / 10);
    return { hour, delivered: Math.round(own.delivered * 0.17 * peak * (0.85 + rnd() * 0.3)) };
  });
  const failRaw = FAIL_REASONS.map((reason, k) => ({ reason, count: Math.round(failed * [0.45, 0.15, 0.2, 0.12, 0.08][k]) }));
  const byClient = CLIENTS.map((c) => {
    const t = Math.round(total / CLIENTS.length * (0.5 + rnd()));
    return { clientId: c.id, total: t, delivered: Math.round(t * (0.92 + rnd() * 0.07)) };
  });

  const tasks: Task[] = [
    { id: 't1', title: 'Rozplánovat odpolední trasy Praha-východ', assignee: 'd1', due: at(13, 0), done: false, priority: 'vysoka', createdBy: 'Admin' },
    { id: 't2', title: 'Ověřit 12 nedoručených zásilek ze včerejška (chybná adresa)', assignee: 'd2', due: at(11, 0), done: false, priority: 'vysoka', createdBy: 'Admin' },
    { id: 't3', title: 'Domluvit svoz PPL na 15:30 místo 16:00', assignee: 'd3', due: at(12, 0), done: true, priority: 'normalni', createdBy: 'Admin' },
    { id: 't4', title: 'Servis vozu – výměna pneu po směně', assignee: 'r7', due: at(18, 0), done: false, priority: 'normalni', createdBy: 'Admin' },
    { id: 't5', title: 'Převzít vratky od Nábytek Dub', assignee: 'r12', due: at(16, 0), done: false, priority: 'normalni', createdBy: 'Admin' },
  ];

  return {
    drivers,
    vehicles,
    shipments,
    tasks,
    yesterday: {
      date: iso(yDate),
      total,
      delivered,
      failed,
      handedToCarriers: total - own.total,
      codCollected: Math.round(own.delivered * 0.3 * 1450),
      avgStopsPerDriver: Math.round(own.total / 50),
      byCarrier,
      byHour,
      drivers: driversStats,
      failReasons: failRaw,
      byClient,
    },
  };
}

export function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dx = (aLng - bLng) * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const dy = aLat - bLat;
  return Math.sqrt(dx * dx + dy * dy) * 111; // přibližně km
}

/** Seřadí zásilky řidiče heuristikou nejbližšího souseda od polohy vozu (zástupce za VROOM). */
export function orderRoute(shipments: Shipment[], driverId: string, from: { lat: number; lng: number }) {
  const mine = shipments.filter((s) => s.driverId === driverId);
  const done = mine.filter((s) => s.status === 'doruceno' || s.status === 'nedoruceno');
  const open = mine.filter((s) => !(s.status === 'doruceno' || s.status === 'nedoruceno'));
  let cur = { lat: from.lat, lng: from.lng };
  let order = 1;
  done.forEach((s) => (s.routeOrder = order++));
  const rest = [...open];
  while (rest.length) {
    let bi = 0;
    let bd = Infinity;
    rest.forEach((s, k) => {
      const d = dist(cur.lat, cur.lng, s.lat, s.lng);
      if (d < bd) { bd = d; bi = k; }
    });
    const s = rest.splice(bi, 1)[0];
    s.routeOrder = order++;
    cur = s;
  }
}
