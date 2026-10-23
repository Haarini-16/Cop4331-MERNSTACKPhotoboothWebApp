const mongoose = require('mongoose');

const photoboothSchema = new mongoose.Schema({
	imageUrl:{
		type: String,
		required: true //the clout storage url string pointing to the png
	},
	layoutDimensions: {
		type: String,
		default: '6x2'
	},
	userId:{
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User',
		required: true
	}
}, {timestamps: true});

module.exports = mongoose.model('Photobooth', photoboothSchema);
	
