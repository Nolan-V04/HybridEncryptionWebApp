/**
 * Database Initialization Script
 * 
 * Usage: node scripts/init-db.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates indexes
 * 3. Seeds sample data for testing
 * 4. Displays database stats
 */

const path = require("path");

function requireWithBackendFallback(packageName) {
  try {
    return require(packageName);
  } catch {
    return require(path.resolve(__dirname, "../backend/node_modules", packageName));
  }
}

const dotenv = requireWithBackendFallback("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const mongoose = requireWithBackendFallback("mongoose");
const StoredKey = require("../backend/models/StoredKey");
const LogRecord = require("../backend/models/LogRecord");
const FileRecord = require("../backend/models/FileRecord");
const crypto = require("crypto");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hybrid-encryption";

async function connectDatabase() {
  try {
    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully\n");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

async function clearCollections() {
  try {
    console.log("🧹 Clearing existing collections...");
    await Promise.all([
      StoredKey.deleteMany({}),
      LogRecord.deleteMany({}),
      FileRecord.deleteMany({}),
    ]);
    console.log("✅ Collections cleared\n");
  } catch (error) {
    console.error("❌ Failed to clear collections:", error.message);
  }
}

async function createIndexes() {
  try {
    console.log("📑 Creating indexes...");
    
    // StoredKey indexes
    await StoredKey.collection.createIndex({ fingerprint: 1 }, { unique: true });
    await StoredKey.collection.createIndex({ isActive: 1 });
    await StoredKey.collection.createIndex({ created_at: -1 });
    
    // LogRecord indexes
    await LogRecord.collection.createIndex({ timestamp: -1 });
    await LogRecord.collection.createIndex({ action: 1, status: 1 });
    
    // FileRecord indexes
    await FileRecord.collection.createIndex({ created_at: -1 });
    
    console.log("✅ Indexes created\n");
  } catch (error) {
    console.error("⚠️  Index creation warning:", error.message);
  }
}

async function seedSampleData() {
  try {
    console.log("🌱 Seeding sample data...\n");

    // Create sample RSA key pair (for testing only)
    const samplePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX2BTLS39R3wvUL4x
7Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y
9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y
9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9ZwIDAQAB
-----END PUBLIC KEY-----`;

    const fingerprint1 = crypto.createHash("sha256").update(samplePublicKey).digest("hex");

    // Sample Key 1
    await StoredKey.create({
      keyName: "Sample Test Key 1",
      keyType: "rsa-2048",
      publicKey: samplePublicKey,
      fingerprint: fingerprint1,
      description: "Sample key for testing",
      tags: ["test", "sample"],
      isActive: true,
    });
    console.log("✅ Created sample key 1");

    // Sample Key 2
    const samplePublicKey2 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3Z4sY3FTMT41S4xwVL5y
8a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z
9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z
9a6L1z9a6L1z9a6L1z9a6L1z9a6L1z9awIDAQAB
-----END PUBLIC KEY-----`;

    const fingerprint2 = crypto.createHash("sha256").update(samplePublicKey2).digest("hex");

    await StoredKey.create({
      keyName: "Sample Test Key 2",
      keyType: "rsa-2048",
      publicKey: samplePublicKey2,
      fingerprint: fingerprint2,
      description: "Another test key",
      tags: ["test"],
      isActive: true,
    });
    console.log("✅ Created sample key 2");

    // Sample Log Records
    const logEntries = [
      {
        action: "encrypt",
        status: "success",
        message: "Encrypted document.pdf",
        filename: "document.pdf",
        fileSize: 125000,
        keyFingerprint: fingerprint1,
        duration: 245,
      },
      {
        action: "decrypt",
        status: "success",
        message: "Decrypted document.pdf",
        filename: "document.pdf",
        fileSize: 125000,
        duration: 198,
      },
      {
        action: "encrypt",
        status: "success",
        message: "Encrypted image.jpg",
        filename: "image.jpg",
        fileSize: 2560000,
        keyFingerprint: fingerprint2,
        duration: 1200,
      },
      {
        action: "decrypt",
        status: "failure",
        message: "Decryption failed",
        filename: "corrupted.hybrid",
        fileSize: 0,
        duration: 50,
        errorDetails: "Invalid .hybrid payload format",
      },
      {
        action: "encrypt",
        status: "success",
        message: "Encrypted spreadsheet.xlsx",
        filename: "spreadsheet.xlsx",
        fileSize: 512000,
        keyFingerprint: fingerprint1,
        duration: 340,
      },
    ];

    const now = new Date();
    const logsWithTimestamp = logEntries.map((entry, idx) => ({
      ...entry,
      timestamp: new Date(now.getTime() - idx * 3600000), // Spread over hours
    }));

    await LogRecord.insertMany(logsWithTimestamp);
    console.log(`✅ Created ${logEntries.length} sample log records`);

    // Sample File Records
    const fileEntries = [
      { filename: "document.pdf", size: 125000 },
      { filename: "image.jpg", size: 2560000 },
      { filename: "spreadsheet.xlsx", size: 512000 },
      { filename: "video.mp4", size: 50000000 },
      { filename: "archive.zip", size: 25000000 },
    ];

    await FileRecord.insertMany(
      fileEntries.map(f => ({
        filename: f.filename,
        size: f.size,
      }))
    );
    console.log(`✅ Created ${fileEntries.length} sample file records\n`);
  } catch (error) {
    console.error("❌ Failed to seed data:", error.message);
  }
}

async function displayStats() {
  try {
    console.log("📊 Database Statistics:");
    console.log("─".repeat(50));

    const keysCount = await StoredKey.countDocuments();
    const logsCount = await LogRecord.countDocuments();
    const filesCount = await FileRecord.countDocuments();

    const successLogs = await LogRecord.countDocuments({ status: "success" });
    const failureLogs = await LogRecord.countDocuments({ status: "failure" });

    const totalBytes = await LogRecord.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]);

    console.log(`🔐 Stored Keys: ${keysCount}`);
    console.log(`📋 Log Records: ${logsCount}`);
    console.log(`   ├─ Success: ${successLogs}`);
    console.log(`   └─ Failed: ${failureLogs}`);
    console.log(`📁 File Records: ${filesCount}`);
    console.log(`📦 Total Data Processed: ${formatBytes(totalBytes[0]?.total || 0)}`);
    console.log("─".repeat(50));
    console.log("\n✨ Database initialized successfully!\n");
  } catch (error) {
    console.error("❌ Failed to display stats:", error.message);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function main() {
  try {
    console.log("🚀 Hybrid Encryption - Database Initialization\n");
    console.log("═".repeat(50) + "\n");

    await connectDatabase();
    await clearCollections();
    await createIndexes();
    await seedSampleData();
    await displayStats();

    console.log("📌 Next steps:");
    console.log("   1. Start backend: npm run dev");
    console.log("   2. Start frontend: npm run dev (in another terminal)");
    console.log("   3. Navigate to http://localhost:5173");
    console.log("");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
}

main();
