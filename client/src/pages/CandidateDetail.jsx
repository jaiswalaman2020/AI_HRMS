import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { PageHeader, Spinner, Badge } from '../components/ui.jsx';
import { ScoreRing } from './Recruitment.jsx';
import { STAGE_LABELS, REC_COLORS } from '../constants.js';
import InterviewChat from '../components/InterviewChat.jsx';

const STAGES = ['applied', 'ai_screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];

export default function CandidateDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescreening, setRescreening] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/recruitment/candidates/${id}`);
    setC(data.candidate);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const rescreen = async () => {
    setRescreening(true);
    try { const { data } = await api.post(`/recruitment/candidates/${id}/rescreen`); setC(data.candidate); }
    finally { setRescreening(false); }
  };

  const setStage = async (stage) => {
    const { data } = await api.put(`/recruitment/candidates/${id}/stage`, { stage });
    setC(data.candidate);
  };

  if (loading) return <Spinner />;
  const s = c.screening || {};

  return (
    <div>
      <Link to="/recruitment" className="text-sm text-brand-600 hover:underline">← Back to recruitment</Link>
      <PageHeader title={c.name} subtitle={`${c.email} • ${c.job?.title} • ${c.yearsExperience} yrs experience`} />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* AI screening result */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">AI Screening Result</h3>
              <button className="btn-ghost text-xs" disabled={rescreening} onClick={rescreen}>{rescreening ? 'Re-screening…' : '↻ Re-screen'}</button>
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={s.score ?? 0} />
              <div>
                <p className="text-sm text-slate-500">Fit score</p>
                {s.recommendation && <Badge className={REC_COLORS[s.recommendation]}>{s.recommendation.replace('_', ' ')}</Badge>}
              </div>
              <p className="text-xs text-slate-400 ml-auto">Model: {s.model || '—'}</p>
            </div>
            {s.summary && <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3">{s.summary}</p>}

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <SkillList title="✅ Matched skills" items={s.matchedSkills} color="text-emerald-600" />
              <SkillList title="⚠️ Missing skills" items={s.missingSkills} color="text-rose-600" />
              <SkillList title="💪 Strengths" items={s.strengths} color="text-slate-600" />
              <SkillList title="🔍 Concerns" items={s.concerns} color="text-slate-600" />
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700">🎙️ AI Screening Interview</h3>
            <p className="text-xs text-slate-400 mb-3">Conducted by the candidate via the careers portal — review only</p>
            <InterviewChat candidateId={c._id} initialTranscript={c.interviewTranscript || []} readOnly />
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-2">Resume Text</h3>
            <pre className="text-xs text-slate-500 whitespace-pre-wrap max-h-64 overflow-y-auto bg-slate-50 rounded-lg p-3">{c.resumeText}</pre>
          </div>
        </div>

        {/* Stage control */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-3">Pipeline Stage</h3>
            <p className="mb-3"><Badge className="bg-brand-100 text-brand-700">{STAGE_LABELS[c.stage]}</Badge></p>
            <div className="space-y-2">
              {STAGES.map((st) => (
                <button
                  key={st}
                  onClick={() => setStage(st)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${c.stage === st ? 'bg-brand-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                >
                  {STAGE_LABELS[st]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillList({ title, items = [], color }) {
  return (
    <div>
      <p className={`text-sm font-medium mb-1 ${color}`}>{title}</p>
      {items.length === 0 ? <p className="text-xs text-slate-300">None</p> : (
        <div className="flex flex-wrap gap-1">
          {items.map((s, i) => <span key={i} className="badge bg-slate-100 text-slate-600">{s}</span>)}
        </div>
      )}
    </div>
  );
}
