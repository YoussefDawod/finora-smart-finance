require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

(async () => {
  try {
    await mongoose.connect(config.mongodb.uri, { dbName: config.mongodb.db });
    console.log('[TEST] Connected to MongoDB');

    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('[TEST] User already exists:', existingUser.email, 'verified:', existingUser.isVerified);
      if (!existingUser.isVerified) {
        existingUser.isVerified = true;
        await existingUser.save();
        console.log('[TEST] User verified');
      }
    } else {
      const user = new User({ email: 'test@example.com', name: 'Test User' });
      await user.setPassword('password123');
      user.isVerified = true;
      await user.save();
      console.log('[TEST] User created:', user.email);
    }

    await mongoose.connection.close();
    console.log('[TEST] Done');
    process.exit(0);
  } catch (err) {
    console.error('[TEST_ERROR]', err.message);
    console.error('[TEST_STACK]', err.stack);
    process.exit(1);
  }
})();
