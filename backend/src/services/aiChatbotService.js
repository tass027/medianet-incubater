// src/services/aiChatbotService.js
// Stratégie : règles déterministes pour les questions connues,
// Ollama uniquement pour les questions ouvertes complexes.

const { generate } = require('./ollamaService');
const Programme    = require('../models/Programme');

const RESPONSABLE = {
  nom:   'Nour Chaabouni',
  email: 'nour.chaabouni@medianet.com.tn',
};

// ─── Charger les programmes ouverts ──────────────────────────────────────
async function getProgrammesOuverts() {
  try {
    const programmes = await Programme.find({ statut: 'ouvert' })
      .select('titre secteur dateFin quota placesRestantes')
      .lean();
    return programmes;
  } catch (err) {
    console.error('[aiChatbot] Erreur chargement programmes:', err.message);
    return [];
  }
}

function formatProgrammes(programmes) {
  if (!programmes.length) {
    return 'Aucun programme sectoriel ouvert actuellement — candidature spontanée disponible.';
  }
  return programmes
    .map(p => {
      const places = p.placesRestantes ?? p.quota ?? '?';
      const date   = p.dateFin
        ? new Date(p.dateFin).toLocaleDateString('fr-FR')
        : 'date à confirmer';
      return `- ${p.titre} (${p.secteur}) : ${places} places, clôture le ${date}`;
    })
    .join('\n');
}

