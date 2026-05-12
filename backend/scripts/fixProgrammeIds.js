// Fix: Link applications to programmes by titre (title)

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection;

  // Get all programmes with their titres
  const programmes = await db.collection('programmes').find({}).toArray();
  console.log(`📚 Programmes found: ${programmes.length}`);
  programmes.forEach(p => {
    console.log(`   ${p._id}: ${p.titre || p.name || '(no title)'}`);
  });
  console.log();

  // Get all users with applications
  const users = await User.find({ 'applications': { $exists: true } });
  console.log(`👥 Users with applications: ${users.length}`);
  console.log();

  let fixed = 0;

  for (const user of users) {
    let userChanged = false;

    for (let idx = 0; idx < user.applications.length; idx++) {
      const app = user.applications[idx];
      
      if (!app.programmeId || !app.programmeId.toString || app.programmeId.toString() === 'null') {
        // Try to match by programmeName
        if (app.programmeName) {
          const matchedProgramme = programmes.find(p => 
            p.titre && p.titre.toLowerCase() === app.programmeName.toLowerCase()
          );

          if (matchedProgramme) {
            console.log(`   ✅ "${app.programmeName}" → ${matchedProgramme._id}`);
            user.applications[idx].programmeId = matchedProgramme._id;
            fixed++;
            userChanged = true;
          } else {
            // Try partial match
            const partialMatch = programmes.find(p =>
              p.titre && app.programmeName && 
              p.titre.toLowerCase().includes(app.programmeName.toLowerCase().split(' ')[0])
            );
            
            if (partialMatch) {
              console.log(`   ⚠️  "${app.programmeName}" → partial match ${partialMatch._id} (${partialMatch.titre})`);
              user.applications[idx].programmeId = partialMatch._id;
              fixed++;
              userChanged = true;
            } else {
              console.log(`   ❌ "${app.programmeName}" - no matching programme`);
            }
          }
        }
      }
    }

    if (userChanged) {
      await user.save();
      console.log(`   💾 Saved user ${user.name}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} applications`);
  await mongoose.disconnect();
  console.log('✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
