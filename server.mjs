/**
 * Local preview server: static files + /api/book-meeting
 * Usage: node server.mjs
 * Loads SLACK_WEBHOOK_URL from .env.local / .env
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5500);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".map": "application/json",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

async function handleBookMeeting(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const request = new Request("http://localhost/api/book-meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw || "{}",
  });

  const mod = await import(
    pathToFileURL(path.join(ROOT, "api/book-meeting.js")).href + "?t=" + Date.now()
  );
  const response = await mod.POST(request);
  const buf = Buffer.from(await response.arrayBuffer());
  const headers = Object.fromEntries(response.headers.entries());
  send(res, response.status, buf, headers);
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/book-meeting") {
      if (req.method === "OPTIONS") {
        return send(res, 204, "", {
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
      }
      if (req.method !== "POST") {
        return send(res, 405, JSON.stringify({ ok: false, error: "Method not allowed" }), {
          "Content-Type": "application/json",
        });
      }
      return await handleBookMeeting(req, res);
    }

    let filePath = safeJoin(ROOT, url.pathname === "/" ? "/index.html" : url.pathname);
    if (!filePath) return send(res, 400, "Bad path");

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return send(res, 404, "Not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    send(res, 200, fs.readFileSync(filePath), { "Content-Type": type });
  } catch (err) {
    console.error(err);
    send(res, 500, "Server error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const hasWebhook = Boolean(process.env.SLACK_WEBHOOK_URL);
  console.log(`Wacord local server → http://localhost:${PORT}`);
  console.log(`Slack webhook configured: ${hasWebhook ? "yes" : "NO (.env.local missing)"}`);
});
