const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String, 
		required: true,
	},
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

module.exports = mongoose.model('User', UserSchema);
