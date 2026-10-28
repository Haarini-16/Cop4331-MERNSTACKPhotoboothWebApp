const { User } = require('../models');
const { createToken } = require('../middleware/auth');

// POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    if (await User.exists({ username: String(username) })) {
      return res.status(409).json({ error: 'A user with that username already exists' });
    }

    // role isn't read from the body, so nobody can register as Admin.
    //The schema defaults to 'user', and hte model hashes the password and uhhh
    const user = await User.create({
      username: String(username),
      password: String(password)
    });


    // A new user is logged in right away, so the response includes a token.
    res
      .status(201)
      .location(`/api/users/${user._id}`)
      .json({ token: createToken(user), user });
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
