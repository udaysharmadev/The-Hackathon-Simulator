/**
 * @fileoverview Next.js API Route for live AI-powered Project Roast / Commentary.
 * Compiles a hilarious, context-aware 2-paragraph + punchline roast utilizing
 * the player's manifest selections and the selected judge's personality.
 * Includes a premium, lightning-fast local procedural generator fallback.
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

/**
 * Generates an instant, highly-customized contextual roast per judge style.
 */
function generateLocalRoast(payload: any): string {
  const judge = payload.judge || "Lead Judge";
  const tech = payload.techStack?.join(", ") || "various library layers";
  const model = payload.businessModel || "no monetization structure";
  const usp = payload.usp || "offering standard functionality";
  const arch = payload.archetype || "Prototype Build";
  const score = payload.score || 72;

  if (judge.includes("Uday")) {
    return `So you decided to build a project classified as "${arch}" using a stack of ${tech}. I mean, sure, the concept of addressing "${payload.solutionDirection || "this problem"}" has some utility, but let's be real: putting together a business model of "${model}" and calling "${usp}" your unique advantage feels like a classic hackathon hallucination. Did you build a product for real users, or just an elaborate collection of config files?

You skipped pruning your features and ended up with a scope bloat that could sink a venture-backed startup. The execution is interesting, but I highly doubt anyone outside this room will ever install it. Next time, focus less on stacking tech and more on showing actual value in the first 5 seconds.

Punchline: It's an MVP, but the 'V' stands for barely Viable.`;
  }
  
  if (judge.includes("Nishika")) {
    return `Looking at this "${arch}" prototype, my eyes are slightly watering. You decided to implement features like ${payload.mustHaveFeatures?.slice(0, 2).join(" and ") || "complex dashboards"} with a stack of ${tech}. It is technically a functioning piece of software, but from a product design and user onboarding perspective, it's a labyrinth of friction. The UX flow feels less like a product and more like a logic puzzle designed to keep users out.

Also, declaring "${usp}" as your primary USP while backing it with a business model of "${model}" is bold. It's a classic case of engineering-driven design where the interface is just an afterthought of database tables.

Punchline: I've seen command-line utilities with more user-friendly onboarding paths.`;
  }

  if (judge.includes("Jitu")) {
    return `From a strict software engineering standpoint, this project classified as "${arch}" has some structural integrity issues. Stacking ${tech} to solve "${payload.solutionDirection || "the problem"}" is like building a skyscraper with wooden toothpicks. The database schema boundaries feel highly speculative, and the integration of features like ${payload.mustHaveFeatures?.slice(0, 2).join(" and ") || "real-time logs"} seems more like copy-pasted boilerplate than solid engineering.

Your business model of "${model}" is theoretically viable, but the technical feasibility of scaling this architecture with your chosen USP is highly suspect. We need robust systems, not fragile prototypes held together by hot-reloading scripts.

Punchline: The codebase looks like a stack overflow search history brought to life.`;
  }

  if (judge.includes("Bart")) {
    return `Let's talk customer discovery. You want to solve the problem of "${payload.problemStatement || "this market gap"}" with a business model of "${model}". Okay, but who is actually paying for this? You claim "${usp}" is your unique advantage, but I've interviewed hundreds of founders, and I can tell you that customers don't buy USPs, they buy solutions to hair-on-fire problems. Your product, a "${arch}" built on ${tech}, is a solution looking for a problem.

The feature prioritization is a wishlist of developer fantasies rather than user pain points. You're building a spaceship when a bicycle would do. Go talk to ten real customers before you write another line of code.

Punchline: A great engineering exercise, but a highly challenging business prospect.`;
  }

  if (judge.includes("Sejal")) {
    return `Evaluating the financial viability of this "${arch}" reveals some classic startup economic fallacies. A business model of "${model}" with a USP of "${usp}" creates an extremely fragile path to profitability. Stacking high-overhead technologies like ${tech} means your operational expenses will outpace your customer lifetime value before you even finish onboarding.

Your execution score of ${score}/100 shows some dev capabilities, but the unit economics just do not check out. Unless you have a secret pool of unlimited venture capital, this pricing and scoping strategy will bleed cash within a month.

Punchline: Your burn rate will be the only thing scaling exponentially.`;
  }

  // Fallback generic roast
  return `So you built a "${arch}" using ${tech} to address the problem of "${payload.problemStatement || "this sector"}". With a business model of "${model}" and a USP of "${usp}", the concept has some high-level ambition, but the execution quality suffers from significant scope bloat. The jury believes the implementation could benefit from a much tighter validation loop and more focused product design.

Punchline: It works on my machine, but it might not work in the market.`;
}

/**
 * Fetch wrapper with strict timeout support.
 */
async function fetchWithTimeout(url: string, options: any, timeoutMs = 2200): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
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

    // Generate local fallback roast immediately as safety backup
    const localRoastText = generateLocalRoast(payload);

    // Skip external fetch if key is a known fake placeholder or entirely missing
    const isMockOpenaiKey = !openaiKey || openaiKey.includes("YOUR_KEY") || openaiKey.includes("placeholder") || openaiKey === "your-api-key" || openaiKey.length < 20;
    if (isMockOpenaiKey && !openRouterKey && !geminiKey) {
      return NextResponse.json({ roast: localRoastText, fallbackUsed: true });
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

    try {
      if (openaiKey && !isMockOpenaiKey) {
        const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
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
            temperature: 0.85,
            max_tokens: 300
          })
        }, 2200);

        if (!response.ok) {
          throw new Error(`OpenAI responded with status ${response.status}`);
        }

        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content || "";
      } else if (openRouterKey) {
        const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
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
            temperature: 0.85,
            max_tokens: 300
          })
        }, 2200);

        if (!response.ok) {
          throw new Error(`OpenRouter responded with status ${response.status}`);
        }

        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content || "";
      } else if (geminiKey) {
        const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nHere is the manifest to review:\n${userPrompt}` }]
            }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 300 }
          })
        }, 2200);

        if (!response.ok) {
          throw new Error(`Gemini responded with status ${response.status}`);
        }

        const data = await response.json();
        generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      if (!generatedText) {
        throw new Error("Empty content received from LLM API.");
      }

      return NextResponse.json({ roast: cleanAndHumanizeRoast(generatedText) });
    } catch (apiErr) {
      console.warn("External AI call failed or timed out. Falling back to local roast:", apiErr);
      return NextResponse.json({ roast: localRoastText, fallbackUsed: true });
    }
  } catch (err: any) {
    console.error("Critical Roast API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate AI roast" }, { status: 500 });
  }
}
