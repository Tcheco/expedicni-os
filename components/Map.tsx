'use client';
import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';

export interface MapPoint { id: string; lat: number; lng: number; color: string; label?: string; popup?: string; kind?: 'stop' | 'vehicle' | 'done'; selected?: boolean }

interface Props { points: MapPoint[]; lines?: { color: string; coords: [number, number][] }[]; height?: number | string; onPointClick?: (id: string) => void; fitKey?: string }

export default function MapView({ points, lines = [], height = 420, onPointClick, fitKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lib = useRef<typeof L | null>(null);
  const lastFit = useRef<string | undefined>(undefined);
  const clickRef = useRef(onPointClick);
  clickRef.current = onPointClick;

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      if (cancelled || !el.current || map.current) return;
      const Lm = (mod.default ?? mod) as typeof L;
      lib.current = Lm;
      map.current = Lm.map(el.current, { zoomControl: true, preferCanvas: true }).setView([49.8, 15.5], 7);
      Lm.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      // popisky měst jako orientace, kdyby se mapové dlaždice nenačetly
      [['Praha', 50.0755, 14.4378], ['Brno', 49.1951, 16.6068], ['Plzeň', 49.7384, 13.3736], ['Ostrava', 49.8209, 18.2625]].forEach(([n, la, ln]) =>
        Lm.marker([la as number, ln as number], { interactive: false, icon: Lm.divIcon({ className: 'city-label', html: `<div>${n}</div>`, iconSize: [0, 0], iconAnchor: [20, 30] }) }).addTo(map.current!)
      );
      layer.current = Lm.layerGroup().addTo(map.current);
      draw();
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const Lm = lib.current; const m = map.current; const g = layer.current;
    if (!Lm || !m || !g) return;
    g.clearLayers();
    lines.forEach((l) => Lm.polyline(l.coords, { color: l.color, weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(g));
    points.forEach((p) => {
      let marker: L.Layer;
      if (p.kind === 'vehicle') {
        marker = Lm.marker([p.lat, p.lng], {
          icon: Lm.divIcon({ className: 'veh-icon', html: `<div style="background:${p.color}">${p.label ?? ''}</div>`, iconSize: [30, 22], iconAnchor: [15, 11] }),
          zIndexOffset: 1000,
        });
      } else if (p.label) {
        marker = Lm.marker([p.lat, p.lng], {
          icon: Lm.divIcon({ className: 'stop-icon', html: `<div style="background:${p.kind === 'done' ? '#94a3b8' : p.color}">${p.label}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        });
      } else {
        marker = Lm.circleMarker([p.lat, p.lng], { radius: p.selected ? 7 : 4, color: p.selected ? '#111827' : p.color, weight: p.selected ? 2 : 1, fillColor: p.color, fillOpacity: p.kind === 'done' ? 0.25 : 0.8 });
      }
      if (p.popup) (marker as L.Marker).bindPopup(p.popup);
      marker.on('click', () => clickRef.current?.(p.id));
      marker.addTo(g);
    });
    if (fitKey !== lastFit.current && points.length) {
      lastFit.current = fitKey;
      const b = Lm.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      m.fitBounds(b, { padding: [30, 30], maxZoom: 14 });
    }
  }

  useEffect(draw); // překreslení při každé změně dat

  return <div ref={el} className="map" style={{ height }} />;
}
