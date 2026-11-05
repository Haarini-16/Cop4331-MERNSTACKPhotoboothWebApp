const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true,
		minlength: [5, 'Password must be at least 5 characters'],
		select: false
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	verified: {
		type: Boolean,
		default: false
	},
	verifyToken: String,
	role: {
		type: String,
		enum: ['User', 'Admin'],
		default: 'User'
	},
	disabled:{
		type: Boolean,
		default: false
	}
	
}, {timestamps: true});
//Hash the password 
UserSchema.pre('save', async function() {
	if (!this.isModified('password')) return;
	this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});
//Compare login to the stored has
UserSchema.methods.checkPassword = function (candidate) {
	return bcrypt.compare(candidate, this.password);
};
//never send the hash back in JSON
UserSchema.set('toJSON', {
	transform: (doc, ret) => {
		delete ret.password;
		delete ret.verifyToken;
		return ret;
	}
});

module.exports = mongoose.model('User', UserSchema);
