const mongoose = require("mongoose");

async function connectDatabase(uri) {
  if (!uri) {
    console.warn("MONGODB_URI is not set. Metadata logging is disabled.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed. Continuing without metadata persistence.", error.message);
    return false;
  }
}

module.exports = { connectDatabase };