// ─── Moteur de règles ─────────────────────────────────────────────────────
// Retourne une réponse string si la question matche une règle, sinon null.
// Les règles sont vérifiées dans l'ordre — la première qui matche gagne.
async function matchRule(message) {
  const msg = message.toLowerCase().trim();

  // ── Programmes ouverts ──
  if (
    msg.match(/programme[s]? ouvert/i) ||
    msg.match(/programmes? (disponible|actuel|en cours|maintenant)/i) ||
    msg.match(/quels? (sont les )?programmes?/i) ||
    msg.match(/liste des programmes?/i) ||
    msg.match(/programmes? (en cours|actif)/i) ||
    msg === 'programmes'
  ) {
    const programmes = await getProgrammesOuverts();
    const liste = formatProgrammes(programmes);
    return `Voici les programmes actuellement ouverts chez MEDIANET Incubator :\n\n${liste}\n\nPour postuler, créez votre compte sur la plateforme et choisissez le programme qui correspond à votre secteur.`;
  }

  // ── Candidature ──
  if (
    msg.match(/comment (candidater|postuler|soumettre)/i) ||
    msg.match(/^(comment|comment faire pour) (candidat|postul)/i) ||
    msg.match(/étapes? (de |pour )?(la )?candidature/i) ||
    msg.match(/comment (faire|procéder|s'inscrire)/i) ||
    msg === 'candidater'
  ) {
    return `Pour candidater à MEDIANET Incubator :\n\n1) Créez votre compte sur la plateforme\n2) Choisissez un programme actif ou soumettez une candidature spontanée\n3) Remplissez le formulaire de candidature (description projet, équipe, secteur)\n4) Suivez l'avancement de votre dossier en temps réel depuis votre tableau de bord\n\nNotre équipe vous répond sous 48h.`;
  }

  // ── Financement ──
  if (
    msg.match(/financ(ement|er)/i) ||
    msg.match(/montant|investissement|fonds|capital/i) ||
    msg.match(/combien (d.argent|de financement)/i) ||
    msg === 'financement'
  ) {
    return `MEDIANET Incubator propose un financement entre **10 000 DT et 150 000 DT** selon le stade de votre startup et le programme sélectionné.\n\nCe financement est assuré en partenariat avec **Africinvest Group**, l'un des principaux fonds d'investissement en Afrique.`;
  }

  // ── Programme d'incubation — concept ──
  if (
    msg.match(/c.est quoi (un |le )?(programme|incubat)/i) ||
    msg.match(/qu.est.ce (qu.un |que le )?(programme|incubat)/i) ||
    msg.match(/expliqu.? (le )?(programme|incubat|concept)/i) ||
    msg.match(/comprend? pas (le )?concept/i) ||
    msg.match(/(kesako|définition|définir) (incubat|programme)/i)
  ) {
    return `Un programme d'incubation est un accompagnement structuré sur 6 à 12 mois pour aider une startup à se développer.\n\nChez MEDIANET Incubator, cela inclut :\n• **Mentorat** : 10h/mois avec des experts dédiés\n• **Formation** : 22 modules (marketing, juridique, finance, tech)\n• **Réseau** : accès à 45+ investisseurs et partenaires\n• **Financement** : entre 10 000 et 150 000 DT\n• **Coworking** : espace de travail à Startup Village, Menzah\n\nL'objectif est de transformer votre idée en entreprise viable et financée.`;
  }

  // ── Planning / avantages programme ──
  if (
    msg.match(/planning|plan(ning)? du programme|calendrier/i) ||
    msg.match(/avantage[s]? (du programme|de l.incubat)/i) ||
    msg.match(/que propose|qu.offre|qu.est.ce qu.on (reçoit|obtient)/i) ||
    msg.match(/bénéfice[s]?|ce que (j.obtiens|on obtient)/i)
  ) {
    return `Le programme MEDIANET Incubator sur 6 à 12 mois comprend :\n\n**Accompagnement :**\n• 10h de mentorat individuel par mois\n• 25 experts sectoriels disponibles\n• 22 formations (branding, marketing digital, juridique, finance)\n\n**Ressources :**\n• Accès au coworking (Startup Village, Menzah, Tunis)\n• Mise en relation avec 45+ investisseurs\n• Financement entre 10 000 et 150 000 DT\n\n**Suivi :**\n• Tableau de bord en temps réel\n• Évaluation continue et feedback hebdomadaire`;
  }

  // ── Contact ──
  if (
    msg.match(/contact(er)?|joindre|nous écrire|email|mail/i) ||
    msg.match(/coordonnées|comment vous (contacter|joindre)/i) ||
    msg === 'contact'
  ) {
    return `Pour nous contacter :\n\n👤 ${RESPONSABLE.nom}\n📧 ${RESPONSABLE.email}\n📍 Startup Village, Menzah, Tunis\n🕐 Disponible lundi–vendredi, 8h–17h`;
  }

  // ── Secteurs acceptés ──
  if (
    msg.match(/secteur[s]? (accepté|éligible|concerné|couvert)/i) ||
    msg.match(/quel[s]? secteur[s]?/i) ||
    msg.match(/domaine[s]? (accepté|éligible)/i) ||
    msg.match(/type[s]? de (startup|projet|entreprise)/i)
  ) {
    return `MEDIANET Incubator accepte les startups des secteurs suivants :\n\n• **FinTech** — services financiers & paiement\n• **EdTech** — éducation & formation\n• **AgriTech / FoodTech** — agriculture & alimentation\n• **HealthTech** — santé & bien-être\n• **CleanTech** — énergie & environnement\n• **AI / ML** — intelligence artificielle\n• **E-commerce tech** — commerce en ligne\n\nCritères essentiels : dimension tech du projet, innovation, modèle économique viable et engagement à suivre toutes les sessions.`;
  }

  // ── Durée ──
  if (
    msg.match(/dur[ée]e? (du programme|de l.incubat|des programmes?)/i) ||
    msg.match(/combien de (temps|mois|semaines)/i) ||
    msg.match(/programme de combien/i)
  ) {
    return `Les programmes MEDIANET Incubator durent entre **6 et 12 mois** selon le programme choisi.\n\nLe programme phare FoodStart dure 6 mois avec 10h de mentorat individuel par mois, 25 experts et 22 formations spécialisées.`;
  }

  // ── Partenaires / investisseurs ──
  if (
    msg.match(/partenaire[s]?|investisseur[s]?|africinvest/i) ||
    msg.match(/qui finance|qui investit/i)
  ) {
    return `MEDIANET Incubator travaille avec **45+ investisseurs et partenaires** en Tunisie, en Afrique et en Europe.\n\nLe partenaire financier principal est **Africinvest Group**, l'un des fonds d'investissement leaders en Afrique. Les startups incubées bénéficient d'une mise en relation directe avec ce réseau.`;
  }

  // ── Critères de sélection ──
  if (
    msg.match(/critère[s]? (de sélection|pour être accepté|pour postuler|d.admission)/i) ||
    msg.match(/comment être (sélectionné|accepté|retenu)/i) ||
    msg.match(/profil recherché|qu.est.ce qu.on recherche/i)
  ) {
    return `MEDIANET Incubator sélectionne les startups sur 4 critères principaux :\n\n1. **Dimension tech** — le projet doit avoir une composante technologique forte\n2. **Innovation** — idée différenciante sur le marché\n3. **Modèle économique** — viabilité et scalabilité du business model\n4. **Engagement** — capacité à suivre toutes les sessions du programme\n\nLes secteurs prioritaires : FinTech, EdTech, AgriTech, HealthTech, CleanTech, AI/ML, e-commerce.`;
  }

  // Aucune règle ne matche → on laisse Ollama répondre
  return null;
}

// ─── System prompt minimal pour Ollama (fallback uniquement) ─────────────
async function buildSystemPrompt() {
  const programmes = await getProgrammesOuverts();
  const liste = formatProgrammes(programmes);

  return `Tu es l'assistant IA de MEDIANET Incubator, Tunis. Réponds en français, max 4 phrases, ton professionnel.
Ne réponds qu'aux questions liées à MEDIANET Incubator.

INFOS CLÉS :
- Incubateur tech tunisien, 25 ans d'expérience, partenaire Africinvest Group
- Financement : 10 000 à 150 000 DT
- Durée : 6 à 12 mois
- Accompagnement : mentorat 10h/mois, 22 formations, 25 experts, coworking
- Secteurs : FinTech, EdTech, AgriTech, HealthTech, CleanTech, AI/ML, e-commerce
- Contact : ${RESPONSABLE.nom} | ${RESPONSABLE.email} | Lun-Ven 8h-17h

PROGRAMMES OUVERTS :
${liste}`;
}

function buildChatPrompt(systemPrompt, history, userMessage) {
  let prompt = systemPrompt + '\n\n';
  history.slice(-6).forEach(msg => {
    prompt += msg.role === 'user'
      ? `Utilisateur: ${msg.content}\n`
      : `Assistant: ${msg.content}\n`;
  });
  prompt += `Utilisateur: ${userMessage}\nAssistant:`;
  return prompt;
}

// ─── Point d'entrée principal ─────────────────────────────────────────────
async function getChatResponse(userMessage, history = []) {
  // 1. Essayer les règles déterministes d'abord
  const ruleAnswer = await matchRule(userMessage);
  if (ruleAnswer) {
    console.log('[aiChatbot] Règle matchée pour:', userMessage.substring(0, 60));
    return ruleAnswer;
  }

  // 2. Fallback Ollama pour les questions ouvertes
  console.log('[aiChatbot] Ollama fallback pour:', userMessage.substring(0, 60));
  const systemPrompt = await buildSystemPrompt();
  const prompt       = buildChatPrompt(systemPrompt, history, userMessage);

  const raw = await generate(prompt, {
    temperature:    0.2,
    num_predict:    400,
    top_p:          0.9,
    repeat_penalty: 1.1,
    timeout:        parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000'),
  });

  return raw.replace(/^Assistant:\s*/i, '').trim();
}

module.exports = { getChatResponse, buildSystemPrompt };