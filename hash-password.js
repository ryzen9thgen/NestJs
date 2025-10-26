// hash-password.js
const bcrypt = require('bcrypt');

const pwd = process.argv[2] || 'changeme';

bcrypt.hash(pwd, 10)
  .then(hash => {
    console.log('\n🔐 Hashed password:\n', hash, '\n');
  })
  .catch(err => {
    console.error('Error hashing password:', err);
  });
