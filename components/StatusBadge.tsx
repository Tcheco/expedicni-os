import { STATUS_LABEL, Status, CarrierId, carrierById } from '@/lib/data';
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge st-${status}`}>{STATUS_LABEL[status]}</span>;
}
export function CarrierBadge({ carrier }: { carrier: CarrierId }) {
  const c = carrierById(carrier);
  return <span className="carrier" style={{ borderColor: c.color, color: c.color }}>{c.short}</span>;
}
