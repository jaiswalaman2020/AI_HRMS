import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, Badge, Modal, EmptyState } from '../components/ui.jsx';
import { MANAGEMENT } from '../constants.js';

const STATUS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function Leave() {
  const { user } = useAuth();
  const isMgmt = MANAGEMENT.includes(user.role);

  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  const load = async () => {
    const reqs = [api.get('/leave/me')];
    if (isMgmt) reqs.push(api.get('/leave', { params: { status: 'pending' } }));
    const res = await Promise.all(reqs);
    setMine(res[0].data.leaves);
    if (isMgmt) setPending(res[1].data.leaves);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const review = async (id, status) => {
    await api.put(`/leave/${id}/review`, { status });
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Apply for leave and track approvals"
        action={<button className="btn-primary" onClick={() => setShowApply(true)}>+ Apply for Leave</button>} />

      {isMgmt && (
        <div className="card mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">Pending Approvals ({pending.length})</h3>
          {pending.length === 0 ? <p className="text-sm text-slate-400">Nothing pending. 🎉</p> : (
            <div className="space-y-2">
              {pending.map((l) => (
                <div key={l._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-700">{l.employee?.name} <span className="text-xs text-slate-400">({l.employee?.department})</span></p>
                    <p className="text-xs text-slate-500">{l.type} • {l.days} day(s) • {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</p>
                    {l.reason && <p className="text-xs text-slate-400 mt-0.5">“{l.reason}”</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => review(l._id, 'approved')}>Approve</button>
                    <button className="btn bg-rose-100 text-rose-700 hover:bg-rose-200" onClick={() => review(l._id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-3">My Leave Requests</h3>
        {mine.length === 0 ? <EmptyState>No leave requests yet.</EmptyState> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
            <tbody>
              {mine.map((l) => (
                <tr key={l._id} className="border-b border-slate-50">
                  <td className="py-1.5 capitalize">{l.type}</td>
                  <td>{new Date(l.startDate).toLocaleDateString()}</td>
                  <td>{new Date(l.endDate).toLocaleDateString()}</td>
                  <td>{l.days}</td>
                  <td><Badge className={STATUS[l.status]}>{l.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ApplyModal open={showApply} onClose={() => setShowApply(false)} onDone={load} />
    </div>
  );
}

function ApplyModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/leave', form);
      onDone();
      onClose();
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="casual">Casual</option><option value="sick">Sick</option>
            <option value="earned">Earned</option><option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start date</label><input className="input" type="date" value={form.startDate} onChange={set('startDate')} required /></div>
          <div><label className="label">End date</label><input className="input" type="date" value={form.endDate} onChange={set('endDate')} required /></div>
        </div>
        <div><label className="label">Reason</label><textarea className="input" rows={3} value={form.reason} onChange={set('reason')} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
        </div>
      </form>
    </Modal>
  );
}
