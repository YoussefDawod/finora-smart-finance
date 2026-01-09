require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

(async () => {
  try {
    await mongoose.connect(config.mongodb.uri, { dbName: config.mongodb.db });
    console.log('[DEBUG] Connected to MongoDB');

    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('[DEBUG] User not found!');
      process.exit(1);
    }

    console.log('[DEBUG] User found:');
    console.log('  - Email:', user.email);
    console.log('  - Verified:', user.isVerified);
    console.log('  - PasswordHash exists:', !!user.passwordHash);
    console.log('  - PasswordHash length:', user.passwordHash?.length);

    const isValid = await user.validatePassword('password123');
    console.log('[DEBUG] Password validation result:', isValid);

    if (!isValid) {
      console.log('[DEBUG] Trying to set password again and save...');
      await user.setPassword('password123');
      await user.save();
      console.log('[DEBUG] Password updated');
      
      const isValidAgain = await user.validatePassword('password123');
      console.log('[DEBUG] Password validation after reset:', isValidAgain);
    }

    await mongoose.connection.close();
    console.log('[DEBUG] Done');
    process.exit(0);
  } catch (err) {
    console.error('[DEBUG_ERROR]', err.message);
    process.exit(1);
  }
})();
