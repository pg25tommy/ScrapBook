/**
 * Helper script to generate admin credentials
 * Run with: node scripts/generate-credentials.js
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate NextAuth secret
const secret = crypto.randomBytes(32).toString('base64');

// Generate password hash (change 'your-password' to your desired password)
const password = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('\n=== Generated Credentials ===\n');
console.log('NEXTAUTH_SECRET=');
console.log(secret);
console.log('\nADMIN_PASSWORD_HASH=');
console.log(hash);
console.log('\n');
console.log(`Password used: "${password}"`);
console.log('\nCopy these values to your .env.local file');
console.log('\nTo use a different password, run:');
console.log('node scripts/generate-credentials.js your-password-here');
console.log('\n');