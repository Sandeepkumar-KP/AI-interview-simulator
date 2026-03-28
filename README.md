 🎯 AI Interview Simulator

A production-grade, fully interactive AI-powered interview simulator built with vanilla JavaScript  Practice technical, behavioral, and system design interviews with real-time AI feedback.


 ✨ Features

- **Multiple Interview Types** — Technical, Behavioral, System Design, HR/Culture Fit
- **Role-Specific Questions** — Software Engineer, Data Scientist, Product Manager, DevOps, Frontend, Backend, Full Stack
- **Experience Levels** — Junior, Mid-level, Senior, Staff/Principal
- **Real-time AI Interviewer** — Claude acts as a professional interviewer with follow-up questions
- **Performance Scoring** — Get scored on clarity, depth, relevance, and communication
- **Detailed Feedback** — Actionable post-interview analysis with strengths and improvement areas
- **Session History** — Review past interview sessions
- **Dark Professional UI** — Distraction-free, elegant interface


 🚀 Quick Start

# Option 1: Open Directly (No Build Needed)

```bash
git clone https://github.com/yourusername/ai-interview-simulator.git
cd ai-interview-simulator
```

Then open `index.html` in your browser. Enter your Anthropic API key when prompted.

### Option 2: Serve Locally

```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8080

# Using PHP
php -S localhost:8080
```

Visit `http://localhost:8080`

---

## 🔑 API Key Setup

1. Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Enter it in the app's settings panel
3. Your key is stored only in `localStorage` — never sent anywhere except Anthropic's API

 **Note:** You need a valid Anthropic API key to use this app. Usage is billed according to Anthropic's pricing.

---


 🎮 How to Use

1. **Configure** — Enter your API key and select your target role, experience level, and interview type
2. **Start Interview** — The AI interviewer introduces itself and begins with an opening question
3. **Respond** — Type your answers naturally; the AI will follow up with probing questions
4. **Get Feedback** — After 5–10 questions, request a performance review with detailed scoring
5. **Iterate** — Review feedback and start a new session to improve

 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | Pure CSS with custom properties |
| AI Engine | Claude claude-sonnet-4-20250514 via Anthropic API |
| Storage | Browser `localStorage` |
| Build | None required (zero dependencies) |



 📊 Scoring Rubric

Each response is evaluated on:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Clarity** | 25% | How clearly and concisely the answer is communicated |
| **Depth** | 30% | Technical accuracy and thoroughness of the response |
| **Relevance** | 25% | How well the answer addresses the specific question |
| **Communication** | 20% | Structure, examples used, confidence in delivery |



 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

 📋 Roadmap

- [ ] Voice input/output (Web Speech API)
- [ ] Export interview transcript as PDF
- [ ] Multi-language support
- [ ] Company-specific interview prep modes (Google, Meta, Amazon, etc.)
- [ ] Peer comparison analytics
- [ ] Integration with job listings (auto-generate role-specific prep)

 📄 License

MIT License — see [LICENSE](LICENSE) for details.
*Made for engineers who take their interviews seriously.*
