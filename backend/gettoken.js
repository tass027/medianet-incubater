const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const admin = await User.findOne({ role: 'admin' }).lean();
  console.log('Admin found:', admin.email);
  const token = jwt.sign({ id: admin._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  console.log('TOKEN:', token);
  process.exit();
}).catch(e => { 
  console.error(e.message); 
  process.exit(1); 
});