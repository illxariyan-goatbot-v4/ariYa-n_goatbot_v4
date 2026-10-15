
module.exports = {
  config: {
    name: "uptime",
    version: "1.0.0",
    author: "ariYa'n bb'z 🚩",
    description: "Show core uptime",
    role: 0
  },

  async run({ reply, uptime }) {
    const total = uptime();
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    await reply(
      `⏱️ AriYa'n Bot V4\n` +
      `Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`
    );
  }
};
