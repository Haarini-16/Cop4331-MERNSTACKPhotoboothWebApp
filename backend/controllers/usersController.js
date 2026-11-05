const crypto = require('crypto');
const { User } = require('../models');
const { createToken } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, email } = req.body || {};

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'username, password and email are required' });
    }

    if (await User.exists({ username: String(username) })) {
      return res.status(409).json({ error: 'A user with that username already exists' });
    }

    // role isn't read from the body, so nobody can register as Admin.
    //The schema defaults to 'user', and the model hashes the password and yeah
    const user = await User.create({
      username: String(username),
      password: String(password),
      email: String(email),
      verifyToken: crypto.randomBytes(32).toString('hex')
    });

    const link = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${user.verifyToken}`;
    await sendEmail(user.email, 'Verify your Photobooth account', `Click to verify your account: ${link}`);

    // No login token until the email is verified.
    res
      .status(201)
      .location(`/api/users/${user._id}`)
      .json({ message: 'User registered, check your email to verify your account', user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
