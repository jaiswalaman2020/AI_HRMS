import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { useSpeech } from '../hooks/useSpeech.js';

/**
 * The AI screening interview.
 *  - Candidate-facing (default): the candidate converses with the AI recruiter by
 *    text or voice. The AI speaks its questions aloud when 🔊 Voice is on.
 *  - readOnly: recruiters review the completed transcript; no input is shown.
 */
export default function InterviewChat({ candidateId, initialTranscript = [], readOnly = false }) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [voiceOut, setVoiceOut] = useState(!readOnly);
  const [done, setDone] = useState(false);
  const endRef = useRef(null);

  const { listening, supported, startListening, stopListening, speak } = useSpeech({
    onResult: (text) => setInput(text),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length, busy]);

  const turn = async (message) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/recruitment/candidates/${candidateId}/interview`, { message });
      setTranscript(data.transcript);
      if (voiceOut) speak(data.reply);
      // The AI wraps up after ~4 questions; surface a friendly "complete" state.
      if (data.transcript.filter((m) => m.role === 'ai').length >= 4) setDone(true);
    } catch {
      /* swallow — keep the candidate experience smooth */
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    turn(text);
  };

  const started = transcript.length > 0;

  return (
    <div>
      {!readOnly && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400">Conversational + voice screening, powered by AI</p>
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={voiceOut} onChange={(e) => setVoiceOut(e.target.checked)} /> 🔊 Voice
          </label>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
        {transcript.length === 0 && (
          <p className="text-sm text-slate-400">
            {readOnly ? 'The candidate has not taken the AI interview yet.' : 'Click below to begin your AI screening interview.'}
          </p>
        )}
        {transcript.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'candidate' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <span className="block text-[10px] opacity-60 mb-0.5">{m.role === 'ai' ? 'AI Recruiter' : 'Candidate'}</span>
              {m.text}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-slate-400">AI is thinking…</p>}
        <div ref={endRef} />
      </div>

      {readOnly ? null : done ? (
        <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3">
          ✅ Thanks — your AI screening interview is complete. The recruitment team will review it and be in touch.
        </div>
      ) : !started ? (
        <button className="btn-primary w-full" disabled={busy} onClick={() => turn('')}>Start AI Interview</button>
      ) : (
        <div className="flex items-center gap-2">
          {supported && (
            <button
              onClick={listening ? stopListening : startListening}
              className={`btn ${listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'btn-ghost'} px-3`}
              title="Answer by voice"
            >
              {listening ? '⏹' : '🎤'}
            </button>
          )}
          <input
            className="input"
            placeholder="Type your answer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn-primary px-3" disabled={busy} onClick={send}>➤</button>
        </div>
      )}
    </div>
  );
}
