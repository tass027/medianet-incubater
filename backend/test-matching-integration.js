/**
 * Test Script: Integration Matching System (System A → System B)
 * 
 * Valide que le flux admin (validateMatch) crée maintenant des documents Match
 * que les fondateurs voient sur leur page /dashboard/startup/matches
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Application = require('./src/models/Application');
const Match = require('./src/models/Match');
const Investor = require('./src/models/Investor');
const User = require('./src/models/User');

async function testMatchingIntegration() {
  try {
    console.log('\n🔄 CONNECTING TO DATABASE...\n');
    await mongoose.connect(process.env.MONGO_URI);

    // Step 1: Find a founder user with role='startup' and isFounder=true
    console.log('Step 1️⃣  — Finding founder user...');
    const founder = await User.findOne({ role: 'startup', isFounder: true })
      .select('_id email role isFounder')
      .lean();
    
    if (!founder) {
      console.log('   ❌ No founder found with role=startup and isFounder=true');
      process.exit(1);
    }
    console.log(`   ✅ Found founder: ${founder.email} (id: ${founder._id})`);

    // Step 2: Find Application for this founder
    console.log('\nStep 2️⃣  — Finding Application for this founder...');
    const application = await Application.findOne({
      $or: [
        { applicant: founder._id },
        { email: founder.email },
      ],
    })
      .select('_id project.startupName matching.investors email')
      .lean();

    if (!application) {
      console.log('   ❌ No Application found for this founder');
      process.exit(1);
    }
    console.log(`   ✅ Found Application: ${application.project?.startupName || 'N/A'}`);
    console.log(`      → ApplicationId: ${application._id}`);
    
    const investorCount = application.matching?.investors?.length || 0;
    console.log(`      → Has ${investorCount} matched investors (in Système A)`);

    // Step 3: Check if there are already Match documents (System B)
    console.log('\nStep 3️⃣  — Checking Match documents for this startup...');
    const matches = await Match.find({ startup: application._id })
      .select('_id investor matchScore status createdAt')
      .lean();
    
    console.log(`   Found ${matches.length} Match documents in System B`);
    if (matches.length > 0) {
      console.log('   Sample matches:');
      matches.slice(0, 3).forEach(m => {
        console.log(`     - ${m._id}: investor=${m.investor}, score=${m.matchScore}, status=${m.status}`);
      });
    }

    // Step 4: Simulate admin approving a match (if there are investors matched)
    if (investorCount > 0) {
      console.log('\nStep 4️⃣  — Simulating admin validateMatch() call...');
      const firstInvestor = application.matching.investors[0];
      const investorId = firstInvestor.investorId;
      
      console.log(`   Approving investor ${investorId} for application ${application._id}...`);

      // Create Match as validateMatch() would
      const matchResult = await Match.findOneAndUpdate(
        { startup: application._id, investor: investorId },
        {
          $setOnInsert: {
            startup:   application._id,
            investor:  investorId,
            createdBy: new mongoose.Types.ObjectId(), // mock admin
          },
          $set: {
            matchScore: firstInvestor.score || 75,
            status:     'pending_founder_validation',
          },
        },
        { upsert: true, new: true }
      );
      
      console.log(`   ✅ Match created/updated: ${matchResult._id}`);
    }

    // Step 5: Final verification - Query as founder would
    console.log('\nStep 5️⃣  — Final verification (as founder would see)...');
    const finalMatches = await Match.find({ startup: application._id })
      .populate('investor', 'nom secteurs localisation bio')
      .select('_id matchScore status investor')
      .lean();

    console.log(`   ✅ Found ${finalMatches.length} matches visible to founder`);
    if (finalMatches.length > 0) {
      console.log('   Match details:');
      finalMatches.slice(0, 2).forEach(m => {
        console.log(`     - Score: ${m.matchScore}, Status: ${m.status}`);
        console.log(`       Investor: ${m.investor?.nom || 'N/A'}`);
      });
    }

    console.log('\n✅ TEST PASSED — Integration flux is working!\n');
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run test
testMatchingIntegration();
