import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { PageHeader, Spinner, Badge, Modal, EmptyState } from '../components/ui.jsx';
import { STAGE_LABELS, REC_COLORS } from '../constants.js';

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCands, setLoadingCands] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  const loadJobs = async () => {
    const { data } = await api.get('/recruitment/jobs');
    setJobs(data.jobs);
    if (data.jobs.length && !activeJob) selectJob(data.jobs[0]);
    setLoading(false);
  };

  const selectJob = async (job) => {
    setActiveJob(job);
    setLoadingCands(true);
    const { data } = await api.get(`/recruitment/jobs/${job._id}/candidates`);
    setCandidates(data.candidates);
    setLoadingCands(false);
  };

  useEffect(() => {
    loadJobs();
    api.get('/ai/status').then(({ data }) => setAiStatus(data));
    // eslint-disable-next-line
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="AI Recruitment"
        subtitle="Automated resume screening & AI candidate evaluation"
        action={<button className="btn-primary" onClick={() => setShowJob(true)}>+ Post Job</button>}
      />

      <div className="card mb-6 flex items-center gap-3 text-sm">
        <span className={`badge ${aiStatus?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {aiStatus?.enabled ? '● AI online' : '● Heuristic fallback'}
        </span>
        <span className="text-slate-500">
          {aiStatus?.enabled ? `Model: ${aiStatus.model}` : 'Running in offline mode.'}
        </span>
        <a href="/careers" target="_blank" rel="noreferrer" className="ml-auto text-brand-600 hover:underline">Open careers portal ↗</a>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Jobs list */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-700 mb-1">Open Roles ({jobs.length})</h3>
          {jobs.map((j) => (
            <button
              key={j._id}
              onClick={() => selectJob(j)}
              className={`w-full text-left card hover:border-brand-400 transition ${activeJob?._id === j._id ? 'border-brand-500 ring-1 ring-brand-200' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{j.title}</p>
                <Badge className={j.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>{j.status}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">{j.department} • {j.location}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(j.requiredSkills || []).slice(0, 4).map((s) => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}
              </div>
            </button>
          ))}
        </div>

        {/* Candidates ranked by AI */}
        <div className="lg:col-span-2">
          {activeJob && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Candidates — {activeJob.title}</h3>
                <span className="text-xs text-slate-400">Ranked by AI fit score</span>
              </div>
              {loadingCands ? <Spinner /> : candidates.length === 0 ? (
                <EmptyState>No applicants yet. Share the careers portal to receive AI-screened applications.</EmptyState>
              ) : (
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <Link
                      key={c._id}
                      to={`/recruitment/candidates/${c._id}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50"
                    >
                      <ScoreRing score={c.screening?.score ?? 0} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email} • {c.yearsExperience} yrs exp</p>
                      </div>
                      {c.screening?.recommendation && (
                        <Badge className={REC_COLORS[c.screening.recommendation]}>{c.screening.recommendation.replace('_', ' ')}</Badge>
                      )}
                      <Badge className="bg-slate-100 text-slate-600">{STAGE_LABELS[c.stage]}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <JobModal open={showJob} onClose={() => setShowJob(false)} onDone={loadJobs} />
    </div>
  );
}

export function ScoreRing({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${(score / 100) * 100} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-700">{score}</span>
    </div>
  );
}

function JobModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ title: '', department: '', location: 'Remote', description: '', requiredSkills: '', minExperience: 0 });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/recruitment/jobs', {
        ...form,
        minExperience: Number(form.minExperience),
        requiredSkills: form.requiredSkills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      });
      onDone(); onClose();
      setForm({ title: '', department: '', location: 'Remote', description: '', requiredSkills: '', minExperience: 0 });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post a Job">
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Title</label><input className="input" value={form.title} onChange={set('title')} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={set('department')} /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={set('location')} /></div>
        </div>
        <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={set('description')} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Required skills (comma separated)</label><input className="input" value={form.requiredSkills} onChange={set('requiredSkills')} placeholder="react, node.js, mongodb" /></div>
          <div><label className="label">Min experience (yrs)</label><input className="input" type="number" value={form.minExperience} onChange={set('minExperience')} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post Job'}</button>
        </div>
      </form>
    </Modal>
  );
}
