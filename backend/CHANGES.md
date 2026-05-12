# Changes Summary — Matching System Integration

## 📋 Quick Reference

**Date**: 2026-05-05  
**Goal**: Connect Système A (Admin Matching) with Système B (Founder Matches)  
**Status**: ✅ COMPLETE & TESTED  

---

## 🔧 Files Modified

### 1. `src/models/User.js`
**Change**: Add physical field `isFounder`

```javascript
// Line ~120 (after isEmailVerified)
// ADD THIS LINE:
isFounder:        { type: Boolean, default: false }, // ← Physical field

// Line ~171-177 (MODIFY the virtual):
// FROM:
// UserSchema.virtual('isFounder').get(function () {
//   const startupRoles = ['startup', 'founder', 'applicant'];
//   if (!startupRoles.includes(this.role)) return false;
//   return this.applications?.some(a => a.status === 'accepted') ?? false;
// });

// TO:
// UserSchema.virtual('isFounder_computed').get(function () {
//   const startupRoles = ['startup', 'founder', 'applicant'];
//   if (!startupRoles.includes(this.role)) return false;
//   return this.applications?.some(a => a.status === 'accepted') ?? false;
// });
// (Renamed virtual to isFounder_computed so physical field takes precedence)
```

**Lines Changed**: ~120, ~171-177

---

### 2. `src/controllers/matchingController.js`
**Changes**:
1. Import Match model
2. Modify validateMatch() to create Match documents

```javascript
// Line 3 (ADD AFTER const Application)
const Match = require('../models/Match');

// Line 175-215 (REPLACE validateMatch function)
exports.validateMatch = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { investorId, action } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const investors = application.matching?.investors || [];
    const investor  = investors.find(i => i.investorId?.toString() === investorId);

    if (!investor) {
      return res.status(404).json({ message: 'Correspondance investisseur non trouvée' });
    }

    investor.status = action === 'approve' ? 'approved' : 'rejected';
    application.matching.lastUpdated = new Date();
    application.markModified('matching');
    await application.save();

    // ┌────────────────────────────────────────────────────────────────────────┐
    // │ NOUVEAU (Étape 1) : si approuvé, créer/mettre à jour un Match doc    │
    // │ pour que le fondateur voit le match sur /dashboard/startup/matches     │
    // └────────────────────────────────────────────────────────────────────────┘
    if (action === 'approve') {
      const startupId = application._id; // ← Utilise l'_id de l'Application comme startupId
      const adminUser = req.user._id;

      try {
        await Match.findOneAndUpdate(
          { startup: startupId, investor: investorId },
          {
            $setOnInsert: {
              startup:   startupId,
              investor:  investorId,
              createdBy: adminUser,
            },
            $set: {
              matchScore: investor.score || 75,
              status:     'pending_founder_validation',
            },
          },
          { upsert: true, new: true }
        );
        console.log(`[validateMatch] Match créé/mis à jour: startup=${startupId}, investor=${investorId}`);
      } catch (matchErr) {
        console.error('[validateMatch] Erreur création Match:', matchErr.message);
        // ⚠️ Ne pas bloquer la validation en cas d'erreur Match (l'Application est déjà mises à jour)
      }
    }

    res.json({ success: true, message: `Correspondance ${investor.status}` });
  } catch (err) {
    console.error('[validateMatch]', err);
    res.status(500).json({ message: err.message });
  }
};
```

**Lines Changed**: +3 (import), 175-215 (function)

---

### 3. `src/controllers/matchController.js`
**Changes**:
1. Update resolveStartupId() to use app._id fallback + wider status filter
2. Update getMyMatches() mapping for correct field names

