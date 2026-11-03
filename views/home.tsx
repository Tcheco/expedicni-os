'use client';
import { useStore } from '@/lib/store';
import { fmtNum } from '@/lib/format';

const CARDS = [
  { href: '#admin', title: 'Hlavní admin', text: 'Ranní přehled včerejška, výkon řidičů a dopravců, přidělování úkolů dispečerům a řidičům.' },
  { href: '#dispecer', title: 'Dispečer', text: 'Dnešní zásilky, filtrování, ruční i automatické přiřazení řidičům, živá mapa vozů.' },
  { href: '#ridic', title: 'Řidič (mobil)', text: 'Trasa na dnešek v pořadí zastávek, navigace, potvrzení doručení nebo důvod nedoručení.' },
  { href: '#klient', title: 'Klient', text: 'Své zásilky u všech dopravců na jednom místě a jednotná časová osa sledování.' },
];

export default function Home() {
  const { data } = useStore();
  const d = data!;
  return (
    <div className="home">
      <section className="hero">
        <h1>Klikací prototyp Expedičního OS</h1>
        <p>
          Ukázka hlavních obrazovek na testovacích datech: {fmtNum(d.vehicles.length)} aut, {fmtNum(d.shipments.length)} dnešních zásilek,
          dopravci Česká pošta, Balíkovna, DPD, PPL a Zásilkovna (simulovaně). Vyberte roli nahoře nebo zde.
        </p>
      </section>
      <div className="cards">
        {CARDS.map((c) => (
          <a key={c.href} href={c.href} className="card role-card">
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <span className="go">Otevřít →</span>
          </a>
        ))}
      </div>
      <p className="note">
        Změny (přiřazení, doručení, úkoly) se ukládají jen ve vašem prohlížeči. Napojení na Balíkobot, přihlašování a databáze přijdou ve vývoji MVP.
      </p>
    </div>
  );
}
