const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Listing = require('../models/Listing');
const Contract = require('../models/Contract');
const EscrowTransaction = require('../models/EscrowTransaction');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agrichain';

// Crop list with prices
const CROPS = [
  { name: 'Rice', pricePerKg: 45, maxQuantity: 1000 },
  { name: 'Wheat', pricePerKg: 38, maxQuantity: 800 },
  { name: 'Tomato', pricePerKg: 25, maxQuantity: 500 },
  { name: 'Onion', pricePerKg: 30, maxQuantity: 600 },
  { name: 'Potato', pricePerKg: 20, maxQuantity: 1200 },
  { name: 'Carrot', pricePerKg: 28, maxQuantity: 400 },
  { name: 'Cotton', pricePerKg: 55, maxQuantity: 300 },
  { name: 'Sugarcane', pricePerKg: 35, maxQuantity: 2000 },
  { name: 'Maize', pricePerKg: 32, maxQuantity: 900 },
  { name: 'Pulses', pricePerKg: 60, maxQuantity: 250 }
];

const CONTRACT_STAGES = [
  'negotiation',
  'signed',
  'escrowed',
  'in_progress',
  'harvest_submitted',
  'verification',
  'delivery_scheduled',
  'delivered',
  'payment_released',
  'completed'
];

const generateRandomQuantity = (max) => Math.floor(Math.random() * (max - 100)) + 100;

const getRandomContractStage = () => CONTRACT_STAGES[Math.floor(Math.random() * CONTRACT_STAGES.length)];

const getRandomCrop = () => CROPS[Math.floor(Math.random() * CROPS.length)];

const getEscrowStatusFromContractStage = (stage) => {
  const stageMap = {
    'negotiation': 'pending',
    'signed': 'pending',
    'escrowed': 'pending',
    'in_progress': 'pending',
    'harvest_submitted': 'pending',
    'verification': 'pending',
    'delivery_scheduled': 'pending',
    'delivered': 'pending',
    'payment_released': 'released',
    'completed': 'completed',
    'dispute': 'disputed'
  };
  return stageMap[stage] || 'pending';
};

const generateMockTransactions = async () => {
  try {
    console.log('🚀 Starting mock transaction generation...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).lean();
    console.log(`📊 Found ${users.length} users\n`);

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create transactions.');
      return;
    }

    let listingsCreated = 0;
    let contractsCreated = 0;
    let escrowsCreated = 0;

    // Get farmers and buyers
    const farmers = users.filter(u => u.role === 'farmer');
    const buyers = users.filter(u => u.role === 'buyer');

    console.log(`👨‍🌾 Farmers: ${farmers.length}, 🛒 Buyers: ${buyers.length}\n`);

    if (farmers.length === 0 || buyers.length === 0) {
      console.log('⚠️ Need both farmers and buyers to create transactions.');
      return;
    }

    // Step 1: Create listings from farmers
    for (const farmer of farmers) {
      const numListings = Math.floor(Math.random() * 3) + 2; // 2-4 listings per farmer

      for (let i = 0; i < numListings; i++) {
        const crop = getRandomCrop();
        const quantity = generateRandomQuantity(crop.maxQuantity);

        const listing = new Listing({
          farmerId: farmer._id,
          crop: crop.name,
          quantityKg: quantity,
          pricePerKg: crop.pricePerKg,
          qualityGrade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          description: `High quality ${crop.name} available for sale`,
          status: 'active',
          district: ['Hyderabad', 'Karimnagar', 'Khammam', 'Medak', 'Adilabad'][Math.floor(Math.random() * 5)],
          harvestDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
        });

        const savedListing = await listing.save();
        listingsCreated++;

        // Step 2: Create contracts from these listings
        const numContracts = Math.floor(Math.random() * 2) + 1; // 1-2 contracts per listing

        for (let j = 0; j < numContracts && buyers.length > 0; j++) {
          const buyer = buyers[Math.floor(Math.random() * buyers.length)];
          const contractQuantity = Math.floor(quantity / numContracts);
          const stage = getRandomContractStage();
          const totalValue = contractQuantity * crop.pricePerKg;

          const contract = new Contract({
            listingId: savedListing._id,
            farmerId: farmer._id,
            buyerId: buyer._id,
            crop: crop.name,
            quantityKg: contractQuantity,
            pricePerKg: crop.pricePerKg,
            totalValue: totalValue,
            downPaymentPercent: 20,
            downPaymentAmount: Math.floor(totalValue * 0.2),
            downPaymentStatus: Math.random() > 0.5 ? 'escrowed' : 'pending',
            qualityStandards: {
              moisturePercent: Math.floor(Math.random() * 5) + 10,
              defectLimit: 1,
              sizeGrade: 'Grade A'
            },
            stage: stage,
            deliveryWindowStart: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
            deliveryWindowEnd: new Date(Date.now() + (15 + Math.random() * 30) * 24 * 60 * 60 * 1000),
            harvestProof: {
              photos: [],
              submittedByFarmer: stage !== 'negotiation'
            },
            verification: {
              verifiedByAdmin: Math.random() > 0.4,
              passedQuality: Math.random() > 0.3
            },
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
          });

          const savedContract = await contract.save();
          contractsCreated++;

          // Step 3: Create associated Escrow Transaction (80% chance)
          if (Math.random() > 0.2) {
            const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
            const escrow = new EscrowTransaction({
              transactionId: transactionId,
              contractId: savedContract._id,
              buyerId: buyer._id,
              sellerId: farmer._id,
              crop: crop.name,
              quantity: contractQuantity,
              unit: 'kg',
              amount: totalValue,
              currency: 'INR',
              status: getEscrowStatusFromContractStage(stage),
              payment: {
                method: ['razorpay', 'bank_transfer', 'upi'][Math.floor(Math.random() * 3)],
                status: ['payment_released', 'completed'].includes(stage) ? 'confirmed' : 'pending',
                transactionRef: transactionId,
                amount: totalValue
              },
              delivery: {
                status: stage === 'completed' || stage === 'delivered' ? 'delivered' : 'pending',
                location: `District: ${['Hyderabad', 'Karimnagar', 'Khammam', 'Medak', 'Adilabad'][Math.floor(Math.random() * 5)]}`
              },
              buyerConfirmation: stage === 'completed' ? true : Math.random() > 0.5,
              createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
            });

            const savedEscrow = await escrow.save();
            escrowsCreated++;

            // Link contract to escrow
            await Contract.findByIdAndUpdate(savedContract._id, {
              escrowTransactionId: savedEscrow._id
            });
          }

          console.log(`✅ Created contract: ${crop.name} | ${contractQuantity}kg | ₹${totalValue} | Stage: ${stage}`);
        }
      }
    }

    // Calculate total value
    const totalValue = await EscrowTransaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('\n📈 Transaction Generation Summary:');
    console.log(`   ✅ Listings Created: ${listingsCreated}`);
    console.log(`   ✅ Contracts Created: ${contractsCreated}`);
    console.log(`   🔒 Escrow Transactions Created: ${escrowsCreated}`);
    console.log(`   💰 Total Value: ₹${(totalValue[0]?.total || 0).toLocaleString('en-IN')}`);

    console.log('\n✨ Mock transactions generated successfully!');

  } catch (error) {
    console.error('❌ Error generating mock transactions:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
generateMockTransactions();
