# Matching System Integration — Fix Summary

## 🎯 Problème Résolu
Deux systèmes incompatibles coexistaient:
- **Admin Panel** (Système A): `matchingController` → `Application.matching[]`
- **Founder Page** (Système B): `matchController` → `Match` collection

Le click "Valider" n'était jamais transmis du Système A vers le Système B.

---

## ✅ Corrections Appliquées

### 1️⃣ Étape 4 — isFounder Flag (COMPLÉTÉE)
**Problème**: Utilisateurs startup avaient `role: 'startup'` mais pas `isFounder: true`
- ✅ **14 utilisateurs** mis à jour: `isFounder = true`

```bash
db.users.updateMany({role: 'startup'}, {$set: {isFounder: true}})
```

---

### 2️⃣ Étape 2 — resolveStartupId() (COMPLÉTÉE)
**Problème**: Application n'a pas de champ `startup` dédié — elle ne stocke que `applicant` (User ref)

**Solution**: Utiliser `Application._id` comme `startup` dans Match collection

```javascript
// matchController.js → resolveStartupId()
// Avant: return app.startup || app.startupId || null;
// Après:  return app.startup || app.startupId || app.startupRef || app._id;
```

Aussi élargi le filtre statut pour accepter tous les statuts actifs (pas juste `accepted`/`approved`).

---

### 3️⃣ Étape 3 — Noms Champs Investor (COMPLÉTÉE)
**Problème**: getMyMatches cherchait `name`, `focus`, `location`, `description` — Investor a `nom`, `secteurs`, `localisation`, `bio`

**Solution**: Corriger les mappings

```javascript
// Avant (FAUX):
name: m.investor?.name,
focus: m.investor?.focus,
location: m.investor?.location,
description: m.investor?.description,

// Après (CORRECT):
name: m.investor?.nom,
focus: m.investor?.secteurs || [],
location: m.investor?.localisation,
description: m.investor?.bio,
```

Aussi ajouté champs supplémentaires: `investorType` (type), `company` (entreprise)

---

### 4️⃣ Étape 1 — validateMatch() → Créer Match docs (COMPLÉTÉE)
**Problème central**: Admin approuvait match dans Système A, mais Système B restait vide

**Solution**: Quand admin clique "Valider/Approuver", créer automatiquement un document Match

```javascript
// matchingController.js → validateMatch()
if (action === 'approve') {
  const startupId = application._id;  // ← key: _id comme startupId
  const adminUser = req.user._id;

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
}
```

---

## 🔄 Flux Corrigé (End-to-End)

```
1. ADMIN: Clique "Lancer la recherche" pour Application X
   └─→ GET /api/matching/trigger/{appId}
       └─→ matchingService.matchApplication()
           └─→ Crée Application.matching.investors[]
           └─→ ✅ Sauvegarde

2. ADMIN: Clique "Valider investisseur Y"
   └─→ POST /api/matching/{appId}/validate
       └─→ matchingController.validateMatch()
           ├─→ ✅ Met à jour Application.matching.investors[Y].status = 'approved'
           └─→ ✅ Crée Match { startup: appId, investor: Y, status: 'pending_founder_validation' }

3. FONDATEUR: Ouvre /dashboard/startup/matches
   └─→ GET /api/startup/matches
       └─→ matchController.getMyMatches()
           ├─→ resolveStartupId() → trouve Application par applicant → retourne app._id
           ├─→ Match.find({ startup: app._id })
           │   └─→ ✅ Trouve Match créé par l'admin
           └─→ ✅ Affiche les investisseurs avec noms/secteurs corrects
```

---

## 📊 Vérification

Une fois les changements déployés :

```bash
# 1️⃣ Vérifier isFounder sur un startup user
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer {token}"
# Expect: { ..., role: 'startup', isFounder: true }

# 2️⃣ Lancer le matching sur une candidature
curl -X POST http://localhost:5000/api/matching/trigger/{appId}/sync \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json"

# 3️⃣ Valider un match
curl -X POST http://localhost:5000/api/matching/{appId}/validate \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"investorId": "{investorId}", "action": "approve"}'
# Expect: { success: true, message: "Correspondance approved" }
# → Crée un Match document en arrière-plan

# 4️⃣ Voir les matches comme fondateur
curl http://localhost:5000/api/startup/matches \
  -H "Authorization: Bearer {founderToken}"
# Expect: { success: true, data: [{ name: "...", focus: [...], status: "pending_founder_validation" }, ...] }
```

---

## 🔧 Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `src/controllers/matchingController.js` | Import Match + validateMatch() crée Match docs |
| `src/controllers/matchController.js` | resolveStartupId() utilise app._id + getMyMatches() noms corrects |
| Base de données | +14 utilisateurs avec `isFounder: true` |

---

## ⚠️ Notes

- La création de Match document dans validateMatch est **non-bloquante**: si elle échoue, la validation Application continue quand même
- La relation est maintenant bidirectionnelle: Application → Match (via _id)
- Les deux collections restent séparées (pour flexibilité), mais synchronisées via validateMatch()

**Test final**: Un fondateur devrait voir ses matches approuvés par l'admin sur `/dashboard/startup/matches` ✅
