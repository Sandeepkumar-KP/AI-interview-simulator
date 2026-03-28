// src/app.js — Core application logic & state management
import { buildSystemPrompt, buildOpeningMessage } from "./prompts.js";
import { sendMessage, validateApiKey, APIError } from "./api.js";
import { parseFeedback, toGrade, buildSessionStats } from "./scoring.js";

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  apiKey: localStorage.getItem("ais_api_key") || "",
  config: null,       // { role, level, interviewType, company }
  messages: [],       // [{role: "user"|"assistant", content: string}]
  systemPrompt: "",
  phase: "setup",     // "setup" | "interview" | "feedback"
  isLoading: false,
  sessionHistory: JSON.parse(localStorage.getItem("ais_history") || "[]"),
};

// ─── DOM refs ────────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ─── Main init ───────────────────────────────────────────────────────────────

export function initApp() {
  // Restore API key
  if (state.apiKey) {
    $("#api-key-input").value = state.apiKey;
    $("#api-key-status").textContent = "✓ Key loaded";
    $("#api-key-status").className = "status-ok";
  }

  // Wire up events
  $("#save-key-btn").addEventListener("click", handleSaveKey);
  $("#start-btn").addEventListener("click", handleStart);
  $("#send-btn").addEventListener("click", handleSend);
  $("#user-input").addEventListener("keydown", handleKeydown);
  $("#feedback-btn").addEventListener("click", handleRequestFeedback);
  $("#restart-btn").addEventListener("click", handleRestart);
  $("#new-session-btn").addEventListener("click", handleRestart);
  $("#history-btn").addEventListener("click", toggleHistory);
  $("#close-history-btn").addEventListener("click", toggleHistory);

  // Auto-resize textarea
  $("#user-input").addEventListener("input", () => {
    const el = $("#user-input");
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  });

  renderHistory();
}

// ─── API Key ─────────────────────────────────────────────────────────────────

async function handleSaveKey() {
  const key = $("#api-key-input").value.trim();
  if (!key) return showKeyStatus("Please enter a key", "error");

  showKeyStatus("Validating…", "loading");
  try {
    const ok = await validateApiKey(key);
    if (ok) {
      state.apiKey = key;
      localStorage.setItem("ais_api_key", key);
      showKeyStatus("✓ Valid — ready to interview", "ok");
    } else {
      showKeyStatus("✗ Invalid key", "error");
    }
  } catch {
    showKeyStatus("✗ Network error", "error");
  }
}

function showKeyStatus(msg, type) {
  const el = $("#api-key-status");
  el.textContent = msg;
  el.className = `status-${type}`;
}

// ─── Start Interview ──────────────────────────────────────────────────────────

async function handleStart() {
  if (!state.apiKey) {
    alert("Please enter and save your Anthropic API key first.");
    return;
  }

  const role         = $("#role-select").value;
  const level        = $("#level-select").value;
  const interviewType = $("#type-select").value;
  const company      = $("#company-select").value;

  if (!role || !level || !interviewType) {
    alert("Please select a role, experience level, and interview type.");
    return;
  }

  state.config = { role, level, interviewType, company };
  state.messages = [];
  state.systemPrompt = buildSystemPrompt(state.config);
  state.phase = "interview";

  showPhase("interview");
  updateInterviewHeader();

  // Kick off with the opening message
  const opening = buildOpeningMessage(state.config);
  await sendUserMessage(opening, false /* don't show in chat */);
}

// ─── Interview Chat ───────────────────────────────────────────────────────────

async function handleSend() {
  const input = $("#user-input");
  const text = input.value.trim();
  if (!text || state.isLoading) return;

  input.value = "";
  input.style.height = "auto";
  await sendUserMessage(text, true);
}

function handleKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

