'use client';
import { useRoute } from '@/components/Shell';
import Home from '@/views/home';
import AdminPage from '@/views/admin';
import DispecerPage from '@/views/dispecer';
import RidicPage from '@/views/ridic';
import KlientPage from '@/views/klient';

export default function Page() {
  const route = useRoute();
  if (route === 'admin') return <AdminPage />;
  if (route === 'dispecer') return <DispecerPage />;
  if (route === 'ridic') return <RidicPage />;
  if (route === 'klient') return <KlientPage />;
  return <Home />;
}
