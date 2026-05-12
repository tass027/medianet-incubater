// Quick diagnostic for Lina's jury space

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection;

  // 1. Find Lina's User account
  const lina = await User.findOne({ email: 'lina.jury@medianet.tn' });
  console.log('👤 Lina User:');
  console.log('   _id:', lina._id);
  console.log('   name:', lina.name);
  console.log('   email:', lina.email);
  console.log('   role:', lina.role);
  console.log();

  // 2. Find Lina's jury record
  const linaJury = await db.collection('jury').findOne({ 
    $or: [
      { userId: lina._id },
      { email: lina.email }
    ]
  });
  console.log('📋 Lina Jury Record:');
  if (linaJury) {
    console.log('   _id:', linaJury._id);
    console.log('   name:', linaJury.name);
    console.log('   email:', linaJury.email);
    console.log('   userId:', linaJury.userId);
    console.log('   assignedProgrammeIds:', linaJury.assignedProgrammeIds);
  } else {
    console.log('   ❌ NO JURY RECORD FOUND');
  }
  console.log();

  // 3. Check all jury records
  const allJury = await db.collection('jury').find({}).toArray();
  console.log(`📊 All jury records (${allJury.length}):`);
  allJury.forEach(j => {
    console.log(`   - ${j.name}: assignedProgrammeIds = ${JSON.stringify(j.assignedProgrammeIds || [])}`);
  });
  console.log();

  // 4. Check all programmes
  const allProgrammes = await db.collection('programmes').find({}, { projection: { _id: 1, name: 1 } }).toArray();
  console.log(`📚 All programmes (${allProgrammes.length}):`);
  allProgrammes.forEach(p => {
    console.log(`   - ${p._id}: ${p.name}`);
  });
  console.log();

  // 5. Check applications with relevant statuses
  const apps = await User.find({
    'applications.status': { $in: ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'] }
  }).select('name email applications').lean();

  console.log(`📮 Applications with status in [reviewing, interview, accepted, rejected, waitlist] (${apps.length} users):`);
  apps.forEach(u => {
    u.applications.forEach(app => {
      if (['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'].includes(app.status)) {
        console.log(`   - User: ${u.name}, App: ${app.programmeName || app.programmeId}, Status: ${app.status}`);
        console.log(`     assignedJury: ${JSON.stringify(app.assignedJury || [])}`);
        console.log(`     programmeId: ${app.programmeId}`);
      }
    });
  });
  console.log();

  // 6. Check ALL applications (including other statuses)
  const allAppsUsers = await User.find({ 'applications': { $exists: true } }).select('name email applications').lean();
  console.log(`\n📮 ALL applications by status:`);
  const statusMap = {};
  allAppsUsers.forEach(u => {
    u.applications.forEach(app => {
      if (!statusMap[app.status]) statusMap[app.status] = 0;
      statusMap[app.status]++;
    });
  });
  Object.entries(statusMap).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
