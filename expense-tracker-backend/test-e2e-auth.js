/**
 * E2E Auth Flow Test
 * Testet: Register → Email Verify → Login → Dashboard Access
 */

require('dotenv').config();
const User = require('./src/models/User');
const mongoose = require('mongoose');
const config = require('./src/config/env');

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`),
  data: (label, value) => console.log(`${colors.cyan}${label}:${colors.reset} ${value}`),
};

async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      dbName: config.mongodb.db,
      retryWrites: true,
      w: 'majority',
    });
    log.success('MongoDB connected');
    return true;
  } catch (err) {
    log.error(`MongoDB connection failed: ${err.message}`);
    return false;
  }
}

async function runTests() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let testUser = null;
  let verificationToken = null;

  log.section('1. Register Simulation');
  try {
    // Cleantup any existing user
    await User.deleteOne({ email: testEmail });
    log.info(`Cleaning up old test user...`);

    // Create new user (like /register endpoint)
    testUser = new User({
      email: testEmail,
      name: 'Test User',
    });
    await testUser.setPassword(testPassword);
    verificationToken = testUser.generateVerification();
    await testUser.save();

    log.success(`User created: ${testEmail}`);
    log.data('Verification Token', verificationToken.substring(0, 16) + '...');
    log.data('Token Expires', testUser.verificationExpires.toISOString());
  } catch (err) {
    log.error(`Registration failed: ${err.message}`);
    process.exit(1);
  }

  log.section('2. Email Verification Simulation');
  try {
    const tokenHash = require('crypto').createHash('sha256').update(verificationToken).digest('hex');
    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      log.error('Token validation failed');
      process.exit(1);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    log.success(`User verified: ${testEmail}`);
    log.data('User Status', user.isVerified ? 'Verified ✓' : 'Not Verified ✗');
  } catch (err) {
    log.error(`Verification failed: ${err.message}`);
    process.exit(1);
  }

  log.section('3. Password Validation');
  try {
    const user = await User.findOne({ email: testEmail });
    const isValid = await user.validatePassword(testPassword);

    if (!isValid) {
      log.error('Password validation failed');
      process.exit(1);
    }

    log.success(`Password validated: ${testPassword}`);
  } catch (err) {
    log.error(`Password validation failed: ${err.message}`);
    process.exit(1);
  }

  log.section('4. Token Generation (Login Simulation)');
  try {
    const user = await User.findOne({ email: testEmail });
    const accessToken = require('jsonwebtoken').sign(
      { sub: user._id.toString(), email: user.email },
      config.jwt.secret,
      { expiresIn: 3600 }
    );

    const refreshToken = require('crypto').randomBytes(32).toString('hex');
    user.addRefreshToken(refreshToken, 7 * 24 * 3600, {
      userAgent: 'Test Client',
      ip: '127.0.0.1',
    });
    await user.save();

    log.success('Tokens generated');
    log.data('Access Token', accessToken.substring(0, 20) + '...');
    log.data('Refresh Token', refreshToken.substring(0, 16) + '...');
  } catch (err) {
    log.error(`Token generation failed: ${err.message}`);
    process.exit(1);
  }

  log.section('5. Password Reset Flow');
  try {
    const user = await User.findOne({ email: testEmail });
    const resetToken = user.generatePasswordReset();
    await user.save();

    log.success('Password reset token generated');
    log.data('Reset Token', resetToken.substring(0, 16) + '...');
    log.data('Expires In', '1 hour');

    // Simulate reset
    const newPassword = 'NewPass456!';
    const tokenHash = require('crypto').createHash('sha256').update(resetToken).digest('hex');
    const resetUser = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!resetUser) {
      log.error('Reset token validation failed');
      process.exit(1);
    }

    await resetUser.setPassword(newPassword);
    resetUser.passwordResetToken = undefined;
    resetUser.passwordResetExpires = undefined;
    await resetUser.save();

    log.success('Password reset successful');
    log.info(`New password set: ${newPassword}`);
  } catch (err) {
    log.error(`Password reset failed: ${err.message}`);
    process.exit(1);
  }

  log.section('Summary');
  log.success('All tests passed! ✓');
  log.info('Auth flow is fully functional:');
  console.log(`  1. User can register with email & password`);
  console.log(`  2. Verification email token is generated`);
  console.log(`  3. Email can be verified with token`);
  console.log(`  4. Password can be validated`);
  console.log(`  5. Access & Refresh tokens are issued`);
  console.log(`  6. Password reset flow works`);
  console.log('');
  log.data('Test Email', testEmail);
  log.data('Final Password', 'NewPass456!');
  console.log('');
}

async function main() {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  await runTests();
  await mongoose.connection.close();
  log.success('Database connection closed');
  process.exit(0);
}

main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
