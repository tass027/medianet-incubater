// Assign applications to jury members

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected\n');

  // Find Lina
  const lina = await User.findOne({ email: 'lina.jury@medianet.tn' });
  if (!lina) {
    console.log('❌ Lina not found');
    await mongoose.disconnect();
    return;
  }

  console.log(`👤 Lina: ${lina.name} (${lina._id})\n`);

  // Find all applications with status 'reviewing' or 'interview' or 'accepted'
  const validStatuses = ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'];
  const users = await User.find({ 'applications.status': { $in: validStatuses } });

  console.log(`📮 Assigning applications to Lina:\n`);

  let assigned = 0;

  for (const user of users) {
    let userChanged = false;

    for (let appIdx = 0; appIdx < user.applications.length; appIdx++) {
      const app = user.applications[appIdx];

      if (validStatuses.includes(app.status)) {
        // Check if Lina is already assigned
        const linaAlreadyAssigned = app.assignedJury?.some(id => id.toString() === lina._id.toString());

        if (!linaAlreadyAssigned) {
          console.log(`   ✅ ${user.name} - ${app.programmeName || 'No programme'} (status: ${app.status})`);
          
          if (!user.applications[appIdx].assignedJury) {
            user.applications[appIdx].assignedJury = [];
          }
          user.applications[appIdx].assignedJury.push(lina._id);
          assigned++;
          userChanged = true;
        } else {
          console.log(`   ℹ️  ${user.name} - ${app.programmeName} - already assigned`);
        }
      }
    }

    if (userChanged) {
      await user.save();
    }
  }

  console.log(`\n✅ Assigned ${assigned} applications to Lina`);
  await mongoose.disconnect();
  console.log('✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
