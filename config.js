
module.exports = {
  name: "AriYa'n Bot V4",
  version: "4.0.0",
  author: "ariYa'n bb'z 🚩",
  prefix: "!",
  adminUIDs: (process.env.ADMIN_UIDS || "")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean)
};
           
