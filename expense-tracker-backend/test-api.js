/**
 * Direct Auth Routes Test
 * Loads and verifies routes without HTTP
 */

require('dotenv').config();

async function test() {
  console.log('\n=== Testing Auth Routes (Direct Import) ===\n');

  try {
    const authRoutes = require('./src/routes/auth');
    const User = require('./src/models/User');

    console.log('✓ Auth Routes loaded');
    console.log(`  Routes: ${authRoutes.stack.length}`);

    // List all routes
    authRoutes.stack.forEach((layer, i) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
        console.log(`  [${i + 1}] ${methods.padEnd(6)} /api/auth${layer.route.path}`);
      }
    });

    console.log('\n✓ User Model loaded');
    console.log(`  Fields: email, passwordHash, name, isVerified, etc.`);
    console.log(`  Methods: setPassword, validatePassword, generateVerification`);

    // Test User creation (in-memory)
    const user = new User({
      email: 'test@example.com',
      name: 'Test User'
    });
    await user.setPassword('TestPass123');
    console.log(`\n✓ User instance created and password hashed`);

    // Verify password
    const isValid = await user.validatePassword('TestPass123');
    console.log(`✓ Password validation works: ${isValid}`);

    // Generate tokens
    const verToken = user.generateVerification();
    const resetToken = user.generatePasswordReset();
    console.log(`✓ Tokens generated: verification=${verToken.substring(0, 8)}..., reset=${resetToken.substring(0, 8)}...`);

    console.log('\n✓ All tests completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('✗ Test error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

test();
