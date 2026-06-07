import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getSocket } from '../api/socket.js';
import { StatCard, Spinner, PageHeader, Badge } from '../components/ui.jsx';
import { MANAGEMENT, HR_ACCESS, ROLE_LABELS, STAGE_LABELS } from '../constants.js';

const PIE = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

export default function Dashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [company, setCompany] = useState(null);
  const [recruit, setRecruit] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMgmt = MANAGEMENT.includes(user.role);
  const isHR = HR_ACCESS.includes(user.role);

  const load = async () => {
    const reqs = [api.get('/dashboard/me')];
    if (isMgmt) reqs.push(api.get('/dashboard/company'));
    if (isHR) reqs.push(api.get('/dashboard/recruitment'));
    const res = await Promise.all(reqs);
    setMe(res[0].data);
    let i = 1;
    if (isMgmt) setCompany(res[i++].data);
    if (isHR) setRecruit(res[i++].data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Live-refresh company stats when attendance changes elsewhere.
    if (isMgmt) {
      const socket = getSocket();
      socket?.on('attendance:update', () => api.get('/dashboard/company').then((r) => setCompany(r.data)));
      return () => socket?.off('attendance:update');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]} 👋`}
        subtitle={`${ROLE_LABELS[user.role]} • ${user.department || 'HRMS'}`}
      />

      {/* Company-wide (admin / senior manager) */}
      {isMgmt && company && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Company Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Employees" value={company.headline.totalEmployees} sub={`${company.headline.activeEmployees} active`} />
            <StatCard label="Present Today" value={company.headline.presentToday} sub={`${company.headline.attendanceRate}% attendance`} accent="green" />
            <StatCard label="Pending Leaves" value={company.headline.pendingLeaves} accent="amber" />
            <StatCard label="Open Positions" value={company.headline.openJobs} sub={`${company.headline.totalCandidates} candidates`} accent="rose" />
            <StatCard label="Avg Performance" value={company.headline.avgPerformance ?? '—'} sub="out of 5" accent="brand" />
            <StatCard label="On Leave" value={company.headline.onLeave} accent="slate" />
            <StatCard label="Shortlisted" value={company.headline.shortlisted} accent="green" />
            <StatCard label="Last Payroll" value={`$${(company.headline.latestPayrollTotal || 0).toLocaleString()}`} accent="amber" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Headcount by Department</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={company.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Users by Role</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={company.byRole} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={90} label={(e) => ROLE_LABELS[e.role] || e.role}>
                    {company.byRole.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, ROLE_LABELS[n] || n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Recruitment funnel (HR) */}
      {isHR && recruit && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recruitment (AI)</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h3 className="font-semibold text-slate-700 mb-3">Candidate Pipeline</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={recruit.funnel.map((f) => ({ ...f, label: STAGE_LABELS[f.stage] || f.stage }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Top AI-Ranked Candidates</h3>
              <div className="space-y-2">
                {recruit.topCandidates.length === 0 && <p className="text-sm text-slate-400">No screened candidates yet.</p>}
                {recruit.topCandidates.map((c) => (
                  <div key={c._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.job?.title}</p>
                    </div>
                    <Badge className="bg-brand-100 text-brand-700">{c.screening?.score ?? '—'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Personal activity (everyone) */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">My Activity</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Status"
            value={me.attendanceToday ? (me.attendanceToday.checkOut ? 'Checked out' : 'Checked in') : 'Not in'}
            accent={me.attendanceToday ? 'green' : 'slate'}
          />
          <StatCard label="Days Present" value={me.stats.presentDays} accent="brand" />
          <StatCard label="Pending Leaves" value={me.pendingLeaves} accent="amber" />
          <StatCard label="Latest Net Pay" value={me.latestPayslip ? `$${me.latestPayslip.netPay.toLocaleString()}` : '—'} accent="green" />
        </div>

        {me.latestReview && (
          <div className="card mt-4">
            <h3 className="font-semibold text-slate-700 mb-2">Latest Performance Review — {me.latestReview.period}</h3>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold text-brand-600">{me.latestReview.rating}/5</p>
                <p className="text-xs text-slate-400">Overall rating</p>
              </div>
              {Object.entries(me.latestReview.kpis || {}).map(([k, v]) => (
                <div key={k}>
                  <p className="text-sm font-medium text-slate-700 capitalize">{k}</p>
                  <div className="w-32 h-2 bg-slate-100 rounded-full mt-1">
                    <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {me.latestReview.feedback && <p className="text-sm text-slate-500 mt-3">{me.latestReview.feedback}</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
