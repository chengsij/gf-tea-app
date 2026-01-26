import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/hash-password.ts <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nAdd this to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
