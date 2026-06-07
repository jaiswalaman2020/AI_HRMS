import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV, ROLE_LABELS } from '../constants.js';
import AssistantWidget from './AssistantWidget.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => n.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 transform transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-lg font-bold flex items-center gap-2">
            <span className="text-brand-500">◆</span> AI HRMS
          </div>
          <p className="text-xs text-slate-400 mt-1">AI-Powered HR Management</p>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Backdrop on mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between">
          <button className="md:hidden btn-ghost" onClick={() => setOpen(true)}>☰</button>
          <div className="hidden md:block text-sm text-slate-400">
            Welcome back, <span className="font-medium text-slate-700">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-items-center font-semibold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>

      {/* Floating AI assistant available to every logged-in user */}
      <AssistantWidget />
    </div>
  );
}
