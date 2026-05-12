// scripts/matchAllExisting.js
require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('../src/models/Application');
const matchingService = require('../src/services/matchingService');

async function matchAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté\n');
    
    // Toutes les applications sauf draft
    const apps = await Application.find({ 
      status: { $nin: ['draft'] }
    });
    
    console.log(`📋 ${apps.length} applications à traiter\n`);
    
    let evaluation = 0;
    let accompaniment = 0;
    let failed = 0;
    
    for (const app of apps) {
      const name = app.project?.startupName || '?';
      const status = app.status;
      
      console.log(`→ ${name} (${status})`);
      
      try {
        const result = await matchingService.matchApplication(app._id);
        
        if (result.status === 'evaluation') {
          console.log(`  ✅ ${result.jury?.length || 0} jury matchés\n`);
          evaluation++;
        } else {
          console.log(`  ✅ ${result.investors?.length || 0} investisseurs, ${result.mentors?.length || 0} mentors\n`);
          accompaniment++;
        }
      } catch (err) {
        console.log(`  ❌ ${err.message}\n`);
        failed++;
      }
    }
    
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Résultat:`);
    console.log(`   - En évaluation: ${evaluation}`);
    console.log(`   - En accompagnement: ${accompaniment}`);
    console.log(`   - Échecs: ${failed}`);
    console.log('═══════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

matchAll();