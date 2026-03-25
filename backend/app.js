require("dotenv").config();

const cors = require("cors");
const express = require("express");

const { connectDatabase } = require("./config/db");
const cryptoRoutes = require("./routes/cryptoRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", cryptoRoutes);

app.use((error, req, res, next) => {
  if (error && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Uploaded file exceeds 100MB limit" });
  }

  return res.status(500).json({ message: "Unexpected server error" });
});

async function startServer() {
  await connectDatabase(process.env.MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`Hybrid encryption API listening on port ${PORT}`);
  });
}

startServer();
