import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import Welcome from './pages/Welcome';
import Outfits from './pages/Outfits';
import Closet from './pages/Closet';
import GarmentForm from './pages/GarmentForm';
import Shop from './pages/Shop';
import ListingDetail from './pages/ListingDetail';
import Sell from './pages/Sell';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Balance from './pages/Balance';
import Soon from './pages/Soon';
import Admin from './pages/Admin';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const TABS = [
  { to: '/outfits', label: 'Outfits', d: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z' },
  { to: '/closet', label: 'Clóset', d: 'M12 6a2 2 0 1 1 2 2c-1 0-2 .8-2 2v.5L3 17h18l-9-6.5' },
  { to: '/bazar', label: 'Bazar', d: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2' },
  { to: '/saldo', label: 'Saldo', d: 'M3 7h18v12H3zM3 11h18M7 15h3' }
];

function Tabs() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/login')) return null;
  return (
    <nav className="tabs" aria-label="Secciones">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon d={t.d} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
  }, [session]);

  if (session === undefined) return <div className="loading">Cargando…</div>;
  if (!session) return <Welcome />;

  const ctx = { session, user: session.user, profile, setProfile };
  return (
    <AuthCtx.Provider value={ctx}>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/outfits" replace />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/closet" element={<Closet />} />
          <Route path="/closet/nueva" element={<GarmentForm />} />
          <Route path="/closet/:id" element={<GarmentForm />} />
          <Route path="/bazar" element={<Shop />} />
          <Route path="/bazar/p/:id" element={<ListingDetail />} />
          <Route path="/bazar/vender" element={<Sell />} />
          <Route path="/bazar/vender/:garmentId" element={<Sell />} />
          <Route path="/comprar/*" element={<Navigate to="/bazar" replace />} />
          <Route path="/vitrina/*" element={<Navigate to="/bazar" replace />} />
          <Route path="/vender" element={<Navigate to="/bazar/vender" replace />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/pedidos/:id" element={<OrderDetail />} />
          <Route path="/saldo" element={<Balance />} />
          <Route path="/muy-pronto" element={<Soon />} />
          <Route path="/operacion" element={<Admin />} />
          <Route path="*" element={<Navigate to="/outfits" replace />} />
        </Routes>
        <Tabs />
      </div>
    </AuthCtx.Provider>
  );
}
