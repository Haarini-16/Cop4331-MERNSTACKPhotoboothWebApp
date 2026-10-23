const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Photobooth = require('./backend/models/Photobooth');

const MONGO_URI = 'mongodb://127.0.0.1:27017/photobooth_db';

async function runTest(){
	try{
		console.log('Connecting to MongoDB...');
		await mongoose.connect(MONGO_URI);
		console.log('Connected successfully!');

		//test user
		const testUser = await User.create({
			username: 'testuser1',
			password: 'password',
			role: 'User'
		});
		console.log('Test User Created', testUser.username);
		
		//create photobooth exmaple
		
		const testPhotobooth = await Photobooth.create({
			imageUrl: 'https://storage.com',
			layoutDimension: '6x2',
			userId: testUser._id
		});
		console.log('Test Photobooth created with layout');

		console.log('\n--- SUCCESS: Database schemas created and verified! ---');
    		process.exit(0);
  	} catch (error) {
    		console.error('Database connection or entry failed:', error);
		process.exit(1);
	}
}

runTest();
