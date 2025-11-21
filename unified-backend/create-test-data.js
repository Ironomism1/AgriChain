const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrichain';

async function createTestData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✓ Connected to MongoDB');

    // Check if test data already exists
    const existingFarmers = await User.find({ role: 'farmer' });
    if (existingFarmers.length > 0) {
      console.log(`Found ${existingFarmers.length} existing farmers`);
      
      // Use existing farmers or create new ones with unique emails
      let farmers = existingFarmers;
      
      if (farmers.length < 5) {
        const newFarmers = await User.insertMany([
          {
            name: 'Farmer New ' + Date.now(),
            email: 'farmer' + Date.now() + '@agrichain.com',
            phone: '+91' + Math.floor(Math.random() * 9000000000 + 1000000000),
            password: 'password123',
            role: 'farmer',
            district: 'Hyderabad'
          }
        ]);
        farmers = farmers.concat(newFarmers);
      }
      
      // Clear old listings
      await Listing.deleteMany({});
      console.log('✓ Cleared old listings');
      
      // Create new listings
      const listings = await Listing.insertMany([
        {
          farmerId: farmers[0]._id,
          crop: 'Paddy',
          quantityKg: 500,
          pricePerKg: 22,
          qualityGrade: 'A',
          district: 'Hyderabad',
          status: 'active'
        },
        {
          farmerId: farmers[1]._id,
          crop: 'Wheat',
          quantityKg: 300,
          pricePerKg: 21,
          qualityGrade: 'A',
          district: 'Medak',
          status: 'active'
        },
        {
          farmerId: farmers[2]._id,
          crop: 'Arhar',
          quantityKg: 200,
          pricePerKg: 55,
          qualityGrade: 'B',
          district: 'Karimnagar',
          status: 'active'
        },
        {
          farmerId: farmers[3]._id,
          crop: 'Groundnut',
          quantityKg: 400,
          pricePerKg: 65,
          qualityGrade: 'A',
          district: 'Khammam',
          status: 'active'
        },
        {
          farmerId: farmers[4]._id,
          crop: 'Sorghum',
          quantityKg: 600,
          pricePerKg: 18,
          qualityGrade: 'B',
          district: 'Nalgonda',
          status: 'active'
        },
        {
          farmerId: farmers[0]._id,
          crop: 'Sesamum',
          quantityKg: 150,
          pricePerKg: 90,
          qualityGrade: 'A',
          district: 'Hyderabad',
          status: 'active'
        },
        {
          farmerId: farmers[1]._id,
          crop: 'Maize',
          quantityKg: 450,
          pricePerKg: 19,
          qualityGrade: 'B',
          district: 'Medak',
          status: 'active'
        },
        {
          farmerId: farmers[2]._id,
          crop: 'Paddy',
          quantityKg: 350,
          pricePerKg: 23,
          qualityGrade: 'A',
          district: 'Karimnagar',
          status: 'active'
        }
      ]);

      console.log(`✓ Created ${listings.length} test listings`);
      console.log('\n✅ Test data setup successfully!');
      console.log('\nListing Details:');
      listings.forEach((listing, idx) => {
        const farmer = farmers.find(f => f._id.equals(listing.farmerId));
        console.log(`${idx + 1}. ${listing.crop} (${listing.quantityKg}kg @ ₹${listing.pricePerKg}/kg) - ${farmer.name} (${farmer.phone})`);
      });
      
      return;
    }

    // If no farmers exist, create them

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestData();
