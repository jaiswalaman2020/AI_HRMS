import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  { role: 'Management Admin', email: 'admin@hrms.com' },
  { role: 'Senior Manager', email: 'manager@hrms.com' },
  { role: 'HR Recruiter', email: 'recruiter@hrms.com' },
  { role: 'Employee', email: 'employee@hrms.com' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@hrms.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-brand-600 to-indigo-800 text-white p-12">
        <div className="text-3xl font-bold flex items-center gap-2">◆ AI HRMS</div>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight">
          The future of HR, <br /> powered by AI.
        </h1>
        <ul className="mt-8 space-y-3 text-brand-100">
          <li>🤖 Automated AI resume screening & evaluation</li>
          <li>🎙️ Voice & conversational candidate screening</li>
          <li>📊 Real-time, role-based dashboards</li>
          <li>👥 Employees, attendance, payroll & performance</li>
          <li>⚡ Built to scale to 5,000+ employees</li>
        </ul>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="md:hidden text-2xl font-bold text-brand-600 mb-6">◆ AI HRMS</div>
          <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Welcome back. Please enter your details.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-slate-400 mb-2">Quick demo logins (password: password123)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword('password123'); }}
                  className="text-left rounded-lg border border-slate-200 px-3 py-2 text-xs hover:border-brand-400 hover:bg-brand-50"
                >
                  <div className="font-medium text-slate-700">{d.role}</div>
                  <div className="text-slate-400">{d.email}</div>
                </button>
              ))}
            </div>
            <a href="/careers" className="block text-center text-xs text-brand-600 mt-4 hover:underline">
              Looking for a job? Visit the careers portal →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
