const { Photobooth, User } = require('../models');
const sendEmail = require('../utils/sendEmail');

//finds the strip and makes sure it belongs to whoever is logged in
const loadOwnedPhotobooth = async (req, res) => {
  const photobooth = await Photobooth.findById(req.params.id);

  if (!photobooth) {
    res.status(404).json({ error: 'Photobooth not found' });
    return null;
  }
  if (String(photobooth.userId) !== req.userId) {
    res.status(403).json({ error: 'You can only access your own photobooths' });
    return null;
  }
  return photobooth;
};

// GET /api/users/:userId/photobooths
exports.listPhotobooths = async (req, res, next) => {
  try {
    const photobooths = await Photobooth.find({ userId: req.params.userId });
    res.status(200).json(photobooths);
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:userId/photobooths
//frontend uploads the png to cloudinary and sends us the link
exports.createPhotobooth = async (req, res, next) => {
  try {
    const { imageUrl, layoutDimensions } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const photobooth = await Photobooth.create({
      imageUrl: String(imageUrl),
      layoutDimensions: layoutDimensions,
      userId: req.params.userId
    });

    res.status(201).json(photobooth);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/photobooths/:id
//only deletes our record, frontend deletes the image from cloudinary
exports.deletePhotobooth = async (req, res, next) => {
  try {
    const photobooth = await loadOwnedPhotobooth(req, res);
    if (!photobooth) return;

    await photobooth.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// POST /api/photobooths/:id/email
//emails the strip link to the user with brevo
exports.emailPhotobooth = async (req, res, next) => {
  try {
    const photobooth = await loadOwnedPhotobooth(req, res);
    if (!photobooth) return;

    const user = await User.findById(req.userId);
    await sendEmail(user.email, 'Your Photobooth strip', `Here's your strip: ${photobooth.imageUrl}`);

    res.status(200).json({ message: 'Strip sent to your email' });
  } catch (err) {
    next(err);
  }
};
