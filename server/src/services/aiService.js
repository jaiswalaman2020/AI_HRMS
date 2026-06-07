/**
 * AI service — provider-agnostic wrapper over any OpenAI-compatible chat API.
 *
 * Default provider: Groq (free, fast, OpenAI-compatible) via AI_BASE_URL.
 * If AI_API_KEY is not set, every function degrades to a deterministic local
 * heuristic so the app still demos end-to-end without any external dependency.
 *
 * Node 18+ provides a global `fetch`, so no HTTP client dependency is needed.
 */

const hasKey = () => Boolean(process.env.AI_API_KEY);

const cfg = () => ({
  baseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
  key: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
});

// Low-level chat completion. `json` forces JSON-object output when supported.
async function chat(messages, { json = false, temperature = 0.4 } = {}) {
  const { baseUrl, key, model } = cfg();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI provider error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// Resume screening — fully automated, no human in the loop.
// ---------------------------------------------------------------------------
export async function screenResume({ resumeText, job }) {
  const jobBlurb = `Title: ${job.title}\nDepartment: ${job.department || 'N/A'}\nRequired skills: ${(job.requiredSkills || []).join(', ')}\nMinimum experience: ${job.minExperience || 0} years\nDescription: ${job.description}`;

  if (!hasKey()) return heuristicScreen({ resumeText, job });

  const system =
    'You are an expert technical recruiter. Evaluate a candidate resume against a job description objectively and without bias regarding name, gender, age or ethnicity. Respond with strict JSON only.';
  const user = `JOB:\n${jobBlurb}\n\nRESUME:\n${(resumeText || '').slice(0, 8000)}\n\nReturn JSON with keys: score (0-100 integer fit score), recommendation (one of "strong_yes","yes","maybe","no"), matchedSkills (string[]), missingSkills (string[]), strengths (string[]), concerns (string[]), summary (2-3 sentence string).`;

  try {
    const raw = await chat(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { json: true, temperature: 0.2 }
    );
    const parsed = JSON.parse(raw);
    return { ...normalizeScreen(parsed), model: cfg().model, screenedAt: new Date() };
  } catch (err) {
    console.warn('AI screen failed, using heuristic:', err.message);
    return heuristicScreen({ resumeText, job });
  }
}

function normalizeScreen(p) {
  const recs = ['strong_yes', 'yes', 'maybe', 'no'];
  return {
    score: Math.max(0, Math.min(100, Math.round(p.score ?? 0))),
    recommendation: recs.includes(p.recommendation) ? p.recommendation : 'maybe',
    matchedSkills: Array.isArray(p.matchedSkills) ? p.matchedSkills : [],
    missingSkills: Array.isArray(p.missingSkills) ? p.missingSkills : [],
    strengths: Array.isArray(p.strengths) ? p.strengths : [],
    concerns: Array.isArray(p.concerns) ? p.concerns : [],
    summary: p.summary || '',
  };
}

// Keyword-overlap heuristic used when no AI key is configured.
function heuristicScreen({ resumeText = '', job }) {
  const text = resumeText.toLowerCase();
  const required = (job.requiredSkills || []).map((s) => s.toLowerCase());
  const matched = required.filter((s) => text.includes(s));
  const missing = required.filter((s) => !text.includes(s));
  const ratio = required.length ? matched.length / required.length : 0.5;
  const score = Math.round(ratio * 100);
  const recommendation = score >= 75 ? 'strong_yes' : score >= 55 ? 'yes' : score >= 35 ? 'maybe' : 'no';
  return {
    score,
    recommendation,
    matchedSkills: matched,
    missingSkills: missing,
    strengths: matched.length ? [`Matches ${matched.length} of ${required.length} required skills`] : [],
    concerns: missing.length ? [`Missing: ${missing.join(', ')}`] : [],
    summary: `Heuristic match: ${score}% skill overlap with the role. Configure AI_API_KEY for full AI evaluation.`,
    model: 'heuristic-fallback',
    screenedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Conversational screening interview — the AI asks/answers candidate questions.
// ---------------------------------------------------------------------------
export async function interviewReply({ job, history, candidateName }) {
  if (!hasKey()) {
    const asked = history.filter((h) => h.role === 'ai').length;
    const fallback = [
      `Hi ${candidateName || 'there'}! Thanks for applying to the ${job.title} role. Can you tell me about your most relevant experience?`,
      'Great. Which of the required skills are you strongest in, and can you give an example?',
      'How do you approach learning a new technology under a tight deadline?',
      'Thanks — that is all for the AI screening. Our team will be in touch shortly!',
    ];
    return fallback[Math.min(asked, fallback.length - 1)];
  }

  const system = `You are a friendly but rigorous AI recruiter conducting a first-round screening for the role of "${job.title}". Required skills: ${(job.requiredSkills || []).join(', ')}. Ask one concise question at a time, follow up on answers, and after ~4 exchanges wrap up politely. Keep replies under 60 words.`;
  const messages = [
    { role: 'system', content: system },
    ...history.map((h) => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text })),
  ];
  if (history.length === 0) {
    messages.push({ role: 'user', content: 'Please begin the screening interview.' });
  }
  return chat(messages, { temperature: 0.6 });
}

// ---------------------------------------------------------------------------
// HR assistant chatbot — answers HR questions, optionally grounded in context.
// ---------------------------------------------------------------------------
export async function assistantReply({ history, context }) {
  if (!hasKey()) {
    return "I'm the HR assistant (offline mode). I can help with leave, payroll and policy questions once an AI key is configured. Meanwhile, use the dashboard tabs to manage your HR tasks.";
  }
  const system = `You are an helpful HR assistant for an HRMS platform. Be concise and friendly. ${context ? `Context about the current user: ${context}` : ''}`;
  const messages = [
    { role: 'system', content: system },
    ...history.map((h) => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text })),
  ];
  return chat(messages, { temperature: 0.5 });
}

export const aiStatus = () => ({
  enabled: hasKey(),
  provider: process.env.AI_PROVIDER || 'groq',
  model: cfg().model,
});
