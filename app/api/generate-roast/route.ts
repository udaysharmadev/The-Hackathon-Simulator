/**
 * @fileoverview Next.js API Route for live AI-powered Project Roast / Commentary.
 * Compiles a hilarious, context-aware 2-paragraph + punchline roast utilizing
 * the player's manifest selections and the selected judge's personality.
 *
 * @module app/api/generate-roast/route
 */

import { NextResponse } from "next/server";
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

function cleanAndHumanizeRoast(text: string): string {
  if (!text) return "";

  // 1. Remove em dashes (—) and double-hyphens (--) and replace with simple commas or periods.
  let cleaned = text.replace(/—/g, ", ");
  cleaned = cleaned.replace(/--/g, ", ");

  // 2. Remove emojis entirely (ensure no smiley faces, rockets, fire, etc.)
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0F5}]|[\u{1F900}-\u{1F9FF}]/gu, '');

  // 3. Consistently use straight quotes only (convert curly quotes)
  cleaned = cleaned.replace(/[“”]/g, '"');
  cleaned = cleaned.replace(/[‘’]/g, "'");

  // 4. Eliminate markdown bolding entirely
  cleaned = cleaned.replace(/\*\*/g, '');

  // 5. Clean double spaces and punctuation issues
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/ ,/g, ',');
  cleaned = cleaned.replace(/ \./g, '.');

  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload || !payload.archetype) {
      return NextResponse.json({ error: "Missing game state payload" }, { status: 400 });
    }

    const fileEnv = loadEnvFromFile();
    
    const openaiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || 
                      process.env.NEXT_PUBLIC_OPENAI_API_KEY || fileEnv.NEXT_PUBLIC_OPENAI_API_KEY ||
                      process.env.OPENAI_KEY || fileEnv.OPENAI_KEY;
                      
    const openRouterKey = process.env.OPENROUTER_API_KEY || fileEnv.OPENROUTER_API_KEY || 
                          process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || fileEnv.NEXT_PUBLIC_OPENROUTER_API_KEY;
                          
    const geminiKey = process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || 
                      process.env.NEXT_PUBLIC_GEMINI_API_KEY || fileEnv.NEXT_PUBLIC_GEMINI_API_KEY;

    // Direct mock procedural fallback if no API keys are configured
    if (!openaiKey && !openRouterKey && !geminiKey) {
      return NextResponse.json({
        roast: `[DEMO MODE: CONFIGURE AN OPENAI_API_KEY IN .env.local TO UNLOCK LIVE AI ROASTING]\n\nYour project classification is "${payload.archetype}". You attempted to solve this challenge using a stack of ${payload.techStack?.join(", ") || "raw code"} with a business model of "${payload.businessModel || "charity"}" and the USP "${payload.usp || "None"}". While the concept has ambition, the jury believes your implementation could benefit from tighter loop validations.`,
        fallbackUsed: true
      });
    }

    const systemPrompt = `You are a savage, witty, and elite startup hackathon judge reviewing a project manifest.
Write a customized, funny, and brutally honest 2-paragraph roast of the player's project with a funny 1-liner at the end.
Use first-person ("I"). Have actual opinions. Vary sentence rhythm: mix short punchy thoughts with longer, winding reactions. Let some human mess in.

JUDGE VOICES (match selected):
1. Uday Sharma (EdTech Creator & Hackathon Specialist): Brutally practical. Values shipping fast, execution speed, MVPs, and EdTech utility. Hates complex, bloat architecture. Ask: "Would real users actually use this?"
2. Nishika (Corporate Product Designer / UI-UX Specialist): Evaluates through visual design and UX. Focuses on visual polish, simplicity, accessibility, frictionless onboarding. Hates confusing user flows and poor UX.
3. Jitu (Professor & Academic Mentor): Strict engineering fundamentals. Focuses on system architecture, database design, technical feasibility, code structure. Hates hype and unjustified technology.
4. Bart (Startup Founder): PMF and customer discovery. Focuses on customer pain points, target market opportunity, and venture scalability. Hates neat tech built with no actual buyer value.
5. Sejal (Business Analyst): Strategic business viability. Evaluates monetization, pricing models, SaaS economics, market demand, scalability risks. Hates ideas with no clear path to profitability.

CRITICAL ANTI-AI WRITING RULES:
1. NEVER use em-dashes (— or --); use commas or periods. No emojis. No bold text. Use straight quotes only.
2. No sycophancy, compliments, or filler phrases. Avoid chatbot artifacts like "I hope this helps".
3. Avoid AI slang: "delve", "realm", "landscape", "testament", "intricate", "moreover", "furthermore", "additionally", "robust", "seamless", "groundbreaking", "ever-evolving", "foster", "pivotal moment", "serves/stands as", "reflecting", "symbolizing". Use plain words ("also", "is", "and").
4. No rule of three (e.g. "speed, scale, and simplicity"), no false ranges, and no generic positive endings.
5. Make sure the critique is deeply specific to their exact tech stack, problem, features, USP, and business model. Give a raw, human, reactive opinion.`;

    const userPrompt = `PROJECT MANIFEST:
- Problem: "${payload.problemStatement}"
- Solution Direction: "${payload.solutionDirection}"
- Selected Tech Stack: ${JSON.stringify(payload.techStack)}
- USP: "${payload.usp}"
- Business Model: "${payload.businessModel}"
- Must-Have Features: ${JSON.stringify(payload.mustHaveFeatures)}
- Selected Judge: "${payload.judge}"
- Judge Personality: "${payload.judgePersonality}"
- Project Archetype: "${payload.archetype}"
- Score: ${payload.score}/100
- Grade: "${payload.grade}"`;

    let generatedText = "";

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI Roast API error:", errText);
        throw new Error(`OpenAI Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else if (openRouterKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "The Hackathon Simulator",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter Roast API error:", errText);
        throw new Error(`OpenRouter Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      // Direct call to Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\nHere is the manifest to review:\n${userPrompt}` }]
          }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini Roast API error:", errText);
        throw new Error(`Gemini Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    return NextResponse.json({ roast: cleanAndHumanizeRoast(generatedText) });
  } catch (err: any) {
    console.error("Roast API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate AI roast" }, { status: 500 });
  }
}
