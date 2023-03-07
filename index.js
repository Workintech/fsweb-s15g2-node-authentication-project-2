const server = require("./api/server.js");
require("dotenv").config();
const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
  console.log(`${PORT} potu dinleniyor...`);
});
