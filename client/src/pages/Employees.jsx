import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, Badge, Modal, EmptyState } from '../components/ui.jsx';
import { ROLE_LABELS } from '../constants.js';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  on_leave: 'bg-amber-100 text-amber-700',
  terminated: 'bg-rose-100 text-rose-700',
};

export default function Employees() {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const isAdmin = user.role === 'admin';

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/employees', { params: { search, department, page, limit: 12 } });
    setData(data);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/employees/meta/departments').then(({ data }) => setDepartments(data.departments));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department, page]);

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${data.total} people in the organisation`}
        action={isAdmin && <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Employee</button>}
      />

      <div className="card mb-4 flex flex-wrap gap-3">
        <input className="input flex-1 min-w-[200px]" placeholder="Search by name, email, ID…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select className="input max-w-[200px]" value={department} onChange={(e) => { setPage(1); setDepartment(e.target.value); }}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <EmptyState>No employees match your filters.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-semibold">
                        {e.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{e.employeeId}</td>
                  <td className="py-2 pr-4 text-slate-500">{e.department || '—'}</td>
                  <td className="py-2 pr-4"><Badge className="bg-slate-100 text-slate-600">{ROLE_LABELS[e.role]}</Badge></td>
                  <td className="py-2 pr-4"><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-400">Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={load} departments={departments} />
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onCreated, departments }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', designation: '', salary: 5000 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/employees', { ...form, salary: Number(form.salary) });
      onCreated();
      onClose();
      setForm({ name: '', email: '', password: '', role: 'employee', department: '', designation: '', salary: 5000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Employee">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Password</label><input className="input" type="text" value={form.password} onChange={set('password')} required minLength={6} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="employee">Employee</option>
              <option value="hr_recruiter">HR Recruiter</option>
              <option value="senior_manager">Senior Manager</option>
              <option value="admin">Management Admin</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Department</label>
            <input className="input" list="depts" value={form.department} onChange={set('department')} />
            <datalist id="depts">{departments.map((d) => <option key={d} value={d} />)}</datalist>
          </div>
          <div><label className="label">Designation</label><input className="input" value={form.designation} onChange={set('designation')} /></div>
          <div><label className="label">Salary</label><input className="input" type="number" value={form.salary} onChange={set('salary')} /></div>
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}
