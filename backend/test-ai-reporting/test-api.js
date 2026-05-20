const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const APPLICATION_ID = '69f3d92f58178a434fd83b83'; // 3 jurés soumis

async function run() {
  // 1. Login admin
  console.log('1. Login admin...');
  let token;
  try {
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email:    process.env.ADMIN_EMAIL    || 'admin@medianet.tn',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    });
    token = login.data.token || login.data.accessToken || login.data.data?.token;
    console.log('   ✅ Token obtenu');
  } catch (e) {
    console.log('   ❌ Login échoué:', e.response?.data || e.message);
    console.log('   → Ajuste ADMIN_EMAIL/ADMIN_PASSWORD dans .env ou dans ce fichier');
    process.exit(1);
  }

  // 2. Générer le rapport
  console.log('2. Génération rapport IA (30-60s)...');
  try {
    const resp = await axios.post(
      `${BASE_URL}/api/admin/ai-reporting/generate`,
      { applicationId: APPLICATION_ID },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000,
      }
    );
    const report = resp.data.report;
    console.log('   ✅ RAPPORT GÉNÉRÉ !');
    console.log('   Startup:', report.startupName);
    console.log('   Jurés analysés:', report.juryCount);
    console.log('   Score moyen:', report.avgScore);
    console.log('   Synthèse:', report.report.synthese?.substring(0, 100) + '...');
    console.log('   Recommandation:', report.report.recommandation?.decision);
    console.log('   Confiance:', report.report.recommandation?.niveau_confiance);
    console.log('   Points forts:', report.report.points_forts?.length);
    console.log('   Points faibles:', report.report.points_faibles?.length);
    console.log('   Divergences:', report.report.divergences?.length);
    console.log('\n--- RAPPORT COMPLET ---');
    console.log(JSON.stringify(report.report, null, 2));
  } catch (e) {
    console.log('   ❌ Erreur:', e.response?.data || e.message);
  }
}

run();
