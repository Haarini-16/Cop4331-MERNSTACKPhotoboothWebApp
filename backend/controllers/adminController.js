const { User } = require('../models');

// GET /api/admin/users
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/users
exports.createAdmin = async (req, res, next) => {
  try {
    const { username, password, email } = req.body || {};

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'username, password and email are required' });
    }

    //an admin is making it so we skip the email verification
    const user = await User.create({
      username: String(username),
      password: String(password),
      email: String(email),
      role: 'Admin',
      verified: true
    });

    res.status(201).json({ message: 'Admin created', user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/status
exports.setStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body || {};

    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive is required' });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //we store disabled so its the opposite of isActive
    user.disabled = !isActive;
    await user.save();

    res.status(200).json({ message: 'Status updated', user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/password
exports.setPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword is required' });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //model hashes it when we save
    user.password = String(newPassword);
    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};
