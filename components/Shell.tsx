'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

const ROLES = [
  { id: 'admin', label: 'Admin', icon: '◆' },
  { id: 'dispecer', label: 'Dispečer', icon: '◉' },
  { id: 'ridic', label: 'Řidič', icon: '▲' },
  { id: 'klient', label: 'Klient', icon: '●' },
];

/** Jednoduché směrování přes #hash, aby prototyp fungoval i jako jeden statický soubor. */
export function useRoute() {
  const [route, setRoute] = useState('');
  useEffect(() => {
    const read = () => setRoute(window.location.hash.replace('#', ''));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);
  return route;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const route = useRoute();
  const { data, reset } = useStore();
  const [ask, setAsk] = useState(false);
  return (
    <div className="app">
      <header className="topbar">
        <a href="#" className="brand">
          <span className="logo">E</span> Expediční OS <span className="tag">prototyp</span>
        </a>
        <nav className="roles" aria-label="Přepnout roli">
          <span className="roles-label">Role:</span>
          {ROLES.map((r) => (
            <a key={r.id} href={`#${r.id}`} className={route === r.id ? 'role active' : 'role'}>
              <span aria-hidden>{r.icon}</span> {r.label}
            </a>
          ))}
        </nav>
        {ask ? (
          <span className="reset-ask">
            Zahodit změny?
            <button className="small danger" onClick={() => { reset(); setAsk(false); }}>Ano, nová data</button>
            <button className="ghost small" onClick={() => setAsk(false)}>Ne</button>
          </span>
        ) : (
          <button className="ghost small" onClick={() => setAsk(true)}>Nová data</button>
        )}
      </header>
      <main className="content">{data ? children : <div className="loading">Načítám testovací data…</div>}</main>
    </div>
  );
}