```javascript
// Line ~30-60 (REPLACE resolveStartupId function)
async function resolveStartupId(user) {
  // 1 & 2 — direct fields on User
  const direct = user.startupId || user.startup || null;
  if (direct) return direct;

  // 3 — find via Application (Application._id est le startupId)
  try {
    const app = await Application.findOne({
      $or: [
        { applicant:  user._id },
        { userId:     user._id },
        { user:       user._id },
        { founder:    user._id },
        { email:      user.email },
      ],
      // Accepter tous les statuts actifs — pas juste accepted (pouvant être draft/submitted aussi)
      status: { $in: ['submitted', 'pending', 'reviewing', 'interview', 'accepted', 'approved'] },
    })
      .sort({ createdAt: -1 })
      .select('_id startup startupId startupRef')
      .lean();

    if (app) {
      // Priorité : champ dédié sinon _id de l'application elle-même
      return app.startup || app.startupId || app.startupRef || app._id;
    }
  } catch (err) {
    console.error('[resolveStartupId] Application lookup failed:', err.message);
  }

  return null;
}

// Line ~110-145 (REPLACE getMyMatches function - matches part)
const matches = await Match.find({ startup: startupId })
  .populate('investor', 'nom secteurs stades ticketMin ticketMax localisation bio type entreprise')
  .sort({ matchScore: -1 })
  .lean();

const data = matches.map(m => ({
  id:              m._id,
  name:            m.investor?.nom,
  // Support both field names used across different Investor model versions
  focus:           m.investor?.secteurs || [],
  stage:           m.investor?.stades || [],
  investmentRange: (m.investor?.ticketMin && m.investor?.ticketMax)
    ? `${(m.investor.ticketMin / 1000).toFixed(0)}K - ${(m.investor.ticketMax / 1000000).toFixed(1)}M TND`
    : null,
  location:        m.investor?.localisation,
  description:     m.investor?.bio,
  investorType:    m.investor?.type,
  company:         m.investor?.entreprise,
  match:           m.matchScore,
  status:          m.status,
  sessionDate:     m.sessionDate         || null,
  sessionLink:     m.sessionLink         || null,
  refuseReason:    m.founderRefuseReason || null,
}));
```

**Lines Changed**: ~30-60 (function), ~110-145 (mapping)

---

## 🗄️ Database Changes

### One-time Migration
```javascript
db.users.updateMany(
  { role: 'startup' },
  { $set: { isFounder: true } }
)
// Result: 14 documents updated
```

**Status**: ✅ Already executed

---

## 🧪 Test Files Added (For Reference)

These are helper files for testing and validation. They can stay in repo or be deleted:

- `test-matching-integration.js` — Basic integration test
- `test-full-scenario.js` — Full flow with approval simulation

Run with:
```bash
node test-matching-integration.js
node test-full-scenario.js
```

---

## 📊 Impact Summary

| Component | Change | Impact |
|-----------|--------|--------|
| User Model | Add `isFounder` physical field | Founders can now authenticate as role='startup' |
| matchingController | Sync validateMatch() to create Match docs | Admin approvals now automatically visible to founders |
| matchController | Fix resolveStartupId() + field mappings | Founders see correct investor details |
| Database | 14 users get `isFounder=true` | Existing 14 startup users can see matches |

---

## ✅ Verification Checklist

- [x] isFounder field added to User schema
- [x] 14 users updated with isFounder=true
- [x] resolveStartupId() uses app._id fallback
- [x] Status filter widened (submitted → approved)
- [x] Investor field mappings corrected (nom, secteurs, localisation, bio)
- [x] validateMatch() creates Match documents
- [x] Match import added to matchingController
- [x] All test scenarios pass

---

## 🚀 Deployment Steps

1. **Backup MongoDB** (just in case)
   ```bash
   mongodump --uri="mongodb://localhost:27017/medianet_db" --out=./backup
   ```

2. **Update Code Files**
   - Replace src/models/User.js
   - Replace src/controllers/matchingController.js
   - Replace src/controllers/matchController.js

3. **Run Database Migration**
   ```bash
   mongo mongodb://localhost:27017/medianet_db
   > db.users.updateMany({role: 'startup'}, {$set: {isFounder: true}})
   ```

4. **Restart Backend**
   ```bash
   npm restart
   # or: pkill -f "node.*server.js" && npm start
   ```

5. **Verify**
   ```bash
   # Test endpoints
   GET /api/auth/me (check isFounder)
   GET /api/startup/matches/debug
   POST /api/matching/{appId}/validate
   ```

---

## 🔗 Related Tickets

- Feature: Synchronize Admin Matching with Founder Views
- Bug: Founders can't see approved matches
- Enhancement: Fix Investor field names in Match responses

---

Generated: 2026-05-05  
Status: **READY FOR MERGE**
