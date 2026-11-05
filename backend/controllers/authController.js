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
