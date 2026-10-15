
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const config = require("./config");

const commands = new Map();
const commandsDir = path.join(__dirname, "commands");
const startedAt = Date.now();

function loadCommands() {
  commands.clear();
  fs.mkdirSync(commandsDir, { recursive: true });

  for (const file of fs.readdirSync(commandsDir)) {
    if (!file.endsWith(".js")) continue;

    const fullPath = path.join(commandsDir, file);

    try {
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);

      if (
        !command.config?.name ||
        typeof command.run !== "function"
      ) {
        console.warn(`[V4] Invalid command skipped: ${file}`);
        continue;
      }

      commands.set(
        command.config.name.toLowerCase(),
        command
      );

      console.log(`[V4] Loaded: ${command.config.name}`);
    } catch (error) {
      console.error(`[V4] Failed to load ${file}:`, error.message);
    }
  }

  console.log(`[V4] ${commands.size} command(s) loaded.`);
}

// Adapter-independent message handler.
// A future supported chat adapter can call this function.
async function handleMessage({ senderID, body, reply, event = {} }) {
  if (typeof body !== "string" || !body.startsWith(config.prefix)) {
    return;
  }

  const input = body.slice(config.prefix.length).trim();
  if (!input) return;

  const [name, ...args] = input.split(/\s+/);
  const command = commands.get(name.toLowerCase());

  if (!command) {
    return reply(`Unknown command: ${name}`);
  }

  const role = Number(command.config.role || 0);
  const isAdmin = config.adminUIDs.includes(String(senderID));

  if (role > 0 && !isAdmin) {
    return reply("এই কমান্ডটি শুধু Admin ব্যবহার করতে পারবে।");
  }

  try {
    await command.run({
      args,
      reply,
      event,
      config,
      commands,
      uptime: () => Math.floor((Date.now() - startedAt) / 1000)
    });
  } catch (error) {
    console.error(`[V4] Command ${name} failed:`, error);
    await reply("কমান্ড চালাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।");
  }
}

function startHealthServer() {
  const port = Number(process.env.PORT || 3000);

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        ok: true,
        bot: config.name,
        version: config.version,
        commands: commands.size,
        uptime: Math.floor((Date.now() - startedAt) / 1000)
      }));
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[V4] Health server listening on ${port}`);
  });

  server.on("error", error => {
    console.error("[V4] Health server error:", error.message);
  });
}

loadCommands();
startHealthServer();

console.log(`[V4] ${config.name} core started.`);

module.exports = {
  config,
  commands,
  loadCommands,
  handleMessage
};

