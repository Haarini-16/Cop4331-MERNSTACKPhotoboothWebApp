const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { User } = require('../models');
const { createToken } = require('../middleware/auth');

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    // String() matters: without it, a body like {"login": {"$ne": null}}
    // becomes a MongoDB operator instead of a username.
    // The password field is hidden by default (select: false), so ask for it.
    const user = await User.findOne({ username: String(username) }).select('+password');

    // Same message whether the login or the password was wrong, so the
    // response doesn't reveal which usernames exist.
    if (!user || !(await user.checkPassword(String(password)))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'This account is disabled' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: 'Please verify your email' });
    }

    res.status(200).json({ token: createToken(user), user });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { verifyToken: String(req.query.token) },
      { verified: true, $unset: { verifyToken: 1 } }
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or already used verification link' });
    }

    res.status(200).json({ message: 'Email verified, you can log in now' });
  } catch (err) {
    next(err);
  }
};
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const resetToken = crypto.randomBytes(4).toString('hex');
    const user = await User.findOneAndUpdate({ email: String(email) }, { resetToken });

    if (user) {
      await sendEmail(user.email, 'Reset your Photobooth password', `Your reset code: ${resetToken}`);
    }

    //Same answer either way, so it doesn't reveal which emails have accounts
    res.status(200).json({ message: 'If that email has an account, a reset code was sent' });
  } catch (err) {
    next(err);
  }
};
// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { code, password } = req.body || {};

    if (!code || !password) {
      return res.status(400).json({ error: 'code and password are required' });
    }

    const user = await User.findOne({ resetToken: String(code) });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or already used reset code' });
    }

    user.password = String(password);
    user.resetToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset, you can log in now' });
  } catch (err) {
    next(err);
  }
};