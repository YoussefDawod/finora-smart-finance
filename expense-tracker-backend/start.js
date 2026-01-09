#!/usr/bin/env node
/**
 * Simple Test Server Starter
 * Starts the Express server without nodemon and logs to console
 */

require('dotenv').config();
const app = require('./server');

// We don't need to start the server again - server.js already does this
// Just let it run
console.log('\n✓ Server is running. Press Ctrl+C to stop.\n');
