// Test: simulate what getAccessibleApplications returns for Lina

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

const toObjectIds = (ids = []) =>
  ids.map(id => {
    try { return new mongoose.Types.ObjectId(id); } catch { return null; }
  }).filter(Boolean);

async function run() {
  await mongoose.connect(DB_URI);
  const db = mongoose.connection;

  console.log('✅ Connected\n');

  // Find Lina
  const linaUser = await User.findOne({ email: 'lina.jury@medianet.tn' });
  const linaJury = await db.collection('jury').findOne({ userId: linaUser._id });

  console.log(`👤 Testing for: ${linaUser.name}`);
  console.log(`   assignedProgrammeIds: ${JSON.stringify(linaJury.assignedProgrammeIds)}\n`);

  // Simulate getAccessibleApplications

  const results = [];

  // Strategy 1: via assignedProgrammeIds
  if (linaJury?.assignedProgrammeIds?.length) {
    const oids = toObjectIds(linaJury.assignedProgrammeIds.map(id => id.toString()));
    console.log(`📌 Strategy 1 - via assignedProgrammeIds: [${oids.map(o => o.toString()).join(', ')}]`);
    
    if (oids.length) {
      const users = await User.find({
        'applications.programmeId': { $in: oids },
        'applications.status': { $in: ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'] },
      }).select('name email applications').lean();

      console.log(`   Found ${users.length} users with matching programmes\n`);

      users.forEach(u => {
        u.applications.forEach(app => {
          const inProg = oids.some(o => o.toString() === app.programmeId?.toString());
          if (!inProg) return;
          if (!['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'].includes(app.status)) return;
          results.push({ user: u, app });
          console.log(`   ✅ ${u.name} - ${app.programmeName} (${app.status})`);
        });
      });
    }
  }

  // Strategy 2: via assignedJury
  console.log(`\n📌 Strategy 2 - via assignedJury[]:`);
  const directlyAssigned = await User.find({
    'applications.assignedJury': { $in: [linaUser._id, linaUser._id.toString()] },
  }).select('name email applications').lean();

  console.log(`   Found ${directlyAssigned.length} users with direct jury assignment`);

  directlyAssigned.forEach(u => {
    u.applications.forEach(app => {
      const alreadyIn = results.some(r => r.app._id.toString() === app._id.toString());
      if (alreadyIn) return;
      const assigned = (app.assignedJury || []).map(id => id.toString());
      if (!assigned.includes(linaUser._id.toString())) return;
      results.push({ user: u, app });
      console.log(`   ✅ ${u.name} - ${app.programmeName} (${app.status})`);
    });
  });

  // Deduplicate
  const seen = new Set();
  const final = results.filter(r => {
    const k = r.app._id.toString();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n📊 Total accessible applications: ${final.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
