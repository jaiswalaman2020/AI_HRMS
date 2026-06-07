import { useState, useRef, useEffect } from 'react';
import api from '../api/client.js';
import { useSpeech } from '../hooks/useSpeech.js';

// Floating AI HR assistant with voice input/output.
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI HR assistant. Ask me about leave, payroll, or policies. You can also use the mic 🎤.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const endRef = useRef(null);

  const { listening, supported, startListening, stopListening, speak } = useSpeech({
    onResult: (text) => setInput(text),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history = [...messages, { role: 'candidate', text }];
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      // Map our UI roles to the API's {role:'ai'|'candidate'} convention.
      const apiHistory = history.map((m) => ({ role: m.role === 'ai' ? 'ai' : 'candidate', text: m.text }));
      const { data } = await api.post('/ai/assistant', { history: apiHistory });
      setMessages((m) => [...m, { role: 'ai', text: data.reply }]);
      if (voiceOut) speak(data.reply);
    } catch (err) {
      setMessages((m) => [...m, { role: 'ai', text: 'Sorry, I could not reach the AI service right now.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-brand-600 text-white text-2xl shadow-lg hover:bg-brand-700 grid place-items-center"
        title="AI HR Assistant"
      >
        {open ? '×' : '🤖'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] h-[28rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">AI HR Assistant</p>
              <p className="text-xs text-slate-400">Powered by your AI provider</p>
            </div>
            <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={voiceOut} onChange={(e) => setVoiceOut(e.target.checked)} />
              🔊 Voice
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-400 px-1">Assistant is typing…</div>}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-slate-100 flex items-center gap-2">
            {supported && (
              <button
                onClick={listening ? stopListening : startListening}
                className={`btn ${listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'btn-ghost'} px-3`}
                title="Speak"
              >
                {listening ? '⏹' : '🎤'}
              </button>
            )}
            <input
              className="input"
              placeholder="Ask the AI assistant…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn-primary px-3" onClick={send} disabled={busy}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
