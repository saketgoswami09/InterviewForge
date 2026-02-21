require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n  Interview Chatbot Backend");
  console.log("─────────────────────────────────");
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(`  API base:          http://localhost:${PORT}/api/interview`);
  console.log(`   Environment:       ${process.env.NODE_ENV || "development"}`);
  console.log("─────────────────────────────────\n");
});
