import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { Spinner, Badge } from '../components/ui.jsx';
import { ScoreRing } from './Recruitment.jsx';
import { REC_COLORS } from '../constants.js';
import InterviewChat from '../components/InterviewChat.jsx';

// Public careers portal — no login required. Applying triggers instant AI screening.
export default function CareerApply() {
  const { jobId } = useParams();
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recruitment/jobs', { params: { status: 'open' } }).then(({ data }) => {
      setJobs(data.jobs);
      setSelected(jobId ? data.jobs.find((j) => j._id === jobId) || data.jobs[0] : data.jobs[0]);
      setLoading(false);
    });
  }, [jobId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-brand-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="text-2xl font-bold flex items-center gap-2">◆ AI HRMS Careers</div>
          <h1 className="mt-3 text-3xl font-extrabold">Apply in minutes. Get instant AI feedback.</h1>
          <p className="text-brand-100 mt-2">Your resume is screened by AI the moment you apply — no waiting.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        {loading ? <Spinner /> : (
          <>
            <div className="space-y-2">
              <h2 className="font-semibold text-slate-700">Open Roles</h2>
              {jobs.length === 0 && <p className="text-sm text-slate-400">No open roles right now.</p>}
              {jobs.map((j) => (
                <button key={j._id} onClick={() => setSelected(j)}
                  className={`w-full text-left card hover:border-brand-400 ${selected?._id === j._id ? 'border-brand-500 ring-1 ring-brand-200' : ''}`}>
                  <p className="font-medium text-slate-800">{j.title}</p>
                  <p className="text-xs text-slate-400">{j.department} • {j.location}</p>
                </button>
              ))}
            </div>
            <div className="lg:col-span-2">
              {selected ? <ApplyForm job={selected} /> : <p className="text-slate-400">Select a role to apply.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ApplyForm({ job }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', yearsExperience: 0, resumeText: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Reset when switching jobs.
  useEffect(() => { setResult(null); setError(''); }, [job._id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('resume', file);
      const { data } = await api.post(`/recruitment/jobs/${job._id}/apply`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.candidate);
    } catch (err) {
      setError(err.response?.data?.message || 'Application failed');
    } finally { setBusy(false); }
  };

  if (result) {
    const s = result.screening || {};
    return (
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800">Thanks, {result.name}! 🎉</h2>
          <p className="text-sm text-slate-500 mb-4">Your application for <b>{job.title}</b> has been screened by our AI.</p>
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
            <ScoreRing score={s.score ?? 0} />
            <div>
              <p className="text-sm text-slate-500">Your AI fit score</p>
              {s.recommendation && <Badge className={REC_COLORS[s.recommendation]}>{s.recommendation.replace('_', ' ')}</Badge>}
            </div>
          </div>
          {s.summary && <p className="text-sm text-slate-600 mt-3">{s.summary}</p>}
          {s.matchedSkills?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-emerald-600 mb-1">Matched skills</p>
              <div className="flex flex-wrap gap-1">{s.matchedSkills.map((x) => <span key={x} className="badge bg-emerald-100 text-emerald-700">{x}</span>)}</div>
            </div>
          )}
        </div>

        {/* The candidate now takes the AI screening interview themselves. */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-800">🎙️ Your AI Screening Interview</h3>
          <p className="text-sm text-slate-500 mb-3">
            Complete a short conversational interview with our AI recruiter. You can type or use your microphone.
          </p>
          <InterviewChat candidateId={result._id} initialTranscript={result.interviewTranscript || []} />
        </div>

        <button className="btn-ghost" onClick={() => setResult(null)}>Apply to another role</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
      <p className="text-xs text-slate-400 mb-2">{job.department} • {job.location} • {job.minExperience}+ yrs</p>
      <p className="text-sm text-slate-600 mb-3">{job.description}</p>
      <div className="flex flex-wrap gap-1 mb-4">{(job.requiredSkills || []).map((s) => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}</div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Full name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">Years of experience</label><input className="input" type="number" value={form.yearsExperience} onChange={set('yearsExperience')} /></div>
        </div>
        <div>
          <label className="label">Resume (PDF) — or paste text below</label>
          <input className="input" type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <div>
          <label className="label">Resume text {file && <span className="text-slate-300">(optional when a file is attached)</span>}</label>
          <textarea className="input" rows={5} value={form.resumeText} onChange={set('resumeText')} placeholder="Paste your resume / experience here…" />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Screening with AI…' : 'Apply & get instant AI feedback'}</button>
      </form>
    </div>
  );
}
