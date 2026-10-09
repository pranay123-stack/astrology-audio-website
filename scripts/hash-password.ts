/** Prints an ADMIN_PASSWORD_HASH value for local mode: npm run admin:hash -- 'your password' */
import { hashPassword } from "../src/lib/auth/tokens";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: npm run admin:hash -- '<password of 10+ characters>'");
  process.exit(1);
}
hashPassword(password).then((h) => console.log(h));
