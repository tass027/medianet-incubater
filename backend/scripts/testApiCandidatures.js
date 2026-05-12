// Test: API call to /api/jury-space/candidatures

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  const db = mongoose.connection;

  console.log('✅ Connected\n');

  // Find Lina and simulate her request
  const req = {
    user: await User.findOne({ email: 'lina.jury@medianet.tn' })
  };

  console.log(`📝 Simulating: GET /api/jury-space/candidatures`);
  console.log(`   User: ${req.user.name} (${req.user._id})\n`);

  // === COPY getCandidatures logic ===

  const getJuryRecord = async (user) => {
    const col = db.collection('jury');
    if (user._id) {
      const byId = await col.findOne({
        $or: [
          { userId: user._id },
          { userId: user._id.toString() },
          { linkedUserId: user._id },
          { linkedUserId: user._id.toString() },
        ],
      });
      if (byId) return byId;
    }
    if (user.email) {
      const byEmail = await col.findOne({ email: user.email.toLowerCase().trim() });
      if (byEmail) return byEmail;
    }
    return null;
  };

  const toObjectIds = (ids = []) =>
    ids.map(id => {
      try { return new mongoose.Types.ObjectId(id); } catch { return null; }
    }).filter(Boolean);

  const getAccessibleApplications = async (juryRecord, userId) => {
    const results = [];

    if (juryRecord?.assignedProgrammeIds?.length) {
      const oids = toObjectIds(juryRecord.assignedProgrammeIds);
      if (oids.length) {
        const users = await User.find({
          'applications.programmeId': { $in: oids },
          'applications.status': { $in: ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'] },
        }).select('name email startupProfile applications').lean();

        users.forEach(u => {
          u.applications.forEach(app => {
            const inProg = oids.some(o => o.toString() === app.programmeId?.toString());
            if (!inProg) return;
            if (!['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'].includes(app.status)) return;
            results.push({ user: u, app });
          });
        });
      }
    }

    if (userId) {
      const directlyAssigned = await User.find({
        'applications.assignedJury': { $in: [userId, userId.toString()] },
      }).select('name email startupProfile applications').lean();

      directlyAssigned.forEach(u => {
        u.applications.forEach(app => {
          const alreadyIn = results.some(r => r.app._id.toString() === app._id.toString());
          if (alreadyIn) return;
          const assigned = (app.assignedJury || []).map(id => id.toString());
          if (!assigned.includes(userId.toString())) return;
          results.push({ user: u, app });
        });
      });
    }

    const seen = new Set();
    return results.filter(r => {
      const k = r.app._id.toString();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const getStartupName = (user, app) =>
    user?.startupProfile?.startupName
    || app?.formResponses?.startupName
    || app?.formResponses?.projectName
    || user?.name
    || 'Sans nom';

  // === Main logic ===

  const juryRecord = await getJuryRecord(req.user);
  const apps = await getAccessibleApplications(juryRecord, req.user._id);

  const candidatures = apps.map(({ user: u, app }) => {
    const myScore = app.juryScores?.find(s =>
      (juryRecord && s.juryId?.toString() === juryRecord._id?.toString()) ||
      s.juryId?.toString() === req.user._id.toString()
    );

    return {
      _id: app._id,
      applicationId: app._id,
      userId: u._id,
      projectName: getStartupName(u, app),
      companyName: getStartupName(u, app),
      founderName: u.name,
      email: u.email,
      sector: u.startupProfile?.sector || '',
      stage: u.startupProfile?.stage || '',
      location: u.startupProfile?.location || '',
      programmeName: app.programmeName,
      programmeId: app.programmeId,
      status: app.status,
      juryEvaluated: !!myScore,
      myScore: myScore?.score ?? null,
      submittedAt: app.appliedAt,
    };
  });

  candidatures.sort((a, b) => {
    if (a.juryEvaluated !== b.juryEvaluated) return a.juryEvaluated ? 1 : -1;
    return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
  });

  console.log(`📊 Response: ${JSON.stringify({ success: true, candidatures }, null, 2)}`);

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
