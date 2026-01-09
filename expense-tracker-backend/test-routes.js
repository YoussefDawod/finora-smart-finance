const express = require('express');
const authRoutes = require('./src/routes/auth');
const transactionRoutes = require('./src/routes/transactions');

const app = express();

// Test route registration
console.log('Testing Route Registration...\n');

const testRouter = (name, router) => {
  console.log(`Routes for ${name}:`);
  if (router.stack) {
    router.stack.forEach((layer, i) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
        console.log(`  [${i}] ${methods} ${layer.route.path}`);
      }
    });
  }
  console.log();
};

testRouter('Auth Routes', authRoutes);
testRouter('Transaction Routes', transactionRoutes);

console.log('✓ Route Registration Test Complete');
