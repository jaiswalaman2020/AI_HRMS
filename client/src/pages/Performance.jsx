import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, Badge, Modal, EmptyState } from '../components/ui.jsx';
import { MANAGEMENT } from '../constants.js';

export default function Performance() {
  const { user } = useAuth();
  const isMgmt = MANAGEMENT.includes(user.role);

  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const reqs = [api.get('/performance/me')];
    if (isMgmt) reqs.push(api.get('/performance'));
    const res = await Promise.all(reqs);
    setMine(res[0].data.reviews);
    if (isMgmt) setAll(res[1].data.reviews);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Performance" subtitle="Reviews, ratings and goals"
        action={isMgmt && <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Review</button>} />

      {isMgmt && (
        <div className="card mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">Team Reviews</h3>
          {all.length === 0 ? <EmptyState>No reviews yet.</EmptyState> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Employee</th><th>Period</th><th>Rating</th><th>Status</th></tr></thead>
              <tbody>
                {all.map((r) => (
                  <tr key={r._id} className="border-b border-slate-50">
                    <td className="py-1.5">{r.employee?.name} <span className="text-xs text-slate-400">({r.employee?.department})</span></td>
                    <td>{r.period}</td>
                    <td><Badge className="bg-brand-100 text-brand-700">{r.rating}/5</Badge></td>
                    <td><Badge className={r.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700">My Reviews</h3>
        {mine.length === 0 ? <EmptyState>No published reviews yet.</EmptyState> : mine.map((r) => (
          <div key={r._id} className="card">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">{r.period}</h4>
              <Badge className="bg-brand-100 text-brand-700 text-base">{r.rating}/5</Badge>
            </div>
            <div className="flex flex-wrap gap-6 mt-3">
              {Object.entries(r.kpis || {}).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-500 capitalize">{k}</p>
                  <div className="w-32 h-2 bg-slate-100 rounded-full mt-1"><div className="h-2 bg-brand-500 rounded-full" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            {r.goals?.length > 0 && (
              <div className="mt-3 space-y-1">
                {r.goals.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{g.title}</span>
                    <span className="text-xs text-slate-400">{g.progress}%</span>
                  </div>
                ))}
              </div>
            )}
            {r.feedback && <p className="text-sm text-slate-500 mt-3 border-t border-slate-100 pt-3">{r.feedback}</p>}
          </div>
        ))}
      </div>

      <ReviewModal open={showForm} onClose={() => setShowForm(false)} onDone={load} />
    </div>
  );
}

function ReviewModal({ open, onClose, onDone }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee: '', period: '2026-Q2', rating: 3,
    kpis: { productivity: 70, quality: 70, teamwork: 70 },
    feedback: '', status: 'published',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) api.get('/employees', { params: { limit: 100 } }).then(({ data }) => setEmployees(data.items));
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/performance', { ...form, rating: Number(form.rating) });
      onDone(); onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Performance Review">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))} required>
              <option value="">Select…</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          <div><label className="label">Period</label><input className="input" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} /></div>
        </div>
        <div>
          <label className="label">Overall Rating: {form.rating}/5</label>
          <input type="range" min="1" max="5" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} className="w-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['productivity', 'quality', 'teamwork'].map((k) => (
            <div key={k}>
              <label className="label capitalize">{k} ({form.kpis[k]})</label>
              <input type="range" min="0" max="100" value={form.kpis[k]} onChange={(e) => setForm((f) => ({ ...f, kpis: { ...f.kpis, [k]: Number(e.target.value) } }))} className="w-full" />
            </div>
          ))}
        </div>
        <div><label className="label">Feedback</label><textarea className="input" rows={3} value={form.feedback} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Publish Review'}</button>
        </div>
      </form>
    </Modal>
  );
}
