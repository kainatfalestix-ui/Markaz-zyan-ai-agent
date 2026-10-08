import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "system_prompt.md"), "utf8");

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const PORT = process.env.PORT || 3000;
const MAX_TURNS = 20;          // keep only the latest messages
const MAX_CHARS = 1500;        // max length of a single customer message
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*"; // set to your website, e.g. https://example.com

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const app = express();
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

// CORS so the widget can be embedded on your website
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Very simple per-IP rate limit (use a proper limiter such as Redis in production)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15; // 15 messages per minute
}

app.post("/api/chat", async (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment. / الرجاء الانتظار قليلاً." });
  }

  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = incoming
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  // The conversation must start with a user message and end with one
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Invalid conversation." });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    });
    const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Sorry, something went wrong. Please call +966-57-22-34307. / عذراً، حدث خطأ. يرجى الاتصال على +966-57-22-34307",
    });
  }
});

app.listen(PORT, () => console.log(`Zyan Cooling support agent running on http://localhost:${PORT}`));
