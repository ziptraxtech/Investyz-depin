const mongoose = require('mongoose');

async function checkPanData() {
  try {
    await mongoose.connect('mongodb+srv://bhargav:bhargav108@cluster0.ngqj69p.mongodb.net/test_database?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    const users = await mongoose.connection.db.collection('users').find({ panNumber: { $exists: true } }).toArray();
    console.log(`Found ${users.length} users with PAN numbers:`);

    users.forEach(user => {
      console.log(`User ID: ${user.user_id}`);
      console.log(`PAN: ${user.panNumber}`);
      console.log(`KYC Status: ${user.kycStatus}`);
      console.log(`Verified: ${user.isKycVerified}`);
      console.log('---');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPanData();