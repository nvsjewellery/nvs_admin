const bcrypt = require("bcryptjs");

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.log('Usage: node hashPassword.js "YourAdminPassword123"');
  process.exit(1);
}

bcrypt.genSalt(12).then((salt) => {
  bcrypt.hash(plainPassword, salt).then((hash) => {
    console.log("\nPaste this into .env as ADMIN_PASSWORD_HASH:\n");
    console.log(hash);
  });
});