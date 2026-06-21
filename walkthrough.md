# 🎮 The Hackathon Simulator: Project Walkthrough

**The Hackathon Simulator** is a gamified, turn-based web application that mimics the entire lifecycle of participating in a hackathon—from team assembly to final judging. 

Built entirely in the browser, the application uses modern frontend technologies to deliver a pressure-cooker scenario where your decisions dictate your project's success.

---

## 🛠️ Tech Stack & Architecture

The simulator leverages a bleeding-edge, highly optimized stack:
- **Framework:** Next.js 16 (App Router) with React 19.
- **State Management:** Zustand 5 (with persistent slice-based architecture).
- **Animations:** Framer Motion 12.4 for fluid transitions and SVG animations.
- **UI & Styling:** Tailwind CSS 4.x, shadcn/ui, and Lucide React icons.
- **Interactions:** `@dnd-kit` for drag-and-drop mechanics (e.g., building a tech stack or pitch deck).

### State Management (Zustand Slices)
The game state is cleanly divided into 5 modular slices:
1. **Core Slice:** Manages the linear 14-stage pipeline.
2. **Timer Slice:** Handles the global countdown.
3. **Scoring Slice:** Tracks silent points across Innovation, Execution, Design, and Pitch.
4. **Mentor Slice:** Controls interactions with AI co-founders and team members.
5. **Judging Slice:** Saves persistent feedback, generated roasts, and achievements to LocalStorage.

---

## 🚦 The 14-Stage Game Pipeline
The core loop progresses through 14 linear stages. Between stages, random **Chaos Events** (15-35% chance) or **Team Chats** (20% chance) can interrupt the flow:

1. **Setup:** Choose Difficulty & Assemble Team (Roles: Builder, Designer, Dreamer, Founder).
2. **Ideation:** Problem Reveal & Solution Direction.
3. **Engineering:** Tech Stack Selection & USP (Unique Selling Proposition) formulation.
4. **Product:** Feature Prioritization.
5. **Pitching:** Pitch Deck Builder (Drag & Drop), Mentor Consultation, Business Model, Pitch Prep.
6. **Judging:** Spin the Judge Wheel & Final Evaluation.

---

## 👥 Key Gameplay Systems

### 1. Teammate & AI Co-Founder System
You don't play alone. Your chosen team members have distinct personalities:
- **The Builder:** Loves standard templates, hates over-engineering.
- **The Designer:** Needs stunning UI and hates headless setups.
- **Crew Voting:** When choosing a USP or Business Model, the crew votes based on their roles. If you propose a highly technical backend product, the Designer might vote "NO" out of frustration.

### 2. Pitch Deck Builder
A drag-and-drop interface where you arrange up to 10 slides from 31 available components. The engine evaluates your logic:
> [!TIP]
> **Scoring Strategy:** Placing the "Problem" slide before the "Solution" slide grants a bonus. Showing a "Competitor Moat" followed by the "Business Model" boosts your business score. Leading with "Architecture" before the "Problem" results in a severe penalty.

### 3. Dynamic Judging Engine
There are 5 different judges (e.g., Uday the Hacker, Nishika the UI/UX Designer, Jitu the Professor), each with different grading weights. The final score is a formula of `(Innovation + Execution + Design + Pitch) * Synergy Bonuses`. 

Grades range from **S-Tier (Venture-Scale Unicorn)** down to **F-Tier (Compile Failed)**.

---

## 🛡️ Hardened Security API
Because the simulator uses external AI for dynamically roasting projects, it has a highly secure backend API (`app/api/generate-roast/route.ts`):
- **Multi-Provider AI Setup:** Cascades smoothly from OpenAI → OpenRouter → Gemini, and has a local fallback generator if all fail.
- **Rate Limiting:** Sliding window limiter (10 requests/minute per IP) to prevent API spam.
- **Sanitization & Injection Shields:** Zod payload validation, active Prompt Injection shielding, and XSS sanitization.
- **Anti-AI Filters:** Strips out boring LLM jargon (like "delve", "landscape") and emojis to make the judges' feedback sound like real, blunt human beings.

---

## 📁 Project Structure Guide

If you're looking to dive into the codebase, here's where to find everything:

- **`app/`**: Next.js App Router.
  - `app/game/page.tsx`: The main game orchestrator that hosts all 14 stages.
  - `app/results/page.tsx`: The post-game static dashboard showing radar charts of your performance.
  - `app/api/generate-roast/`: The hardened backend endpoint for AI judging.
- **`components/`**: UI building blocks.
  - `components/drag-drop/`: The `@dnd-kit` logic for tech stack and pitch deck building.
  - `components/game/`: Complex interactive pieces like the SVG Judge Wheel and Timers.
- **`data/`**: The "content" of the game (Judges, Tech Registry, Chaos Events, Modifiers).
- **`lib/`**: Core logic (Scoring systems, Rate limiters, Security shields, Evaluators).

> [!NOTE]
> To run the project locally, just execute `npm install` followed by `npm run dev` and navigate to `http://localhost:3000`.
