require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const { hashPassword } = require("./utils/hashPassword");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bluemantle");
  console.log("Connected to MongoDB");

  const hashedPassword = await hashPassword("password123");

  const student = {
    name: "Test Student",
    signInId: "student123",
    email: "student@test.com",
    password: hashedPassword,
    role: "student",
    status: "active",
    level: "Intermediate",
    totalXP: 500
  };

  await User.findOneAndUpdate({ signInId: "student123" }, student, { upsert: true, new: true });
  console.log("Student user seeded: student123 / password123");

  await mongoose.disconnect();
}

seed().catch(console.error);
