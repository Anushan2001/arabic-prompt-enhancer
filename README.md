# ✦ Arabic → English AI Prompt Enhancer

A tool that transforms Arabic prompts into optimized, well-structured English prompts for better AI results. Powered by Claude.

![Arabic Prompt Enhancer](https://img.shields.io/badge/Arabic→English-Prompt%20Enhancer-6366f1?style=for-the-badge)

## Features

- **Dialect Detection** — Automatically identifies MSA vs Egyptian, Levantine, Gulf, Maghrebi dialects
- **Meaning-Based Translation** — Preserves intent, not just words
- **Prompt Enhancement** — Adds structure, roles, constraints, and formatting
- **Arabic Back-Translation** — Verify your intent was preserved
- **Tone Selection** — General, Technical, Creative, Academic, Business
- **Target AI** — Optimized for Claude, ChatGPT, Gemini, or any AI

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/arabic-prompt-enhancer.git
cd arabic-prompt-enhancer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Enter your API key

The app will ask for your Anthropic API key on first use.  
Get one at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

> Your key is stored in your browser's localStorage only — it's sent directly to the Anthropic API and never touches any other server.

---

## Deploy to GitHub Pages (Free Hosting)

### Step-by-step:

1. **Push this repo to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/arabic-prompt-enhancer.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repo on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on every push

3. **Your site will be live at:**
   ```
   https://YOUR_USERNAME.github.io/arabic-prompt-enhancer/
   ```

4. **Share the link with your client!**

---

## How It Works

1. User types an Arabic prompt
2. The app calls Claude's API with a specialized system prompt
3. Claude detects the dialect, translates meaningfully (not literally), and enhances the prompt
4. Results are shown in 4 tabs: Enhanced Prompt, Translation, Arabic Summary, Enhancement Notes

## Tech Stack

- **React 18** + **Vite**
- **Anthropic Claude API** (claude-sonnet-4-20250514)
- Deployed via **GitHub Pages**

## License

MIT
