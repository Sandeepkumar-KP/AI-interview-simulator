// src/scoring.js — Parse and display structured feedback from the AI interviewer

export function parseFeedback(text) {
  const match = text.match(/---FEEDBACK_START---([\s\S]*?)---FEEDBACK_END---/);
  if (!match) return null;

  const block = match[1];

  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : null;
  };

  const getScore = (key) => {
    const raw = get(key);
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
  };

  const getBullets = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`));
    if (!m) return [];
    return m[1]
      .split("\n")
      .map(l => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  };

  const overall       = getScore("OVERALL_SCORE");
  const clarity       = getScore("CLARITY");
  const depth         = getScore("DEPTH");
  const relevance     = getScore("RELEVANCE");
  const communication = getScore("COMMUNICATION");
  const strengths     = getBullets("STRENGTHS");
  const improvements  = getBullets("IMPROVEMENTS");
  const verdict       = get("VERDICT");
  const summary       = text.replace(/---FEEDBACK_START---[\s\S]*?---FEEDBACK_END---/, "").trim();

  return { overall, clarity, depth, relevance, communication, strengths, improvements, verdict, summary };
}

export function toGrade(score) {
  if (score >= 90) return { grade: "A+", label: "Exceptional",  color: "#4ade80" };
  if (score >= 80) return { grade: "A",  label: "Strong",       color: "#86efac" };
  if (score >= 70) return { grade: "B+", label: "Good",         color: "#c8a96e" };
  if (score >= 60) return { grade: "B",  label: "Adequate",     color: "#fbbf24" };
  if (score >= 50) return { grade: "C",  label: "Needs Work",   color: "#f97316" };
  return                  { grade: "D",  label: "Poor",         color: "#ef4444" };
}

export function buildSessionStats(messages) {
  const userMessages = messages.filter(m => m.role === "user");
  const aiMessages   = messages.filter(m => m.role === "assistant");

  const avgUserLength = userMessages.length
    ? Math.round(userMessages.reduce((s, m) => s + m.content.split(" ").length, 0) / userMessages.length)
    : 0;

  return {
    totalExchanges: Math.min(userMessages.length, aiMessages.length),
    avgResponseWords: avgUserLength,
    durationLabel: formatDuration(userMessages.length),
  };
}

function formatDuration(exchanges) {
  const mins = exchanges * 2;
  if (mins < 60) return `~${mins} min`;
  return `~${Math.round(mins / 60)}h ${mins % 60}m`;
}
