const VOLUME_LABELS = {
  "0-1000": "Up to 1,000",
  "1001-5000": "1,001 – 5,000",
  "5001-10000": "5,001 – 10,000",
  "10001-20000": "10,001 – 20,000",
  "20000+": "20,000+",
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeMrkdwn(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSlackPayload(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phoneRaw = String(payload.phone || "").trim().replace(/\D/g, "");
  const website = String(payload.website || "").trim();
  const volume = String(payload.volume || "").trim();
  const couriers = Array.isArray(payload.couriers)
    ? payload.couriers.map((c) => String(c).trim()).filter(Boolean)
    : [];

  const phone = phoneRaw ? `+880${phoneRaw}` : "—";
  const volumeLabel = VOLUME_LABELS[volume] || volume || "—";
  const courierText = couriers.length ? couriers.join(", ") : "—";
  const websiteLink =
    /^https?:\/\//i.test(website) || website.startsWith("http")
      ? website
      : website
        ? `https://${website}`
        : "";
  const when = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const websiteMrkdwn = websiteLink
    ? `<${websiteLink}|${escapeMrkdwn(website)}>`
    : escapeMrkdwn(website || "—");

  return {
    text: `New Wacord demo booking from ${name || "someone"}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "New Wacord Demo Booking",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${escapeMrkdwn(name || "Unknown")}* just booked a meeting from the website.`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Full name*\n${escapeMrkdwn(name || "—")}`,
          },
          {
            type: "mrkdwn",
            text: `*Email*\n<mailto:${escapeMrkdwn(email)}|${escapeMrkdwn(email || "—")}>`,
          },
          {
            type: "mrkdwn",
            text: `*Phone*\n${escapeMrkdwn(phone)}`,
          },
          {
            type: "mrkdwn",
            text: `*Monthly order volume*\n${escapeMrkdwn(volumeLabel)}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Website / Facebook*\n${websiteMrkdwn}`,
          },
          {
            type: "mrkdwn",
            text: `*Couriers*\n${escapeMrkdwn(courierText)}`,
          },
        ],
      },
      { type: "divider" },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Wacord Book Meeting form  •  ${when} (Asia/Dhaka)`,
          },
        ],
      },
    ],
  };
}

function validatePayload(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const website = String(payload.website || "").trim();
  const volume = String(payload.volume || "").trim();
  const couriers = Array.isArray(payload.couriers) ? payload.couriers : [];

  if (!name || !email || !phone || !website || !volume || !couriers.length) {
    return "Missing required fields.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email address.";
  }
  return null;
}

export async function POST(request) {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) {
      console.error("SLACK_WEBHOOK_URL is not configured");
      return json(500, { ok: false, error: "Booking service is not configured." });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body." });
    }

    const error = validatePayload(payload || {});
    if (error) return json(400, { ok: false, error });

    const slackBody = buildSlackPayload(payload);
    const slackRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackBody),
    });

    if (!slackRes.ok) {
      const detail = await slackRes.text().catch(() => "");
      console.error("Slack webhook failed", slackRes.status, detail);
      return json(502, { ok: false, error: "Could not send booking to Slack." });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error("book-meeting error", err);
    return json(500, { ok: false, error: "Unexpected server error." });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
