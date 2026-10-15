
module.exports = {
  config: {
    name: "help",
    version: "1.0.0",
    author: "ariYa'n bb'z 🚩",
    description: "Show available commands",
    role: 0
  },

  async run({ reply, commands, config }) {
    const list = [...commands.values()]
      .map(command => {
        const name = command.config.name;
        const description = command.config.description || "No description";
        return `${config.prefix}${name} - ${description}`;
      })
      .sort();

    await reply(
      `🤖 ${config.name}\n` +
      `Version: ${config.version}\n\n` +
      (list.join("\n") || "কোনো কমান্ড পাওয়া যায়নি।")
    );
  }
};
  
