/**
 * seedAdmin.js
 * Run once: node scripts/seedAdmin.js
 * Creates the admin account using credentials from .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI not set in .env');
    process.exit(1);
  }

  const loginId = process.env.ADMIN_LOGIN_ID;
  const code = process.env.ADMIN_CODE;

  if (!loginId || !code) {
    console.error('❌  ADMIN_LOGIN_ID and ADMIN_CODE must be set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB:', uri);

  const existing = await User.findOne({ loginId });
  if (existing) {
    console.log(`ℹ️   Admin already exists: loginId="${loginId}"`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name: 'CRR Administrator',
    email: `${loginId}@crr.local`,
    loginId,
    password: code,
    role: 'admin',
  });

  console.log(`✅  Admin created!`);
  console.log(`   Login ID : ${loginId}`);
  console.log(`   Code     : ${code}  (stored hashed)`);
  console.log(`   MongoDB _id: ${admin._id}`);

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
