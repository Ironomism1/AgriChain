const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');

const MONGODB_URI = 'mongodb://localhost:27017/agrichain';

const seedListings = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get existing farmers or create them
    let farmers = await User.find({ role: 'farmer' }).limit(6);
    
    if (farmers.length === 0) {
      console.log('Creating test farmers...');
      const farmerData = [
        { name: 'Rajesh Kumar', email: 'rajesh@farm.com', phone: '+919876543210', role: 'farmer', district: 'Hyderabad' },
        { name: 'Priya Sharma', email: 'priya@farm.com', phone: '+919876543211', role: 'farmer', district: 'Medak' },
        { name: 'Arjun Singh', email: 'arjun@farm.com', phone: '+919876543212', role: 'farmer', district: 'Karimnagar' },
        { name: 'Neha Patel', email: 'neha@farm.com', phone: '+919876543213', role: 'farmer', district: 'Nalgonda' },
        { name: 'Vikram Reddy', email: 'vikram@farm.com', phone: '+919876543214', role: 'farmer', district: 'Warangal' },
        { name: 'Anjali Verma', email: 'anjali@farm.com', phone: '+919876543215', role: 'farmer', district: 'Nizamabad' },
      ];
      farmers = await User.insertMany(farmerData);
      console.log(`Created ${farmers.length} test farmers`);
    }

    // Clear existing listings
    await Listing.deleteMany({});
    console.log('Cleared existing listings');

    // Create test listings
    const listingsData = [
      {
        farmerId: farmers[0]._id,
        crop: 'Paddy',
        quantity: 100,
        pricePerKg: 22,
        district: 'Hyderabad',
        season: 'Kharif',
        status: 'active',
        description: 'High quality paddy rice',
        photos: []
      },
      {
        farmerId: farmers[1]._id,
        crop: 'Wheat',
        quantity: 150,
        pricePerKg: 21,
        district: 'Medak',
        season: 'Rabi',
        status: 'active',
        description: 'Premium wheat',
        photos: []
      },
      {
        farmerId: farmers[2]._id,
        crop: 'Arhar',
        quantity: 80,
        pricePerKg: 55,
        district: 'Karimnagar',
        season: 'Kharif',
        status: 'active',
        description: 'Fresh arhar dal',
        photos: []
      },
      {
        farmerId: farmers[3]._id,
        crop: 'Groundnut',
        quantity: 120,
        pricePerKg: 65,
        district: 'Nalgonda',
        season: 'Kharif',
        status: 'active',
        description: 'Organic groundnut',
        photos: []
      },
      {
        farmerId: farmers[4]._id,
        crop: 'Sorghum',
        quantity: 200,
        pricePerKg: 18,
        district: 'Warangal',
        season: 'Kharif',
        status: 'active',
        description: 'Quality sorghum',
        photos: []
      },
      {
        farmerId: farmers[5]._id,
        crop: 'Sesamum',
        quantity: 50,
        pricePerKg: 90,
        district: 'Nizamabad',
        season: 'Kharif',
        status: 'active',
        description: 'Premium sesamum',
        photos: []
      },
      {
        farmerId: farmers[0]._id,
        crop: 'Maize',
        quantity: 180,
        pricePerKg: 19,
        district: 'Hyderabad',
        season: 'Kharif',
        status: 'active',
        description: 'Hybrid maize',
        photos: []
      },
      {
        farmerId: farmers[1]._id,
        crop: 'Paddy',
        quantity: 120,
        pricePerKg: 23,
        district: 'Medak',
        season: 'Kharif',
        status: 'active',
        description: 'Basmati rice',
        photos: []
      },
    ];

    const listings = await Listing.insertMany(listingsData);
    console.log(`✅ Created ${listings.length} test listings`);

    // Verify data
    const count = await Listing.countDocuments();
    const populated = await Listing.find({}).populate('farmerId', 'name phone');
    console.log(`\n📊 Total listings in DB: ${count}`);
    console.log('\nSample listing:');
    console.log(JSON.stringify(populated[0], null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedListings();
