const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet';

mongoose.connect(uri).then(async () => {
  const JuryEvaluation = require(path.join(__dirname, '../src/models/JuryEvaluation'));
  
  const all = await JuryEvaluation.find({}).limit(10).lean();
  console.log('Total evals:', all.length);
  all.forEach(x => console.log({
    appId:  x.applicationId?.toString(),
    jury:   x.juryName,
    score:  x.totalScore,
    status: x.status,
  }));
  
  mongoose.disconnect();
}).catch(e => console.error('Erreur:', e.message));