const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/agrichain', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  try {
    // Load User model
    const User = require('./unified-backend/models/User');
    
    const count = await User.countDocuments();
    console.log('\n=== DATABASE CHECK ===');
    console.log('Total users in collection:', count);
    
    if (count > 0) {
      const users = await User.find({}).select('_id name phone role').limit(5);
      console.log('\nSample users:');
      users.forEach((u, i) => {
        console.log(`${i+1}. Name: ${u.name}, Role: ${u.role}, ID: ${u._id}`);
      });
    } else {
      console.log('\nNo users found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})
.catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
