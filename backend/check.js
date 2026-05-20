const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const JuryEvaluation = require('./src/models/JuryEvaluation');
  
  const all = await JuryEvaluation.find({}).limit(10).lean();
  console.log('Total evals found:', all.length);
  all.forEach(e => console.log(
    'applicationId:', e.applicationId?.toString(),
    '| status:', e.status,
    '| startup:', e.startupName || e.startup || 'N/A'
  ));
  
  process.exit();
}).catch(e => {
  console.error(e.message); 
  process.exit(1); 
});
