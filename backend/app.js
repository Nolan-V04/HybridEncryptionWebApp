require("dotenv").config();

const cors = require("cors");
const express = require("express");

const { connectDatabase } = require("./config/db");
const cryptoRoutes = require("./routes/cryptoRoutes");

const PORT = Number(process.env.PORT || 5000);

function createApp() {
  const app = express();

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

  return app;
}

async function startServer() {
  await connectDatabase(process.env.MONGODB_URI);
  const app = createApp();

  return app.listen(PORT, () => {
    console.log(`Hybrid encryption API listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
};
