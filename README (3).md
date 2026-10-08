# Markaz Zyan Cooling – Website Support Agent

An Arabic-first (English-capable) customer service chat agent for Markaz Zyan Cooling, Jeddah, powered by Claude.

## Files
- `system_prompt.md` – the agent's instructions (role, language, tone, safety, booking number, off-topic rules). Edit this file to change behavior.
- `server.js` – small Node.js backend. Keeps your API key private and calls Claude.
- `public/index.html` – the chat widget (RTL support, floating button, mobile friendly).
- `package.json` – dependencies.

## Run locally
```bash
npm install
export ANTHROPIC_API_KEY="your-key-here"   # from console.anthropic.com
npm start
```
Open http://localhost:3000

## Put it on your website
1. Deploy the server (Render, Railway, Fly.io, a VPS, etc.) and set environment variables:
   - `ANTHROPIC_API_KEY` (required)
   - `ALLOWED_ORIGIN` = your website address, e.g. `https://yoursite.com`
   - `CLAUDE_MODEL` (optional, default `claude-sonnet-5-5`)
2. Copy the `<button id="chat-toggle">`, the `<div id="chat">`, the CSS and the script from `public/index.html` into your site, and set `API_BASE` to your deployed server URL.

## Before going live
- Never put the API key in the HTML/JavaScript. It stays on the server only.
- Replace the in-memory rate limiter in `server.js` with a production one if you expect heavy traffic.
- Test with Arabic and English messages, off-topic questions, and safety cases (burning smell, water near sockets).
- If you want the agent to mention working hours, prices, or warranty, add the real details to `system_prompt.md`. It is currently told not to invent them.
