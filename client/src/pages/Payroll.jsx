import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, Badge, StatCard, EmptyState } from '../components/ui.jsx';
import { MANAGEMENT } from '../constants.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS = { processed: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700', draft: 'bg-slate-100 text-slate-600' };

export default function Payroll() {
  const { user } = useAuth();
  const isMgmt = MANAGEMENT.includes(user.role);
  const isAdmin = user.role === 'admin';

  const now = new Date();
  const [mine, setMine] = useState([]);
  const [company, setCompany] = useState({ payslips: [], totalPayout: 0 });
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const reqs = [api.get('/payroll/me')];
    if (isMgmt) reqs.push(api.get('/payroll', { params: { month, year } }));
    const res = await Promise.all(reqs);
    setMine(res[0].data.payslips);
    if (isMgmt) setCompany(res[1].data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month]);

  const generate = async () => {
    setBusy(true);
    try {
      await api.post('/payroll/generate', { month, year });
      await load();
    } finally { setBusy(false); }
  };

  const pay = async (id) => { await api.put(`/payroll/${id}/pay`); load(); };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Payroll" subtitle="Payslips and salary processing"
        action={isAdmin && <button className="btn-primary" disabled={busy} onClick={generate}>{busy ? 'Processing…' : `Generate ${MONTHS[month - 1]} payroll`}</button>} />

      {isMgmt && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard label={`${MONTHS[month - 1]} ${year} Payout`} value={`$${company.totalPayout.toLocaleString()}`} accent="green" />
            <StatCard label="Payslips" value={company.payslips.length} accent="brand" />
            <StatCard label="Paid" value={company.payslips.filter((p) => p.status === 'paid').length} accent="amber" />
          </div>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Company Payroll — {MONTHS[month - 1]} {year}</h3>
              <select className="input max-w-[140px]" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            {company.payslips.length === 0 ? <EmptyState>No payroll generated for this month.</EmptyState> : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Employee</th><th>Basic</th><th>Allow.</th><th>Tax</th><th>Net</th><th>Status</th>{isAdmin && <th></th>}</tr></thead>
                  <tbody>
                    {company.payslips.map((p) => (
                      <tr key={p._id} className="border-b border-slate-50">
                        <td className="py-1.5">{p.employee?.name}</td>
                        <td>${p.basic.toLocaleString()}</td>
                        <td>${p.allowances.toLocaleString()}</td>
                        <td>${p.tax.toLocaleString()}</td>
                        <td className="font-medium">${p.netPay.toLocaleString()}</td>
                        <td><Badge className={STATUS[p.status]}>{p.status}</Badge></td>
                        {isAdmin && <td>{p.status !== 'paid' && <button className="btn-ghost text-xs" onClick={() => pay(p._id)}>Mark paid</button>}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-3">My Payslips</h3>
        {mine.length === 0 ? <EmptyState>No payslips yet.</EmptyState> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Period</th><th>Basic</th><th>Allowances</th><th>Tax</th><th>Net Pay</th><th>Status</th></tr></thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p._id} className="border-b border-slate-50">
                  <td className="py-1.5">{MONTHS[p.month - 1]} {p.year}</td>
                  <td>${p.basic.toLocaleString()}</td>
                  <td>${p.allowances.toLocaleString()}</td>
                  <td>${p.tax.toLocaleString()}</td>
                  <td className="font-medium text-slate-800">${p.netPay.toLocaleString()}</td>
                  <td><Badge className={STATUS[p.status]}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
