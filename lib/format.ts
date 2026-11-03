export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtNum = (n: number) => n.toLocaleString('cs-CZ');
export const fmtKc = (n: number) => `${n.toLocaleString('cs-CZ')} Kč`;
export const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} %` : '–');
