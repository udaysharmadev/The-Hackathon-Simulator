/**
 * @fileoverview Next.js API Route for live AI-powered PRD generation.
 * Hooks into Google Gemini API using native fetch (zero package weight) to
 * procedurally generate high-fidelity, customized startup documentation.
 *
 * @module app/api/generate-prd/route
 */

import { NextResponse } from "next/server";
import { generatePRD } from "@/lib/prdGenerator";
import { classifyProjectArchetype } from "@/lib/archetypes";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function loadEnvFromFile(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    let currentDir = process.cwd();
    let envPath = path.join(currentDir, ".env.local");
    
    // Walk up to 4 directories high to locate .env.local
    for (let i = 0; i < 4; i++) {
      if (fs.existsSync(envPath)) {
        break;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
      envPath = path.join(currentDir, ".env.local");
    }

    // Also check standard ".env" as fallback
    if (!fs.existsSync(envPath)) {
      currentDir = process.cwd();
      let fallbackPath = path.join(currentDir, ".env");
      for (let i = 0; i < 4; i++) {
        if (fs.existsSync(fallbackPath)) {
          envPath = fallbackPath;
          break;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
        fallbackPath = path.join(currentDir, ".env");
      }
    }

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const eqIdx = trimmed.indexOf("=");
          const key = trimmed.slice(0, eqIdx).trim();
          let value = trimmed.slice(eqIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      });
    }
  } catch (err) {
    console.error("Error reading env file directly:", err);
  }
  return env;
}

