const express = require("express");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;
const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GRAPH_VERSION = process.env.GRAPH_API_VERSION || "v26.0";

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = Buffer.from(buf);
  }
}));

app.get("/", (req, res) => {
  res.json({
    bot: "AriYa'n Bot V4",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AriYa'n Bot V4"
  });
});

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Verify that webhook requests came from Meta
function verifySignature(req) {
  const signature = req.get("x-hub-signature-256");

  if (!APP_SECRET || !signature || !req.rawBody) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", APP_SECRET)
      .update(req.rawBody)
      .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  return a.length === b.length &&
    crypto.timingSafeEqual(a, b);
}

async function sendMessage(recipientId, text) {
  if (!PAGE_TOKEN) {
    throw new Error("PAGE_ACCESS_TOKEN is missing");
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PAGE_TOKEN}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Messenger API error: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function handleMessage(event) {
  const senderId = event.sender?.id;
  const text = event.message?.text?.trim();

  if (!senderId || !text || event.message?.is_echo) {
    return;
  }

  const command = text.toLowerCase();

  if (command === "!ping") {
    return sendMessage(senderId, "Pong! AriYa'n Bot V4 online.");
  }

  if (command === "!help") {
    return sendMessage(
      senderId,
      "AriYa'n Bot V4\n\n!ping - Bot status\n!help - Commands"
    );
  }

  return sendMessage(
    senderId,
    "AriYa'n Bot V4 চালু আছে। কমান্ড দেখতে !help লিখুন।"
  );
}

app.post("/webhook", (req, res) => {
  if (!verifySignature(req)) {
    return res.sendStatus(401);
  }

  if (req.body?.object !== "page") {
    return res.sendStatus(404);
  }

  // Acknowledge webhook delivery before processing messages.
  res.sendStatus(200);

  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      handleMessage(event).catch(err => {
        console.error("Message handler failed:", err.message);
      });
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AriYa'n Bot V4 listening on port ${PORT}`);
});
