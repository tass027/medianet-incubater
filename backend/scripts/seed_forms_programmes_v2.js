/**
 * seed_forms_programmes_v2_node.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Version compatible Node.js (mongodb driver natif)
 * Converti depuis seed_forms_programmes_v2.js (mongosh)
 *
 * Usage :
 *   npm install mongodb   (si pas déjà installé)
 *   node seed_forms_programmes_v2_node.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME   = "medianet_db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function q(id, type, title, opts = {}) {
  return {
    id,
    type,
    title,
    description:   opts.desc       || "",
    required:      opts.required !== undefined ? opts.required : false,
    options:       opts.options    || (["radio","checkbox","dropdown","grid"].includes(type) ? ["Option A","Option B"] : []),
    rows:          opts.rows       || (type === "grid" ? ["Row 1"] : []),
    scaleMin:      opts.scaleMin   || 1,
    scaleMax:      opts.scaleMax   || 5,
    scaleMinLabel: opts.scaleMinLabel || "",
    scaleMaxLabel: opts.scaleMaxLabel || "",
  };
}

let _qIdx = 0;
function qid() { return `q${++_qIdx}`; }

// ─── PROGRAMME ↔ FRONT ID ─────────────────────────────────────────────────────
const PROG_MAP = {
  "fintech-2026":            "form-fintech-2026",
  "edtech-2026":             "form-edtech-2026",
  "agritech-2026":           "form-agritech-2026",
  "cleantech-2026":          "form-cleantech-2026",
  "aiml-2026":               "form-aiml-2026",
  "candidatures-spontanees": null,
  "healthtech-2025":         "form-healthtech-2025",
  "foodstart-2":             "form-foodstart-2",
};

const ACCENT = {
  "fintech-2026":            "#0EA5E9",
  "edtech-2026":             "#8B5CF6",
  "agritech-2026":           "#F59E0B",
  "cleantech-2026":          "#10B981",
  "aiml-2026":               "#6366F1",
  "candidatures-spontanees": "#3B82F6",
  "healthtech-2025":         "#EF4444",
  "foodstart-2":             "#F97316",
};

// ═════════════════════════════════════════════════════════════════════════════
//  DÉFINITIONS DES FORMULAIRES
// =============================================================================

const FORM_DEFS = [

  // 1. CANDIDATURES SPONTANÉES
  {
    programmeSlug: "candidatures-spontanees",
    title:    "Basic Application Form",
    subtitle: "Standard application form sent to all candidates upon registration.",
    description: "Formulaire de base ouvert à toutes les startups, tous secteurs confondus.",
    type:   "basic",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Company Name",               { required: true }),
      q(qid(),"dropdown", "Sector",                     { required: true,  desc: "e.g. FinTech, EdTech, AgriTech", options: ["FinTech","HealthTech","AgriTech","EdTech","CleanTech","AI/ML","FoodTech","Logistics","Other"] }),
      q(qid(),"short",    "Founding Year",              { required: true }),
      q(qid(),"short",    "Team Size",                  { required: false }),
      q(qid(),"short",    "Country of Operation",       { required: false }),
      q(qid(),"radio",    "Funding Stage",              { required: true,  options: ["Pre-seed","Seed","Series A","Series B+","Bootstrapped"] }),
      q(qid(),"long",     "Brief Description",          { required: true,  desc: "Describe your startup in 2–3 sentences" }),
      q(qid(),"long",     "Problem Statement",          { required: true,  desc: "What specific problem are you solving?" }),
      q(qid(),"long",     "Solution",                   { required: true,  desc: "How does your product/service solve it?" }),
      q(qid(),"short",    "Website",                    { required: false }),
      q(qid(),"file",     "Pitch Deck",                 { required: false, desc: "PDF, max 10 MB" }),
      q(qid(),"radio",    "How did you hear about us?", { required: false, options: ["Partner referral","LinkedIn","Accelerator website","Social media","Conference","Other"] }),
    ],
  },

  // 2. FINTECH 2026
  {
    programmeSlug: "fintech-2026",
    title:    "Formulaire — Programme FinTech 2026",
    subtitle: "Candidature au programme d'accélération FinTech 2026",
    description: "Évaluation approfondie des startups opérant dans les services financiers, paiements, lending, insurtech et blockchain.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                         { required: true }),
      q(qid(),"short",    "Nom",                            { required: true }),
      q(qid(),"short",    "Email professionnel",            { required: true }),
      q(qid(),"short",    "Téléphone",                      { required: true }),
      q(qid(),"short",    "Profil LinkedIn",                { required: false }),
      q(qid(),"dropdown", "Rôle dans la startup",           { required: true,  options: ["CEO / Fondateur","CTO","COO","CFO","Autre"] }),
      q(qid(),"short",    "Années d'expérience en FinTech", { required: true }),
      q(qid(),"short",    "Nom de la startup",              { required: true }),
      q(qid(),"short",    "Site web",                       { required: false }),
      q(qid(),"short",    "Année de création",              { required: true }),
      q(qid(),"short",    "Pays d'incorporation",           { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",             { required: true,  options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"dropdown", "Forme juridique",                { required: false, options: ["SARL","SA","SAS","Auto-entrepreneur","Autre"] }),
      q(qid(),"long",     "Problème adressé",               { required: true,  desc: "Quel problème résolvez-vous ? (300 mots max)" }),
      q(qid(),"long",     "Votre solution",                 { required: true,  desc: "Décrivez votre produit/service (300 mots max)" }),
      q(qid(),"dropdown", "Catégorie FinTech",              { required: true,  options: ["Paiements & Transferts","Lending & Credit","Insurtech","WealthTech","Blockchain / DeFi","RegTech","Autre"] }),
      q(qid(),"long",     "Stack technologique",            { required: false }),
      q(qid(),"long",     "Avantage concurrentiel",         { required: true }),
      q(qid(),"radio",    "Statut réglementaire",           { required: true,  options: ["Non régulé","En cours d'agrément","Agréé/Licencié","Partenariat avec entité régulée"] }),
      q(qid(),"dropdown", "Stade de développement",         { required: true,  options: ["Idée","MVP","Pre-revenue","Revenue","Growth"] }),
      q(qid(),"short",    "MRR actuel (USD)",               { required: false, desc: "Monthly Recurring Revenue" }),
      q(qid(),"short",    "Nombre d'utilisateurs actifs",   { required: false }),
      q(qid(),"long",     "Partenariats bancaires",         { required: false, desc: "Listez vos partenariats avec des institutions financières" }),
      q(qid(),"short",    "Montant levé à ce jour (USD)",   { required: false }),
      q(qid(),"dropdown", "Dernier tour de financement",    { required: false, options: ["Bootstrapped","Pre-seed","Seed","Série A","Série B+"] }),
      q(qid(),"radio",    "Revenue Model",                  { required: true,  options: ["Subscription","Transaction fee","Freemium","Marketplace","Other"] }),
      q(qid(),"radio",    "Regulatory Compliance",          { required: true,  options: ["Fully compliant","In progress","Not started"] }),
      q(qid(),"file",     "Pitch Deck (PDF, max 10 Mo)",    { required: true }),
      q(qid(),"file",     "Projections financières",        { required: false, desc: "PDF ou Excel, max 10 Mo" }),
      q(qid(),"long",     "Pourquoi ce programme ?",        { required: true }),
      q(qid(),"long",     "Objectifs post-programme",       { required: true }),
      q(qid(),"dropdown", "Disponibilité (jours/semaine)",  { required: true,  options: ["1-2 jours","3-4 jours","Temps plein"] }),
      q(qid(),"dropdown", "Comment avez-vous entendu parler de nous ?", { required: false, options: ["Réseaux sociaux","Bouche-à-oreille","Presse","Événement","Autre"] }),
    ],
  },

  // 3. EDTECH 2026
  {
    programmeSlug: "edtech-2026",
    title:    "Formulaire — Programme EdTech 2026",
    subtitle: "Candidature au programme d'accélération EdTech 2026",
    description: "Programme dédié aux solutions innovantes dans l'éducation, la formation et l'apprentissage.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                          { required: true }),
      q(qid(),"short",    "Nom",                             { required: true }),
      q(qid(),"short",    "Email",                           { required: true }),
      q(qid(),"short",    "Téléphone",                       { required: true }),
      q(qid(),"short",    "LinkedIn",                        { required: false }),
      q(qid(),"dropdown", "Rôle",                            { required: true, options: ["CEO / Fondateur","CTO","CPO","Directeur Pédagogique","Autre"] }),
      q(qid(),"short",    "Nom de la startup",               { required: true }),
      q(qid(),"short",    "Site web",                        { required: false }),
      q(qid(),"short",    "Année de création",               { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",              { required: true, options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"dropdown", "Public cible",                    { required: true, options: ["Enfants (0-12 ans)","Adolescents (13-18 ans)","Étudiants universitaires","Professionnels","Entreprises (B2B)","Tous publics"] }),
      q(qid(),"dropdown", "Niveau scolaire visé",            { required: false, options: ["Primaire","Collège/Lycée","Supérieur","Formation professionnelle","Non applicable"] }),
      q(qid(),"short",    "Domaine d'enseignement",          { required: true }),
      q(qid(),"long",     "Problème adressé",                { required: true }),
      q(qid(),"long",     "Solution proposée",               { required: true }),
      q(qid(),"long",     "Approche pédagogique",            { required: true }),
      q(qid(),"dropdown", "Mode de délivrance",              { required: true, options: ["100% en ligne","Hybride","Présentiel avec support digital","Mobile-first"] }),
      q(qid(),"dropdown", "Stade",                           { required: true, options: ["Concept","Prototype","Pilote","Commercialisé"] }),
      q(qid(),"short",    "Nombre d'apprenants actifs",      { required: false }),
      q(qid(),"short",    "Taux de complétion (%)",          { required: false }),
      q(qid(),"long",     "Métriques d'impact mesurables",   { required: true }),
      q(qid(),"long",     "Partenariats institutionnels",    { required: false, desc: "Écoles, universités, ministères..." }),
      q(qid(),"dropdown", "Modèle de revenus",               { required: true, options: ["Freemium","Abonnement B2C","Abonnement B2B","Vente de contenu","Marketplace","Subvention/Grant","Mixte"] }),
      q(qid(),"long",     "Politique tarifaire",             { required: true }),
      q(qid(),"short",    "ARR actuel (USD)",                { required: false }),
      q(qid(),"file",     "Pitch Deck (PDF)",                { required: true }),
      q(qid(),"short",    "Lien démo vidéo",                 { required: false }),
      q(qid(),"long",     "Pourquoi ce programme ?",         { required: true }),
      q(qid(),"long",     "Objectifs post-programme",        { required: true }),
    ],
  },

  // 4. AGRITECH 2026
  {
    programmeSlug: "agritech-2026",
    title:    "Formulaire — Programme AgriTech 2026",
    subtitle: "Candidature au programme d'accélération AgriTech 2026",
    description: "Validation marché et adéquation produit pour les startups agri-alimentaires et technologies agricoles.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                             { required: true }),
      q(qid(),"short",    "Nom",                                { required: true }),
      q(qid(),"short",    "Email",                              { required: true }),
      q(qid(),"short",    "Téléphone",                          { required: true }),
      q(qid(),"dropdown", "Rôle",                               { required: true, options: ["CEO / Fondateur","CTO","Agronome","Expert terrain","Autre"] }),
      q(qid(),"short",    "Nom de la startup",                  { required: true }),
      q(qid(),"short",    "Site web",                           { required: false }),
      q(qid(),"short",    "Année de création",                  { required: true }),
      q(qid(),"short",    "Région d'opération",                 { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",                 { required: true, options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"dropdown", "Catégorie AgriTech",                 { required: true, options: ["Agriculture de précision","Gestion de l'eau","Supply chain alimentaire","Marketplace agricole","BioTech / semences","Agroforesterie","Élevage connecté","Autre"] }),
      q(qid(),"dropdown", "Type d'agriculteurs ciblés",         { required: true, options: ["Petits exploitants (<5ha)","Exploitations moyennes","Grandes exploitations","Coopératives","Agro-industrie"] }),
      q(qid(),"long",     "Problème adressé",                   { required: true }),
      q(qid(),"long",     "Solution proposée",                  { required: true }),
      q(qid(),"long",     "Technologies utilisées",             { required: true, desc: "IoT, IA, drones, bio-intrants, etc." }),
      q(qid(),"long",     "Impact environnemental / durabilité",{ required: true }),
      q(qid(),"dropdown", "Stade",                              { required: true, options: ["Recherche","Prototype","Pilote terrain","Commercialisé"] }),
      q(qid(),"short",    "Nb d'agriculteurs en pilote",        { required: false }),
      q(qid(),"dropdown", "Modèle de revenus",                  { required: true, options: ["Vente hardware","SaaS / Abonnement","Commission","Vente de data","Mixte"] }),
      q(qid(),"short",    "MRR actuel (USD)",                   { required: false }),
      q(qid(),"long",     "Partenariats (ONG, coopératives…)",  { required: false }),
      q(qid(),"short",    "Client cible principal",             { required: true }),
      q(qid(),"long",     "Problème principal résolu",          { required: true }),
      q(qid(),"scale",    "Score d'adéquation produit/marché",  { required: false, scaleMin: 1, scaleMax: 10, scaleMinLabel: "Pas confiant", scaleMaxLabel: "Très confiant" }),
      q(qid(),"file",     "Pitch Deck (PDF)",                   { required: true }),
      q(qid(),"file",     "Rapport terrain / pilote",           { required: false }),
      q(qid(),"long",     "Pourquoi ce programme ?",            { required: true }),
      q(qid(),"long",     "Objectifs post-programme",           { required: true }),
    ],
  },

  // 5. CLEANTECH 2026
  {
    programmeSlug: "cleantech-2026",
    title:    "Formulaire — Programme CleanTech 2026",
    subtitle: "Candidature au programme d'accélération CleanTech 2026",
    description: "Accélération de solutions à impact environnemental : énergie renouvelable, économie circulaire, mobilité durable.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                             { required: true }),
      q(qid(),"short",    "Nom",                                { required: true }),
      q(qid(),"short",    "Email",                              { required: true }),
      q(qid(),"short",    "Téléphone",                          { required: true }),
      q(qid(),"dropdown", "Rôle",                               { required: true, options: ["CEO / Fondateur","CTO","Ingénieur R&D","Autre"] }),
      q(qid(),"short",    "Nom de la startup",                  { required: true }),
      q(qid(),"short",    "Site web",                           { required: false }),
      q(qid(),"short",    "Année de création",                  { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",                 { required: true, options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"dropdown", "Statut brevets / PI",                { required: false, options: ["Aucun","En cours de dépôt","Brevet(s) déposé(s)","Brevet(s) accordé(s)"] }),
      q(qid(),"dropdown", "Catégorie CleanTech",                { required: true, options: ["Énergie renouvelable","Efficacité énergétique","Mobilité durable","Économie circulaire","Gestion des déchets","Eau & Assainissement","Carbon Tech","Autre"] }),
      q(qid(),"long",     "Problème environnemental adressé",   { required: true }),
      q(qid(),"long",     "Solution proposée",                  { required: true }),
      q(qid(),"dropdown", "Niveau de maturité (TRL)",           { required: true, options: ["TRL 1-3 (Recherche)","TRL 4-6 (Développement)","TRL 7-9 (Déploiement)"] }),
      q(qid(),"short",    "Impact CO₂ estimé (tonnes/an)",      { required: false }),
      q(qid(),"long",     "ODD des Nations Unies alignés",      { required: false, desc: "Ex: ODD 7 (Énergie propre), ODD 13 (Climat)..." }),
      q(qid(),"dropdown", "Stade",                              { required: true, options: ["R&D","Prototype","Pilote","Commercialisé"] }),
      q(qid(),"dropdown", "Modèle de revenus",                  { required: true, options: ["Vente de hardware","SaaS","ESCO / Energy-as-a-Service","Marketplace","Licencing","Mixte"] }),
      q(qid(),"short",    "MRR actuel (USD)",                   { required: false }),
      q(qid(),"short",    "Besoins de financement (USD)",       { required: true }),
      q(qid(),"long",     "Subventions / financements publics", { required: false }),
      q(qid(),"short",    "Technologie principale",             { required: true, desc: "e.g. Solaire, Biogaz, IA embarquée" }),
      q(qid(),"long",     "Stack technologique",                { required: true, desc: "Listez vos technologies core" }),
      q(qid(),"dropdown", "Brevets / PI",                       { required: false, options: ["Patent filed","Patent pending","Trade secret","None"] }),
      q(qid(),"file",     "Pitch Deck (PDF)",                   { required: true }),
      q(qid(),"file",     "Note technique",                     { required: false }),
      q(qid(),"long",     "Pourquoi ce programme ?",            { required: true }),
      q(qid(),"long",     "Objectifs post-programme",           { required: true }),
    ],
  },

  // 6. AI/ML 2026
  {
    programmeSlug: "aiml-2026",
    title:    "Formulaire — Programme AI/ML 2026",
    subtitle: "Candidature au programme d'accélération AI/ML 2026",
    description: "Accélération des startups développant des solutions basées sur l'intelligence artificielle et le machine learning.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                              { required: true }),
      q(qid(),"short",    "Nom",                                 { required: true }),
      q(qid(),"short",    "Email",                               { required: true }),
      q(qid(),"short",    "Téléphone",                           { required: true }),
      q(qid(),"short",    "Profil GitHub",                       { required: false }),
      q(qid(),"dropdown", "Rôle",                                { required: true, options: ["CEO / Fondateur","CTO / Lead ML Engineer","Data Scientist","Autre"] }),
      q(qid(),"short",    "Nom de la startup",                   { required: true }),
      q(qid(),"short",    "Site web",                            { required: false }),
      q(qid(),"short",    "Année de création",                   { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",                  { required: true, options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"short",    "Nb d'ingénieurs ML/IA",               { required: true }),
      q(qid(),"dropdown", "Catégorie IA",                        { required: true, options: ["NLP / LLM","Vision par ordinateur","Recommandation","Prédiction / Forecasting","Génération de contenu","IA décisionnelle","Robotique","Autre"] }),
      q(qid(),"dropdown", "Secteur d'application",               { required: true, options: ["FinTech","HealthTech","EdTech","AgriTech","Industrie","RH","Retail","Autre"] }),
      q(qid(),"long",     "Problème adressé",                    { required: true }),
      q(qid(),"long",     "Solution IA proposée",                { required: true }),
      q(qid(),"long",     "Approche technique",                  { required: true, desc: "Modèles utilisés, architectures, données d'entraînement..." }),
      q(qid(),"long",     "Stratégie data",                      { required: true }),
      q(qid(),"long",     "Approche éthique / biais IA",         { required: true }),
      q(qid(),"dropdown", "Stade",                               { required: true, options: ["R&D","MVP","Beta","Production"] }),
      q(qid(),"short",    "Performance modèle (ex: accuracy %)", { required: false }),
      q(qid(),"short",    "Nb de clients/utilisateurs actifs",   { required: false }),
      q(qid(),"short",    "MRR actuel (USD)",                    { required: false }),
      q(qid(),"short",    "Nb d'appels API/mois",                { required: false }),
      q(qid(),"dropdown", "Cloud provider",                      { required: true, options: ["AWS","GCP","Azure","On-premise","Mixte","Autre"] }),
      q(qid(),"short",    "Coût compute mensuel (USD)",          { required: false }),
      q(qid(),"long",     "Plan de scalabilité",                 { required: true }),
      q(qid(),"file",     "Pitch Deck (PDF)",                    { required: true }),
      q(qid(),"file",     "Paper / Note technique",              { required: false }),
      q(qid(),"short",    "Lien démo / prototype",               { required: false }),
      q(qid(),"long",     "Pourquoi ce programme ?",             { required: true }),
      q(qid(),"long",     "Objectifs post-programme",            { required: true }),
    ],
  },

  // 7. HEALTHTECH 2025
  {
    programmeSlug: "healthtech-2025",
    title:    "Formulaire — Programme HealthTech 2025",
    subtitle: "Formulaire de retour & suivi — Programme HealthTech 2025",
    description: "Feedback et bilan d'impact pour les participants au programme HealthTech 2025 (programme clôturé).",
    type:   "custom",
    status: "archived",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                                { required: true }),
      q(qid(),"short",    "Nom",                                   { required: true }),
      q(qid(),"short",    "Email",                                 { required: true }),
      q(qid(),"short",    "Nom de la startup",                     { required: true }),
      q(qid(),"scale",    "Note globale du programme",             { required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "Très insatisfait", scaleMaxLabel: "Très satisfait" }),
      q(qid(),"scale",    "Qualité du mentorat",                   { required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "Très faible", scaleMaxLabel: "Excellente" }),
      q(qid(),"scale",    "Valeur du réseau créé",                 { required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "Nul", scaleMaxLabel: "Excellent" }),
      q(qid(),"long",     "Principaux apprentissages",             { required: true }),
      q(qid(),"long",     "Points d'amélioration",                 { required: true }),
      q(qid(),"short",    "Financement levé post-programme (USD)", { required: false }),
      q(qid(),"short",    "Croissance équipe (nb personnes)",      { required: false }),
      q(qid(),"short",    "Croissance revenus (%)",                { required: false }),
      q(qid(),"long",     "Milestone majeur atteint",              { required: false }),
      q(qid(),"long",     "Témoignage (pour publication)",         { required: false }),
      q(qid(),"scale",    "Clarté de la vision",                   { required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "Poor", scaleMaxLabel: "Excellent" }),
      q(qid(),"scale",    "Crédibilité de l'équipe",               { required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "Poor", scaleMaxLabel: "Excellent" }),
      q(qid(),"long",     "Impression générale",                   { required: true, desc: "Synthèse du retour" }),
    ],
  },

  // 8. FOODSTART 2ème ÉDITION
  {
    programmeSlug: "foodstart-2",
    title:    "Formulaire — FoodStart 2ème Édition",
    subtitle: "Candidature au programme d'incubation FoodStart — 2ème Édition",
    description: "Programme d'incubation FoodTech dédié aux startups innovant dans l'alimentation, la restauration et la chaîne alimentaire.",
    type:   "custom",
    status: "published",
    isInherited: false,
    questions: [
      q(qid(),"short",    "Prénom",                             { required: true }),
      q(qid(),"short",    "Nom",                                { required: true }),
      q(qid(),"short",    "Email",                              { required: true }),
      q(qid(),"short",    "Téléphone",                          { required: true }),
      q(qid(),"short",    "Instagram / réseaux",                { required: false }),
      q(qid(),"dropdown", "Rôle",                               { required: true, options: ["CEO / Fondateur","Co-fondateur","Chef / Expert culinaire","Autre"] }),
      q(qid(),"short",    "Nom de la startup",                  { required: true }),
      q(qid(),"short",    "Site web",                           { required: false }),
      q(qid(),"short",    "Année de création",                  { required: true }),
      q(qid(),"dropdown", "Taille de l'équipe",                 { required: true, options: ["1","2-5","6-10","11-20","20+"] }),
      q(qid(),"dropdown", "Forme juridique",                    { required: false, options: ["Non constituée","SARL","SA","Auto-entrepreneur","Autre"] }),
      q(qid(),"dropdown", "Catégorie",                          { required: true, options: ["FoodTech / Deep food","AgriFood / Circuit court","Dark Kitchen / Livraison","Nutrition & Santé","Food Waste / Durabilité","Boissons","Snacking / FMCG","Autre"] }),
      q(qid(),"long",     "Description du produit/service",     { required: true }),
      q(qid(),"long",     "Ce qui vous différencie",            { required: true }),
      q(qid(),"dropdown", "Client cible",                       { required: true, options: ["B2C (particuliers)","B2B (restaurants, hôtels…)","B2B2C","Grande distribution"] }),
      q(qid(),"long",     "Processus de production",            { required: false }),
      q(qid(),"long",     "Certifications (Halal, Bio, HACCP…)",{ required: false }),
      q(qid(),"dropdown", "Stade",                              { required: true, options: ["Idée / Recette","Prototype / Test","Ventes initiales","Croissance"] }),
      q(qid(),"short",    "Ventes mensuelles actuelles (USD)",  { required: false }),
      q(qid(),"dropdown", "Canaux de distribution",             { required: true, options: ["Vente directe","E-commerce","Marketplace","Grande distribution","Restauration","Mixte"] }),
      q(qid(),"short",    "Zone géographique cible",            { required: true }),
      q(qid(),"short",    "Estimation taille marché (USD)",     { required: false }),
      q(qid(),"long",     "Principal défi actuel",              { required: true }),
      q(qid(),"dropdown", "Type de support recherché",          { required: true, options: ["Production & Scaling","Distribution","Marketing","Financement","Réglementation","Tout"] }),
      q(qid(),"short",    "Montant recherché (USD)",            { required: false }),
      q(qid(),"long",     "Pourquoi FoodStart ?",               { required: true }),
      q(qid(),"dropdown", "Disponibilité (jours/semaine)",      { required: true, options: ["1-2 jours","3-4 jours","Temps plein"] }),
      q(qid(),"file",     "Pitch Deck (PDF)",                   { required: true }),
      q(qid(),"file",     "Photo(s) du produit",                { required: false }),
    ],
  },

];

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// =============================================================================

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const formsCol      = db.collection("forms");
    const programmesCol = db.collection("programmes");

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║        SEED v2 — Formulaires compatibles front              ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    // Suppression idempotente
    const knownSlugs = FORM_DEFS.map(d => d.programmeSlug);
    const deleted = await formsCol.deleteMany({ programmeSlug: { $in: knownSlugs } });
    console.log(`🗑️  Suppression des anciens : ${deleted.deletedCount} formulaire(s)\n`);

    let created = 0;
    let linked  = 0;

    for (const def of FORM_DEFS) {
      const { programmeSlug, questions, ...rest } = def;

      // Recherche du programme en base
      const programme = await programmesCol.findOne({ slug: programmeSlug });
      if (!programme) {
        console.log(`⚠️  Programme introuvable : "${programmeSlug}" — ignoré`);
        continue;
      }

      const now         = new Date();
      const frontProgId = PROG_MAP[programmeSlug];
      const accent      = ACCENT[programmeSlug] || "#3B82F6";

      const formDoc = {
        ...rest,
        programme:      frontProgId,
        accent,
        fields:         questions.length,
        responses:      0,
        sentTo:         0,
        sentToNames:    [],
        completionRate: 0,
        questions,
        settings: {
          collectEmail:    false,
          limitOne:        true,
          shuffleQ:        false,
          showProgress:    true,
          confirmationMsg: "Merci pour votre candidature ! Nous reviendrons vers vous sous 72h.",
          deadline:        "",
          reminderDays:    3,
        },
        programmeSlug,
        programmeId:    programme._id,
        createdAt:      now,
        updatedAt:      now,
        version:        1,
      };

      const result = await formsCol.insertOne(formDoc);
      const formId = result.insertedId;

      console.log(`✅ [${def.type.toUpperCase()}] "${def.title}"`);
      console.log(`   └─ ${questions.length} questions · accent ${accent} · _id: ${formId}`);
      created++;

      await programmesCol.updateOne(
        { _id: programme._id },
        {
          $set: {
            formId:      formId,
            formFrontId: frontProgId,
            formAccent:  accent,
            updatedAt:   now,
          }
        }
      );
      linked++;
    }

    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║  ✅ Créés   : ${String(created).padEnd(4)} | 🔗 Programmes liés : ${String(linked).padEnd(4)}       ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

    // Rapport final
    console.log("📋  État final\n");
    console.log("  Programmes :");
    const programmes = await programmesCol.find({}, { projection: { slug:1, titre:1, formId:1, status:1 } }).sort({ slug:1 }).toArray();
    for (const p of programmes) {
      const icon = p.formId ? "✅" : "❌";
      const fid  = p.formId ? String(p.formId).slice(-6) : "—";
      console.log(`    ${icon} [${(p.status||"?").padEnd(9)}] ${(p.slug||"").padEnd(28)} formId: …${fid}`);
    }

    const totalForms   = await formsCol.countDocuments();
    const linkedForms  = await formsCol.countDocuments({ programme: { $ne: null } });
    const basicForms   = await formsCol.countDocuments({ programme: null });

    console.log(`\n  Total forms en base : ${totalForms}`);
    console.log(`  Dont liés programme : ${linkedForms}`);
    console.log(`  Formulaires de base : ${basicForms}\n`);

  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});