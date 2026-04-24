/**
 * Database Management Utility
 * Usage: node scripts/db-tools.js <command>
 * 
 * Commands:
 *   clear       - Clear all collections
 *   seed        - Seed sample data
 *   stats       - Show database statistics
 *   export      - Export database to JSON
 *   import      - Import from JSON
 *   reset       - Full reset (clear + seed)
 */

const fs = require("fs");
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
const command = process.argv[2] || "help";

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

async function clearCollections() {
  try {
    console.log("🧹 Clearing all collections...");
    await Promise.all([
      StoredKey.deleteMany({}),
      LogRecord.deleteMany({}),
      FileRecord.deleteMany({}),
    ]);
    console.log("✅ Collections cleared\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function seedData() {
  try {
    console.log("🌱 Seeding sample data...\n");

    const samplePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX2BTLS39R3wvUL4x
7Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y
9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y
9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9Z5K0Y8Y9ZwIDAQAB
-----END PUBLIC KEY-----`;

    const fingerprint = crypto.createHash("sha256").update(samplePublicKey).digest("hex");

    // Create key
    const key = await StoredKey.create({
      keyName: "Sample Test Key",
      keyType: "rsa-2048",
      publicKey: samplePublicKey,
      fingerprint,
      description: "Sample key for testing",
      tags: ["test"],
      isActive: true,
    });
    console.log("✅ Created test key");

    // Create logs
    const logs = [
      {
        action: "encrypt",
        status: "success",
        message: "Encrypted document.pdf",
        filename: "document.pdf",
        fileSize: 125000,
        keyFingerprint: fingerprint,
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
    ];

    const now = new Date();
    const logsWithTs = logs.map((l, i) => ({
      ...l,
      timestamp: new Date(now.getTime() - i * 3600000),
    }));

    await LogRecord.insertMany(logsWithTs);
    console.log("✅ Created sample logs");

    // Create files
    await FileRecord.insertMany([
      { filename: "document.pdf", size: 125000 },
      { filename: "image.jpg", size: 2560000 },
    ]);
    console.log("✅ Created sample files\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function displayStats() {
  try {
    console.log("📊 Database Statistics:\n");

    const [keysCount, logsCount, filesCount] = await Promise.all([
      StoredKey.countDocuments(),
      LogRecord.countDocuments(),
      FileRecord.countDocuments(),
    ]);

    const [successLogs, failureLogs] = await Promise.all([
      LogRecord.countDocuments({ status: "success" }),
      LogRecord.countDocuments({ status: "failure" }),
    ]);

    const bytesResult = await FileRecord.aggregate([
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]);

    console.log("Collections:");
    console.log(`  📚 StoredKey: ${keysCount}`);
    console.log(`  📋 LogRecord: ${logsCount} (✅${successLogs} ❌${failureLogs})`);
    console.log(`  📁 FileRecord: ${filesCount}`);
    console.log(`  📦 Total size: ${formatBytes(bytesResult[0]?.total || 0)}\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function exportData() {
  try {
    console.log("💾 Exporting data...");

    const exportDir = path.join(__dirname, "..", "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const [keys, logs, files] = await Promise.all([
      StoredKey.find({}).lean(),
      LogRecord.find({}).lean(),
      FileRecord.find({}).lean(),
    ]);

    const data = { keys, logs, files, exportedAt: new Date() };
    const filename = path.join(exportDir, `export-${Date.now()}.json`);

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ Exported to: ${filename}\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function importData() {
  try {
    const filename = process.argv[3];
    if (!filename) {
      console.error("❌ Usage: db-tools.js import <filename>");
      return;
    }

    const filepath = path.resolve(filename);
    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      return;
    }

    console.log("📥 Importing data...");
    const data = JSON.parse(fs.readFileSync(filepath, "utf8"));

    await clearCollections();

    if (data.keys?.length) {
      await StoredKey.insertMany(data.keys);
      console.log(`✅ Imported ${data.keys.length} keys`);
    }

    if (data.logs?.length) {
      await LogRecord.insertMany(data.logs);
      console.log(`✅ Imported ${data.logs.length} logs`);
    }

    if (data.files?.length) {
      await FileRecord.insertMany(data.files);
      console.log(`✅ Imported ${data.files.length} files`);
    }

    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function showHelp() {
  console.log("\n📋 Database Tools - Available Commands:\n");
  console.log("  clear   - Clear all collections");
  console.log("  seed    - Seed sample data");
  console.log("  stats   - Show database statistics");
  console.log("  export  - Export data to JSON");
  console.log("  import  - Import from JSON file");
  console.log("  reset   - Clear + seed (full reset)");
  console.log("  help    - Show this help message\n");
  console.log("Usage: node scripts/db-tools.js <command>\n");
}

async function main() {
  const connected = await connectDatabase();
  if (!connected) process.exit(1);

  try {
    switch (command) {
      case "clear":
        await clearCollections();
        break;
      case "seed":
        await seedData();
        break;
      case "stats":
        await displayStats();
        break;
      case "export":
        await exportData();
        break;
      case "import":
        await importData();
        break;
      case "reset":
        await clearCollections();
        await seedData();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

main();
