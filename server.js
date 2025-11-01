import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve your static React build or public files
app.use(express.static(join(__dirname, "public")));

// ✅ Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Fallback route (for React Router)
app.get(/.*/, (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.listen(3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);
