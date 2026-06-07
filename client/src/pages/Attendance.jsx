import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, Badge, StatCard } from '../components/ui.jsx';
import { HR_ACCESS } from '../constants.js';

const fmt = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

export default function Attendance() {
  const { user } = useAuth();
  const isHR = HR_ACCESS.includes(user.role);

  const [mine, setMine] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = mine.find((r) => r.date === today);

  const load = async () => {
    const reqs = [api.get('/attendance/me')];
    if (isHR) reqs.push(api.get('/attendance'));
    const res = await Promise.all(reqs);
    setMine(res[0].data.records);
    if (isHR) setTeam(res[1].data.records);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const action = async (type) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${type}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  const presentToday = team.filter((r) => ['present', 'remote'].includes(r.status)).length;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Track check-in / check-out and team presence" />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Today, {new Date().toLocaleDateString()}</p>
          <p className="text-lg font-semibold text-slate-800">
            {todayRecord?.checkIn ? `Checked in at ${fmt(todayRecord.checkIn)}` : 'Not checked in yet'}
            {todayRecord?.checkOut ? ` • Checked out at ${fmt(todayRecord.checkOut)}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy || todayRecord?.checkIn} onClick={() => action('check-in')}>Check In</button>
          <button className="btn-ghost" disabled={busy || !todayRecord?.checkIn || todayRecord?.checkOut} onClick={() => action('check-out')}>Check Out</button>
        </div>
      </div>

      {isHR && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard label="Records Today" value={team.length} accent="brand" />
          <StatCard label="Present / Remote" value={presentToday} accent="green" />
          <StatCard label="On Leave" value={team.filter((r) => r.status === 'leave').length} accent="amber" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">My Recent Attendance</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r._id} className="border-b border-slate-50">
                  <td className="py-1.5">{r.date}</td>
                  <td>{fmt(r.checkIn)}</td>
                  <td>{fmt(r.checkOut)}</td>
                  <td>{r.workedHours || '—'}</td>
                  <td><Badge className="bg-slate-100 text-slate-600">{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isHR && (
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-3">Team — Today</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5">Employee</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
                <tbody>
                  {team.map((r) => (
                    <tr key={r._id} className="border-b border-slate-50">
                      <td className="py-1.5">
                        <p className="font-medium text-slate-700">{r.employee?.name}</p>
                        <p className="text-xs text-slate-400">{r.employee?.department}</p>
                      </td>
                      <td>{fmt(r.checkIn)}</td>
                      <td>{fmt(r.checkOut)}</td>
                      <td><Badge className="bg-slate-100 text-slate-600">{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