export async function POST(req: Request) {
  let state: any = null;
  try {
    state = await req.json();

    if (!state || !state.selectedProblem) {
      return NextResponse.json({ error: "Missing game state payload" }, { status: 400 });
    }

    const fileEnv = loadEnvFromFile();
    
    // Typo-resilient, alias matching for key assignments
    const openaiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || 
                      process.env.NEXT_PUBLIC_OPENAI_API_KEY || fileEnv.NEXT_PUBLIC_OPENAI_API_KEY ||
                      process.env.OPENAI_KEY || fileEnv.OPENAI_KEY;
                      
    const openRouterKey = process.env.OPENROUTER_API_KEY || fileEnv.OPENROUTER_API_KEY || 
                         process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || fileEnv.NEXT_PUBLIC_OPENROUTER_API_KEY;
                         
    const geminiKey = process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || 
                      process.env.NEXT_PUBLIC_GEMINI_API_KEY || fileEnv.NEXT_PUBLIC_GEMINI_API_KEY;

    // ─── Procedural Fallback if no keys are configured ────────────────────────
    if (!openaiKey && !openRouterKey && !geminiKey) {
      const fallbackMarkdown = generatePRD(state);
      const notice = `> [premium]
> **AI_API_GENERATION_OFFLINE // DEMO MODE ACTIVE:**
> To unlock infinite AI-powered startup briefs, configure an **\`OPENAI_API_KEY\`**, **\`OPENROUTER_API_KEY\`**, or **\`GEMINI_API_KEY\`** in a **\`.env.local\`** file inside the repository root. Showing procedurally generated high-fidelity document:

\n\n${fallbackMarkdown}`;
      
      return NextResponse.json({ markdown: notice });
    }

    // ─── Prepare grounding parameters for LLM Prompt ─────────────────────────
    const problem = state.selectedProblem;
    const grade = state.grade || "B";
    const feedback = state.judgeFeedback[state.judgeFeedback.length - 1];
    const finalScoreVal = feedback?.score || 0;
    const displayScore = (finalScoreVal / 2).toFixed(1);
    
    const archetype = classifyProjectArchetype({
      techStack: state.techStack,
      features: state.features,
      usp: state.usp,
      businessModel: state.businessModel,
      solutionDirection: state.solutionDirection,
    });

    // Structure the input data JSON exactly as requested
    const mustFeatures = state.features || [];
    const mustHave = mustFeatures.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      effort: f.effort,
      impact: f.impact
    }));

    // Reconstruct niceToHave and overkill backlog categories for LLM context matching
    const allKnownFeatures = [
      { id: "feat-ai", name: "AI Assistant", description: "Secures search logs", effort: "medium", impact: "high" },
      { id: "feat-chat", name: "Interactive Chat", description: "Peer messaging streams", effort: "low", impact: "high" },
      { id: "feat-maps", name: "Campus Maps Grid", description: "Indoor study coordinates", effort: "medium", impact: "medium" },
      { id: "feat-analytics", name: "Emissions Analytics", description: "Live telemetry dashboards", effort: "medium", impact: "high" },
      { id: "feat-game", name: "Study Gamification", description: "Streaks and study locks", effort: "low", impact: "medium" },
      { id: "feat-lead", name: "Emissions Leaderboard", description: "Direct community matches", effort: "low", impact: "medium" },
      { id: "feat-pay", name: "Micro Loans Payments", description: "Secured transactions checkouts", effort: "high", impact: "high" },
      { id: "feat-notif", name: "Urgent Notifications", description: "Offline push channels", effort: "low", impact: "medium" },
      { id: "feat-voice", name: "Local Voice Assistant", description: "Dialect audio synthesizer", effort: "high", impact: "high" },
      { id: "feat-ar", name: "AR Navigation View", description: "Virtual indoor coordinate overlays", effort: "high", impact: "high" },
    ];

    const mustIds = new Set(mustFeatures.map((f: any) => f.id));
    const remaining = allKnownFeatures.filter(f => !mustIds.has(f.id));
    
    const niceToHave = remaining.filter(f => f.effort !== "high").map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      effort: f.effort,
      impact: f.impact
    }));
    const overkill = remaining.filter(f => f.effort === "high").map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      effort: f.effort,
      impact: f.impact
    }));

    const inputData = {
      problem: {
        title: problem?.title,
        description: problem?.description,
        category: problem?.category,
        difficulty: problem?.difficulty,
        constraints: problem?.constraints,
        bonusObjectives: problem?.bonusObjectives
      },
      solutionDirection: state.solutionDirection,
      techStack: state.techStack.map((t: any) => ({
        name: t.name,
        category: t.category,
        difficulty: t.difficulty
      })),
      usp: state.usp,
      features: {
        mustHave,
        niceToHave,
        overkill
      },
      mentorFeedback: state.mentorName ? `Insights provided by mentor ${state.mentorName}.` : "No direct mentor feedback utilized.",
      businessModel: state.businessModel,
      pitchText: state.pitchText,
      chaosHistory: state.chaosHistory,
      judgeFeedback: state.judgeFeedback.map((f: any) => ({
        judgeId: f.judgeId,
        score: f.score,
        comment: f.comment,
        highlight: f.highlight
      })),
      finalScore: finalScoreVal,
      grade: grade,
      archetype: `${archetype.name} (${archetype.subtitle})`,
      scoreBreakdown: {
        innovation: state.score?.innovation || 0,
        execution: state.score?.execution || 0,
        design: state.score?.design || 0,
        pitch: state.score?.pitch || 0
      }
    };

    const prompt = `You are an elite Product Manager, Startup Founder, YC Partner, Technical Architect, and Venture Capital Analyst combined into a single expert.

Your task is to generate a professional Product Requirements Document (PRD) for a hackathon project that has successfully passed evaluation.

IMPORTANT:
This is NOT a generic PRD generator.

The PRD must be deeply personalized using the complete Hackathon Simulator run.

You are given:
1. The original problem statement
2. The selected solution direction
3. The chosen tech stack
4. The USP
5. Feature prioritization decisions
6. Mentor insights
7. Business model
8. Elevator pitch
9. Chaos events encountered
10. Judge feedback
11. Final score
12. Final grade
13. Project archetype
14. Scoring breakdown

Your objective is to transform the player's hackathon submission into a realistic startup product plan.

---

# INPUT DATA

Here is the exact JSON object from the Hackathon Simulator run:

${JSON.stringify(inputData, null, 2)}

Treat every field as important.

---

# CRITICAL REASONING PROCESS

Before writing anything:
1. Understand the startup idea.
2. Infer the real product being built.
3. Understand the target market.
4. Understand the business opportunity.
5. Analyze strengths identified by judges.
6. Analyze weaknesses identified by judges.
7. Analyze feature prioritization choices.
8. Analyze architecture choices.
9. Analyze business viability.
10. Convert the hackathon concept into a real startup roadmap.

Never mention this reasoning process.

---

# PERSONALIZATION RULES

The generated PRD MUST adapt to the actual run.

Examples:

If solutionDirection = AI Solution:
* Include AI workflows
* Include model architecture
* Include prompts, inference, evaluation considerations

If solutionDirection = Marketplace:
* Include buyer flow
* Include seller flow
* Include trust mechanisms
* Include payment flow

If solutionDirection = Mobile App:
* Mobile-first requirements
* Offline considerations
* Push notification strategy

If solutionDirection = IoT Hardware:
* Hardware architecture
* Sensor requirements
* Firmware considerations
* Manufacturing assumptions

If solutionDirection = Service Platform:
* Multi-tenant architecture
* Admin dashboard
* Billing workflows

If USP = Fastest:
* Emphasize speed and simplicity

If USP = Cheapest:
* Emphasize affordability and efficiency

If USP = AI-Powered:
* AI must be central to the product

If USP = Sustainable:
* Sustainability metrics must appear throughout the PRD

---

# TECH STACK USAGE RULE

DO NOT merely list technologies.

For every major technology selected:
Explain:
* Why it was chosen
* What role it plays
* How it contributes to scalability
* How it contributes to product success

The architecture section should feel like it was written by a senior staff engineer.

---

# JUDGE FEEDBACK RULE

Judge feedback must directly influence the PRD.

Example:
If judges praised scalability:
* Expand scaling strategy
If judges criticized overengineering:
* Recommend simplifications
If judges criticized business model:
* Address monetization risks
If judges praised innovation:
* Highlight defensibility

Judge insights should shape the roadmap and risk sections.

---

# CHAOS EVENT RULE

Use chaos events as startup lessons.

Example:
Database crash event:
→ Add reliability requirements
Last-minute pivot:
→ Add product validation requirements
API limitation event:
→ Add vendor dependency mitigation

Chaos events should appear in Risks and Lessons Learned.

---

# ARCHETYPE RULE

Use archetype as founder personality analysis.

Examples:
The Overengineer:
* Recommend tighter MVP focus
The Hustler:
* Recommend stronger technical moat
The Visionary:
* Recommend execution discipline
The Minimalist:
* Recommend strategic feature expansion
The Builder:
* Recommend balanced growth

Use archetype insights in the Final Verdict section.

---

# OUTPUT FORMAT

Return ONLY valid Markdown.

Structure:

# Product Requirements Document

## Product Name

Generate a realistic startup name.

---

## Executive Summary

Include:
* One sentence pitch
* Problem
* Solution
* Opportunity

---

## Problem Statement

Detailed analysis.

---

## Market Opportunity

Include:
* Industry context
* Why now
* Demand drivers

---

## Target Users

### Primary Users

### Secondary Users

### User Personas

Minimum 2 personas.

---

## Product Vision

### Mission

### Long-Term Vision

### Core Value Proposition

---

## MVP Definition

Use ONLY Must-Have features.

For each feature include:
* Goal
* User value
* Acceptance criteria

---

## Phase 2 Roadmap

Use Nice-To-Have features.

---

## Future Expansion

Use Overkill features.

---

## User Journeys

Generate realistic user flows.
Include numbered steps.

---

## Technical Architecture

Include:

### Frontend

### Backend

### Database

### Infrastructure

### AI Systems (if applicable)

### Integrations

### Security Considerations

### Scalability Considerations

---

## Monetization Strategy

Use selected business model.
Include:
* Revenue streams
* Pricing assumptions
* Growth assumptions

---

## Success Metrics

Generate realistic KPIs.
Include:
* Acquisition
* Activation
* Retention
* Revenue
* Engagement

---

## Risk Assessment

Include:

### Technical Risks

### Product Risks

### Business Risks

### Lessons From Hackathon Simulation

---

## Competitive Advantage

Explain:
* USP impact
* Defensibility
* Strategic moat

---

## Execution Roadmap

### Month 1

### Month 3

### Month 6

### Month 12

---

## Investor Snapshot

Include:
* Elevator pitch
* Why this startup matters
* Potential growth narrative

---

## Startup Potential Assessment

Reference:
* Final Score: ${displayScore}/50
* Grade: ${grade}
* Judge Feedback: "${feedback?.comment}"
* Archetype: "${archetype.name}"

Generate:

### Strengths

### Weaknesses

### Biggest Opportunity

### Biggest Risk

### Startup Potential Score (0-100)

### Recommended Next Step

### Final Verdict

Answer:
"Should this project move beyond the hackathon stage?"
Provide a detailed founder-style recommendation.

---

# QUALITY & FORMATTING REQUIREMENTS

The PRD must:
* Feel like it was written by a senior PM at a successful startup.
* Be highly specific to the supplied data.
* Avoid generic filler.
* Avoid buzzword spam.
* Make realistic assumptions.
* Connect all sections logically.
* Read like a real startup planning document.
* Be detailed enough that a small founding team could begin implementation immediately.
* **Strict Markdown Rule**: Ensure all headers use proper markdown tags (# or ## or ###), and all lists use either "* " or "* **Key**: Value" formats to guarantee the frontend custom line-by-line renderer interprets and styles them cleanly. Never use "- " for bullet lists; always use "* ".

Do not explain your reasoning.
Do not mention these instructions.
Return only the final PRD.`;

    let generatedText = "";

    if (openaiKey) {
      // Call OpenAI API completions endpoint (using gpt-4o-mini model)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.35,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API error:", errText);
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else if (openRouterKey) {
      // Call OpenRouter completions endpoint (using Gemini 2.5 Flash model)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "The Hackathon Simulator",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.35,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error:", errText);
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else {
      // Call standard Google Gemini API key endpoint
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2500
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", errText);
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!generatedText || generatedText === "") {
      throw new Error("Empty response received from LLM API");
    }

    // Clean up LLM response from ```markdown wrapper code fences if present
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith("```markdown")) {
      cleanedText = cleanedText.replace(/^```markdown\s*/i, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "");
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.replace(/\s*```$/, "");
    }
    cleanedText = cleanedText.trim();

    return NextResponse.json({ markdown: cleanedText });

  } catch (error: any) {
    console.error("PRD generation error:", error);
    // Secure fallback in case of network drops
    const fallbackMarkdown = generatePRD(state);
    const notice = `> [!WARNING]
> **AI_API_GENERATION_FAILED // FALLBACK ACTIVE:**
> Encountered a network connection error (${error.message || "API Timeout"}). Rerouting document generation to local procedural generator:

\n\n${fallbackMarkdown}`;

    return NextResponse.json({ markdown: notice });
  }
}
