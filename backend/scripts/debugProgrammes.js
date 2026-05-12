// Debug programmes structure

require('dotenv').config();
const mongoose = require('mongoose');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  const db = mongoose.connection;

  const programmes = await db.collection('programmes').find({}).limit(3).toArray();
  console.log('📚 Sample programmes:\n');
  programmes.forEach((p, idx) => {
    console.log(`Programme ${idx + 1}:`);
    console.log(JSON.stringify(p, null, 2));
    console.log('---\n');
  });

  await mongoose.disconnect();
}

run().catch(console.error);
