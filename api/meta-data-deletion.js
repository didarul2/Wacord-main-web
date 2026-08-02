/**
 * Meta Data Deletion Request Callback
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 *
 * Meta POSTs application/x-www-form-urlencoded with `signed_request`.
 * Response must be JSON: { url, confirmation_code }
 *
 * Env: META_APP_SECRET (required to verify signatures in production)
 * Optional: PUBLIC_SITE_URL (default https://wacord.com)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "..", ".data", "meta-deletion-requests.json");

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function siteBase() {
  return String(process.env.PUBLIC_SITE_URL || "https://wacord.com").replace(/\/$/, "");
}

function b64UrlDecode(input) {
  const str = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str + pad, "base64");
}

function parseSignedRequest(signedRequest, appSecret) {
  if (!signedRequest || !appSecret) return null;
  const parts = String(signedRequest).split(".", 2);
  if (parts.length !== 2) return null;
  const [encodedSig, payload] = parts;
  const sig = b64UrlDecode(encodedSig);
  const expected = crypto.createHmac("sha256", appSecret).update(payload).digest();
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) {
    return null;
  }
  try {
    return JSON.parse(b64UrlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }
}

function makeConfirmationCode(userId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}:${stamp}:${crypto.randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `WAC-${hash}${stamp.slice(-4)}`;
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8") || "{}");
  } catch {
    return {};
  }
}

function writeStore(data) {
  const dir = path.dirname(STORE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function recordRequest(code, userId) {
  const store = readStore();
  store[code] = {
    user_id: userId,
    status: "received",
    created_at: new Date().toISOString(),
  };
  writeStore(store);
}

async function parseBody(request) {
  const ctype = request.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    return await request.json();
  }
  const text = await request.text();
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
  // Meta typically sends form-urlencoded; also accept raw signed_request=
  if (text.includes("signed_request=")) {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { raw: text };
  }
}

export async function POST(request) {
  try {
    const body = await parseBody(request);
    const signedRequest = body.signed_request || body.signedRequest;
    const appSecret = process.env.META_APP_SECRET || "";

    let userId = null;
    if (appSecret && signedRequest) {
      const data = parseSignedRequest(signedRequest, appSecret);
      if (!data || !data.user_id) {
        return json(403, { error: "Invalid signed_request" });
      }
      userId = String(data.user_id);
    } else if (signedRequest && !appSecret) {
      // Allow logging in staging without secret, but do not trust user_id
      userId = "unverified";
    } else {
      return json(400, { error: "Missing signed_request" });
    }

    const confirmationCode = makeConfirmationCode(userId);
    try {
      recordRequest(confirmationCode, userId);
    } catch (err) {
      console.error("meta-data-deletion store error", err);
      // Still return Meta-required shape even if local store fails
    }

    // Initiate deletion asynchronously in production backends.
    // This website callback acknowledges Meta and exposes a status URL.
    console.log(
      JSON.stringify({
        event: "meta_data_deletion_request",
        user_id: userId,
        confirmation_code: confirmationCode,
        at: new Date().toISOString(),
      })
    );

    return json(200, {
      url: `${siteBase()}/data-deletion.html?code=${encodeURIComponent(confirmationCode)}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error(err);
    return json(500, { error: "Internal server error" });
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") || "").trim();
  if (!code) {
    return json(200, {
      ok: true,
      message:
        "Meta Data Deletion callback. POST signed_request from Meta. Status UI: /data-deletion.html",
    });
  }
  const store = readStore();
  const row = store[code];
  if (!row) {
    return json(404, {
      ok: false,
      confirmation_code: code,
      status: "unknown",
      message: "Code not found. Contact Support with your code.",
    });
  }
  return json(200, {
    ok: true,
    confirmation_code: code,
    status: row.status || "received",
    created_at: row.created_at,
  });
}
