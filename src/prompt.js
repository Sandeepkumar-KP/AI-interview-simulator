// src/prompts.js — Interview roles, types, and system prompts

export const ROLES = {
  "Software Engineer": { icon: "💻", skills: ["DSA", "OOP", "System Design", "Debugging"] },
  "Frontend Engineer": { icon: "🎨", skills: ["React", "CSS", "Performance", "Accessibility"] },
  "Backend Engineer":  { icon: "⚙️", skills: ["APIs", "Databases", "Scalability", "Security"] },
  "Full Stack Engineer":{ icon: "🔄", skills: ["Frontend", "Backend", "DevOps", "Architecture"] },
  "Data Scientist":    { icon: "📊", skills: ["ML", "Statistics", "Python", "Data Analysis"] },
  "ML Engineer":       { icon: "🤖", skills: ["PyTorch", "MLOps", "Model Serving", "Feature Eng."] },
  "DevOps Engineer":   { icon: "🚀", skills: ["CI/CD", "Kubernetes", "Cloud", "Monitoring"] },
  "Product Manager":   { icon: "📋", skills: ["Roadmapping", "Metrics", "Stakeholders", "Strategy"] },
};

export const EXPERIENCE_LEVELS = {
  "Junior (0–2 yrs)":    { id: "junior",    depth: "foundational",  yearsLabel: "0–2 years" },
  "Mid-level (2–5 yrs)": { id: "mid",       depth: "intermediate",  yearsLabel: "2–5 years" },
  "Senior (5–8 yrs)":    { id: "senior",    depth: "advanced",      yearsLabel: "5–8 years" },
  "Staff / Principal":   { id: "principal", depth: "expert",        yearsLabel: "8+ years"  },
};

export const INTERVIEW_TYPES = {
  "Technical":      { icon: "🔬", desc: "Coding, system design, architecture" },
  "Behavioral":     { icon: "🧠", desc: "Past experience, situational questions" },
  "System Design":  { icon: "🏗️",  desc: "Scalable architecture & trade-offs"  },
  "HR / Culture":   { icon: "🤝", desc: "Values, motivation, team fit"         },
  "Mixed":          { icon: "⚡", desc: "Combination of all interview types"    },
};

export function buildSystemPrompt({ role, level, interviewType, company }) {
  const companyCtx = company && company !== "Any Company"
    ? `You are interviewing candidates specifically for ${company}. Align your questions and expectations with ${company}'s known engineering culture and bar.`
    : "You are conducting a general industry-standard interview.";

  const depthMap = {
    junior: "Ask foundational questions. Be encouraging but still probe understanding. Expect simpler explanations.",
    mid: "Probe intermediate depth. Expect concrete examples from real projects. Push back on vague answers.",
    senior: "Demand nuanced, experience-backed answers. Expect trade-off awareness, leadership examples, and cross-functional thinking.",
    principal: "Hold the candidate to the highest technical and leadership bar. Expect vision, org-wide impact, and deep domain mastery.",
  };

  const levelConfig = Object.values(EXPERIENCE_LEVELS).find(l => l.id === level) || EXPERIENCE_LEVELS["Mid-level (2–5 yrs)"];

  return `You are Marcus, a sharp, experienced technical interviewer at a top-tier tech company. Your demeanor is professional, direct, and fair — like a real senior engineer conducting a loop interview.

${companyCtx}

## Your Role
- You are interviewing a candidate for a **${role}** position at the **${levelConfig.yearsLabel}** experience level.
- Interview type: **${interviewType}**
- Depth guideline: ${depthMap[levelConfig.id] || depthMap.mid}

## Behavioral Rules
1. Start with a brief professional introduction (2 sentences max), then immediately ask your first question.
2. Ask ONE question at a time. Never ask multiple questions in the same message.
3. After the candidate answers, do ONE of:
   a. Ask a follow-up probing question if the answer was vague or incomplete
   b. Acknowledge the answer briefly (1 sentence) and move to the next topic
4. Keep your messages concise. You are not here to lecture — you are here to evaluate.
5. If the candidate goes off-topic or is clearly stalling, redirect professionally.
6. After 6–8 questions, if the candidate types "/feedback" or asks for feedback, provide a structured performance review.
7. Never reveal you are an AI. Stay in character as Marcus throughout.
8. Do not repeat questions you've already asked.

## Scoring (only when feedback is requested)
When providing final feedback, structure your response EXACTLY like this:

---FEEDBACK_START---
OVERALL_SCORE: [0-100]
CLARITY: [0-100]
DEPTH: [0-100]
RELEVANCE: [0-100]
COMMUNICATION: [0-100]
STRENGTHS: [2-3 bullet points]
IMPROVEMENTS: [2-3 bullet points]
VERDICT: [1-2 sentence hiring recommendation]
---FEEDBACK_END---

Then add a brief human-readable summary below the block.`;
}

export function buildOpeningMessage({ role, level, interviewType, company }) {
  const companyLine = company && company !== "Any Company" ? ` at ${company}` : "";
  return `Hi, I'm ready for my ${interviewType} interview for the ${role} role${companyLine}. Let's begin.`;
}