async function sendUserMessage(text, showInChat) {
  if (showInChat) {
    appendMessage("user", text);
  }

  state.messages.push({ role: "user", content: text });
  setLoading(true);

  const typingEl = appendTyping();

  try {
    let fullResponse = "";

    await sendMessage({
      apiKey: state.apiKey,
      systemPrompt: state.systemPrompt,
      messages: state.messages,
      onChunk: (token) => {
        fullResponse += token;
        typingEl.querySelector(".typing-text").textContent = fullResponse;
      },
    });

    typingEl.remove();
    state.messages.push({ role: "assistant", content: fullResponse });
    appendMessage("assistant", fullResponse);

    // Check if this is a feedback response
    const feedback = parseFeedback(fullResponse);
    if (feedback) {
      renderFeedback(feedback);
    }
  } catch (err) {
    typingEl.remove();
    const msg = err instanceof APIError
      ? `API Error: ${err.message}`
      : "Connection error. Please check your network and try again.";
    appendMessage("error", msg);
  } finally {
    setLoading(false);
    scrollChat();
  }
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

async function handleRequestFeedback() {
  if (state.isLoading) return;
  const prompt = "Please provide your final assessment and detailed feedback on my performance in this interview.";
  await sendUserMessage(prompt, true);
}

function renderFeedback(feedback) {
  state.phase = "feedback";

  const { overall, clarity, depth, relevance, communication, strengths, improvements, verdict } = feedback;
  const grade = toGrade(overall);
  const stats = buildSessionStats(state.messages);

  const card = document.createElement("div");
  card.className = "feedback-card";
  card.innerHTML = `
    <div class="feedback-header">
      <div class="feedback-grade" style="color: ${grade.color}">${grade.grade}</div>
      <div class="feedback-score">${overall}<span>/100</span></div>
      <div class="feedback-label" style="color: ${grade.color}">${grade.label}</div>
    </div>

    <div class="score-grid">
      ${renderScoreBar("Clarity",       clarity,       toGrade(clarity).color)}
      ${renderScoreBar("Depth",         depth,         toGrade(depth).color)}
      ${renderScoreBar("Relevance",     relevance,     toGrade(relevance).color)}
      ${renderScoreBar("Communication", communication, toGrade(communication).color)}
    </div>

    <div class="feedback-sections">
      <div class="feedback-section strengths">
        <h4>✓ Strengths</h4>
        <ul>${strengths.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
      <div class="feedback-section improvements">
        <h4>△ Areas to Improve</h4>
        <ul>${improvements.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
    </div>

    ${verdict ? `<div class="verdict"><strong>Verdict:</strong> ${verdict}</div>` : ""}

    <div class="session-stats">
      <span>🔄 ${stats.totalExchanges} exchanges</span>
      <span>📝 avg ${stats.avgResponseWords} words/answer</span>
      <span>⏱ ${stats.durationLabel}</span>
    </div>

    <button class="btn-primary" id="new-session-btn-inner">Start New Session</button>
  `;

  $("#chat-messages").appendChild(card);
  card.querySelector("#new-session-btn-inner").addEventListener("click", handleRestart);

  // Save to history
  saveSession(feedback, stats);
  scrollChat();
}

function renderScoreBar(label, score, color) {
  return `
    <div class="score-bar-row">
      <span class="score-label">${label}</span>
      <div class="score-bar-track">
        <div class="score-bar-fill" style="width: ${score}%; background: ${color}"></div>
      </div>
      <span class="score-value" style="color: ${color}">${score}</span>
    </div>
  `;
}

// ─── Session History ──────────────────────────────────────────────────────────

function saveSession(feedback, stats) {
  const session = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    config: state.config,
    overall: feedback.overall,
    grade: toGrade(feedback.overall).grade,
    stats,
  };

  state.sessionHistory.unshift(session);
  if (state.sessionHistory.length > 20) state.sessionHistory.pop();
  localStorage.setItem("ais_history", JSON.stringify(state.sessionHistory));
  renderHistory();
}

function renderHistory() {
  const container = $("#history-list");
  if (!container) return;

  if (state.sessionHistory.length === 0) {
    container.innerHTML = '<p class="no-history">No sessions yet. Start your first interview!</p>';
    return;
  }

  container.innerHTML = state.sessionHistory.map(s => `
    <div class="history-item">
      <div class="history-role">${s.config?.role || "Unknown"}</div>
      <div class="history-meta">
        <span>${s.config?.interviewType || ""}</span>
        <span>${s.date}</span>
      </div>
      <div class="history-score" style="color: ${toGrade(s.overall).color}">
        ${s.grade} · ${s.overall}/100
      </div>
    </div>
  `).join("");
}

function toggleHistory() {
  $("#history-panel").classList.toggle("open");
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function showPhase(phase) {
  $$(".phase").forEach(el => el.classList.remove("active"));
  $(`#phase-${phase}`).classList.add("active");
}

function updateInterviewHeader() {
  const { role, level, interviewType, company } = state.config;
  const companyStr = company !== "Any Company" ? ` · ${company}` : "";
  $("#interview-subtitle").textContent = `${interviewType} Interview · ${role} · ${level}${companyStr}`;
}

function appendMessage(role, content) {
  const el = document.createElement("div");
  el.className = `message message-${role}`;

  const label = role === "user" ? "You" : role === "assistant" ? "Marcus" : "⚠ Error";

  el.innerHTML = `
    <div class="message-label">${label}</div>
    <div class="message-body">${formatContent(content)}</div>
  `;

  $("#chat-messages").appendChild(el);
  scrollChat();
  return el;
}

function appendTyping() {
  const el = document.createElement("div");
  el.className = "message message-assistant message-typing";
  el.innerHTML = `
    <div class="message-label">Marcus</div>
    <div class="message-body">
      <span class="typing-text"></span>
      <span class="typing-cursor">▋</span>
    </div>
  `;
  $("#chat-messages").appendChild(el);
  scrollChat();
  return el;
}

function formatContent(text) {
  // Remove feedback block from display
  text = text.replace(/---FEEDBACK_START---[\s\S]*?---FEEDBACK_END---/, "").trim();

  // Basic markdown: bold, code
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function setLoading(loading) {
  state.isLoading = loading;
  $("#send-btn").disabled = loading;
  $("#feedback-btn").disabled = loading;
  $("#user-input").disabled = loading;

  if (!loading) {
    $("#user-input").focus();
  }
}

function scrollChat() {
  const chat = $("#chat-messages");
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

function handleRestart() {
  state.messages = [];
  state.config = null;
  state.phase = "setup";
  $("#chat-messages").innerHTML = "";
  showPhase("setup");
  $("#history-panel").classList.remove("open");
}
