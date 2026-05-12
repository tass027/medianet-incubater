// Fix assignedProgrammeIds - convert to actual ObjectIds

require('dotenv').config();
const mongoose = require('mongoose');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection;
  const juryCol = db.collection('jury');

  // Get all jury records
  const juries = await juryCol.find({}).toArray();
  console.log(`📋 Jury records: ${juries.length}\n`);

  // Get all programmes
  const programmes = await db.collection('programmes').find({}).toArray();
  console.log(`📚 Programmes: ${programmes.length}`);
  programmes.forEach((p, idx) => console.log(`   ${idx}: ${p._id} - ${p.titre}`));
  console.log();

  // Check which jury has bad IDs
  for (const jury of juries) {
    console.log(`\n👤 ${jury.name}:`);
    console.log(`   Current assignedProgrammeIds: ${JSON.stringify(jury.assignedProgrammeIds)}`);

    if (jury.assignedProgrammeIds && jury.assignedProgrammeIds.length > 0) {
      // Check if they're numbers or bad ObjectIds
      const badIds = jury.assignedProgrammeIds.filter(id => 
        typeof id === 'number' || !id.toString().match(/^[a-f0-9]{24}$/)
      );

      if (badIds.length > 0) {
        console.log(`   ⚠️  Bad IDs detected: ${JSON.stringify(badIds)}`);
        
        // Map numeric IDs to actual programmes
        // Assuming 1-8 map to the 8 programmes in order
        const correctedIds = jury.assignedProgrammeIds.map(id => {
          if (typeof id === 'number') {
            const prog = programmes[id - 1]; // 1-indexed to 0-indexed
            if (prog) {
              console.log(`   ✅ Converting ${id} → ${prog._id}`);
              return prog._id;
            }
          }
          return id;
        });

        console.log(`   New assignedProgrammeIds: ${JSON.stringify(correctedIds)}`);
        await juryCol.updateOne(
          { _id: jury._id },
          { $set: { assignedProgrammeIds: correctedIds } }
        );
        console.log(`   💾 Updated`);
      } else {
        console.log(`   ✅ All IDs look good`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
