// Complete auth flow test with verification link handling
const BASE_URL = 'http://localhost:5000/api';
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPass123!';
const testName = 'Auth Test User';

async function runFullAuthFlow() {
  console.log('🔵 Starting Complete Auth Flow Test\n');
  
  try {
    // Step 1: Register
    console.log('📝 Step 1: Registering new user...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName })
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      throw new Error(registerData?.message || 'Registration failed');
    }
    
    console.log('✅ Registration successful');
    console.log('User:', registerData.data.user);
    
    const verificationLink = registerData.data.verificationLink;
    if (verificationLink) {
      console.log('✅ Verification link received:', verificationLink);
      
      // Extract token from link
      const urlParams = new URL(verificationLink, 'http://localhost:3001').searchParams;
      const token = urlParams.get('token');
      
      // Step 2: Verify Email
      console.log('\n📧 Step 2: Verifying email with token...');
      const verifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=${token}`);
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData?.message || 'Verification failed');
      }
      console.log('✅ Email verified successfully');
      console.log('Message:', verifyData.message);
      
      // Step 3: Try Login (should work now)
      console.log('\n🔐 Step 3: Attempting login...');
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData?.message || 'Login failed');
      }
      
      console.log('✅ Login successful!');
      console.log('User:', loginData.user);
      console.log('Access Token:', loginData.accessToken.substring(0, 20) + '...');
      
      // Step 4: Get user profile (protected endpoint)
      console.log('\n👤 Step 4: Fetching protected user profile...');
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`
        }
      });
      const meData = await meRes.json();
      if (!meRes.ok) {
        throw new Error(meData?.message || 'Profile fetch failed');
      }
      
      console.log('✅ Protected endpoint accessible!');
      console.log('Profile:', meData.user);
      
      console.log('\n✅✅✅ COMPLETE AUTH FLOW SUCCESS ✅✅✅');
      console.log('All steps passed:');
      console.log('  1. ✅ User registered');
      console.log('  2. ✅ Verification link received');
      console.log('  3. ✅ Email verified');
      console.log('  4. ✅ User logged in');
      console.log('  5. ✅ Protected endpoint accessible');
      
    } else {
      console.log('⚠️ No verification link in response (production mode?)');
      console.log('Response data:', registerRes.data.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('Message:', error.response.data.message);
    }
    process.exit(1);
  }
}

runFullAuthFlow();
