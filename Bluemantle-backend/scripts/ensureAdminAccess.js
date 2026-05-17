require("dotenv").config();

const crypto = require("crypto");
const dns = require("dns");
const mongoose = require("mongoose");
const User = require("../models/user");
const { hashPassword } = require("../utils/hashPassword");

const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

dns.setServers(dnsServers);

const generatedSecondaryPassword = `${crypto.randomBytes(12).toString("base64url")}A1!`;

const admins = [
  {
    signInId: process.env.PRIMARY_ADMIN_ID || "admin_master",
    name: process.env.PRIMARY_ADMIN_NAME || "Master Admin",
    email: process.env.PRIMARY_ADMIN_EMAIL || "admin@bluemantle.com",
    password: process.env.PRIMARY_ADMIN_PASSWORD || "BlueMantleAdmin2026!",
  },
  {
    signInId: process.env.SECONDARY_ADMIN_ID || "admin_ops",
    name: process.env.SECONDARY_ADMIN_NAME || "Operations Admin",
    email: process.env.SECONDARY_ADMIN_EMAIL || "admin2@bluemantle.com",
    password: process.env.SECONDARY_ADMIN_PASSWORD || null,
    generatedPassword: generatedSecondaryPassword,
  },
];

async function ensureAdminAccess() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to create admin access.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const admin of admins) {
    const existingAdmin = await User.findOne({ signInId: admin.signInId });
    const passwordToApply = admin.password || (!existingAdmin ? admin.generatedPassword : null);
    const update = {
      name: admin.name,
      email: admin.email,
      role: "admin",
      status: "active",
    };

    if (passwordToApply) {
      update.password = await hashPassword(passwordToApply);
      update.plainPassword = passwordToApply;
      update.activeToken = null;
    }

    await User.findOneAndUpdate(
      { signInId: admin.signInId },
      update,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${admin.signInId} (${admin.email})`);

    if (!existingAdmin && admin.generatedPassword && !process.env.SECONDARY_ADMIN_PASSWORD) {
      console.log(`Generated secondary admin password: ${admin.generatedPassword}`);
    }
  }
}

ensureAdminAccess()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Admin access check complete.");
  })
  .catch(async (error) => {
    console.error("Admin access setup failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
