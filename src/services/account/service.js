const bcrypt = require("@common/bcrypt"); // Custom crypto-based bcrypt-like module
const responses = require("@common/responses"); // Standard response wrappers
const identifiers = require("@common/identifiers"); // Handles userId generation
const webtoken = require("@common/webtoken"); // Custom JWT/token system
const config = require("@config/auth"); // Authentication config (not used directly here)
const Account = require("@models/Account"); // Account model handler
const User = require("@models/User"); // User model handler
const db = require("@common/db");
const { sendVerificationEmail } = require("@common/email.js");

/**
 * Returns a success response. This may be a placeholder for token validation.
 * 
 * Example request:
 * GET /auth/token
 * No input needed.
 */
async function appAuthToken(userId) {
    return responses.success();
}

/**
 * Creates a new account with a generated userId and access token.
 * 
 * Example request:
 * POST /auth/renew
 * No input needed.
 * 
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "u12345",
 *     "accessToken": "token-for-client"
 *   }
 * }
 */
async function appRenew() {
    const userId = await identifiers.getNextUserId(); // Generate a unique user ID
    const tokenObject = webtoken.create({ userId: userId }); // Generate token pair

    const account = new Account(userId);
    account.setAccessToken(tokenObject.dbToken); // Store internal access token
    account.setCreationTime(Date.now());
    await account.create(); // Save to DB

    account.setAccessToken(tokenObject.userToken); // Replace with client-facing token

    return responses.success({
        userId: account.getUserId(),
        accessToken: account.getAccessToken()
    });
}

/**
 * Sets the password for a new user account.
 * Will return an error if a password has already been set.
 * 
 * Example request:
 * POST /auth/set-password
 * {
 *   "userId": "u12345",
 *   "password": "mySecurePassword"
 * }
 */
async function appSetPassword(userId, password) {
    const account = await Account.fromUserId(userId);
    if (account.getPassword()) {
        return responses.passwordAlreadySet(); // Prevent password overwrite
    }

    const { hash: hashedPassword, salt } = bcrypt.hash(password);
    account.setPassword(`${salt}:${hashedPassword}`); // Save salt and hash
    await account.save();

    return responses.success();
}

/**
 * Logs in a user by checking password and issuing new token.
 * 
 * Example request:
 * POST /auth/login
 * {
 *   "userId": "u12345",
 *   "password": "mySecurePassword"
 * }
 * 
 * Example response (if successful):
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "u12345",
 *     "accessToken": "token-for-client",
 *     ...
 *   }
 * }
 */
async function appLogin(userId, password) {
    const account = await Account.fromUserId(userId);
    if (!account) {
        return responses.userNotExists();
    }

    const [salt, storedHash] = account.getPassword().split(':');
    const isPasswordValid = bcrypt.verify(password, storedHash, salt);

    if (!isPasswordValid) {
        return responses.invalidPassword();
    }

    const tokenObject = webtoken.create({ userId: account.userId });
    account.setAccessToken(tokenObject.dbToken);
    account.setLoginTime(Date.now());
    await account.save();

    account.setAccessToken(tokenObject.userToken);

    const isProfileExists = await User.exists(account.getUserId());
    if (!isProfileExists) {
        return responses.profileNotExists(account.response());
    }

    return responses.success(account.response());
}

/**
 * Send verification email with a code to the user.
 * Stores code and verification state in separate DB key.
 * 
 * Note: Email sending is currently simulated for testing only.
 */
async function sendEmailBind(userId, accessToken, email, bindType = 0) {
  if (!webtoken.verify({ userId, token: accessToken })) {
    return responses.invalidToken();
  }

  let targetEmail = email;

  if (bindType === 1) {
    const account = await Account.fromUserId(userId);
    if (!account) return responses.userNotExists();
    targetEmail = account.getEmail();
    if (!targetEmail) return responses.NoEmailSet();
  } else {
    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return responses.innerError();
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  db.set(`user.${userId}.emailVerification`, {
    email: targetEmail,
    code,
    verified: false,
    bindType,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes from now
  });

  try {
    await sendVerificationEmail(targetEmail, code);
  } catch (err) {
    return responses.error("Failed to send email");
  }

  return responses.success({ message: "Verification code sent" });
}

/**
 * Bind email by verifying the code.
 * Updates Account email only after successful verification.
 */
// Rename for consistency (optional)

async function emailBind(userId, accessToken, verifyCode) {
  if (!webtoken.verify({ userId, token: accessToken })) {
    return responses.invalidToken();
  }

  const verification = db.get(`user.${userId}.emailVerification`);
  if (!verification) return responses.error("No verification pending");

  if (Date.now() > verification.expires) {
    db.delete(`user.${userId}.emailVerification`);
    return responses.error("Verification code expired");
  }

  if (verifyCode !== verification.code) {
    return responses.error("Invalid verification code");
  }

  verification.verified = true;
  db.set(`user.${userId}.emailVerification`, verification);

  const account = await Account.fromUserId(userId);
  if (!account) return responses.userNotExists();

  account.setEmail(verification.email);
  await account.save();

  db.delete(`user.${userId}.emailVerification`);

  return responses.success({ message: "Email successfully verified and bound" });
}

/**
 * Unbinds the email from the user's account.
 * 
 * Example request:
 * DELETE /user/api/v1/email/bind
 * Headers:
 * {
 *   "userId": "u12345",
 *   "accessToken": "valid-token-abc123"
 * }
 */
async function unbindEmail(userId, accessToken) {
    if (!webtoken.verify({ userId, token: accessToken })) {
        return responses.invalidToken();
    }

    const account = await Account.fromUserId(userId);
    if (!account) {
        return responses.userNotExists();
    }

    // Clear email from account
    account.setEmail(null);
    await account.save();

    // Remove verification metadata
    db.delete(`user.${userId}.emailVerification`);

    return responses.success({ message: "Email unbound successfully" });
}

/**
 * Changes a user's password if the current one is valid.
 * 
 * Example request:
 * POST /auth/change-password
 * {
 *   "userId": "u12345",
 *   "currentPassword": "oldPass",
 *   "newPassword": "newPass123"
 * }
 */
async function modifyPassword(userId, currentPassword, newPassword) {
    const account = await Account.fromUserId(userId);

    const [salt, storedHash] = account.getPassword().split(':');
    const isPasswordValid = bcrypt.verify(currentPassword, storedHash, salt);

    if (!isPasswordValid) {
        return responses.invalidPassword();
    }

    const { hash: newHash, salt: newSalt } = bcrypt.hash(newPassword);
    account.setPassword(`${newSalt}:${newHash}`);
    await account.save();

    return responses.success();
}


module.exports = {
    unbindEmail,
    sendEmailBind,
    emailBind,
    appAuthToken,
    appLogin,
    appRenew,
    appSetPassword,
    modifyPassword
};