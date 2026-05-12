// Service de matching entre startups et investisseurs
// Algorithme basé sur 6 critères avec poids différents

export const matchingService = {
  // Critères de matching avec leurs poids (0-100)
  criteria: {
    INDUSTRY: { weight: 30, name: 'Industry Match' },
    STAGE: { weight: 20, name: 'Stage Match' },
    AMOUNT: { weight: 15, name: 'Investment Amount' },
    LOCATION: { weight: 15, name: 'Location' },
    TEAM: { weight: 10, name: 'Team Experience' },
    TRACTION: { weight: 10, name: 'Traction' }
  },

  // Calculer le score de matching entre une startup et un investisseur
  calculateMatchScore(startup, investor) {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. Industry Match (30%)
    const industryScore = this.calculateIndustryMatch(
      startup.industry,
      investor.preferences?.industries || []
    );
    totalScore += industryScore * this.criteria.INDUSTRY.weight;
    maxPossibleScore += this.criteria.INDUSTRY.weight;

    // 2. Stage Match (20%)
    const stageScore = this.calculateStageMatch(
      startup.stage,
      investor.preferences?.stages || []
    );
    totalScore += stageScore * this.criteria.STAGE.weight;
    maxPossibleScore += this.criteria.STAGE.weight;

    // 3. Investment Amount (15%)
    const amountScore = this.calculateAmountMatch(
      startup.askingAmount,
      investor.preferences?.minInvestment,
      investor.preferences?.maxInvestment
    );
    totalScore += amountScore * this.criteria.AMOUNT.weight;
    maxPossibleScore += this.criteria.AMOUNT.weight;

    // 4. Location (15%)
    const locationScore = this.calculateLocationMatch(
      startup.location,
      investor.preferences?.locations || []
    );
    totalScore += locationScore * this.criteria.LOCATION.weight;
    maxPossibleScore += this.criteria.LOCATION.weight;

    // 5. Team Experience (10%)
    const teamScore = this.calculateTeamScore(startup.team);
    totalScore += teamScore * this.criteria.TEAM.weight;
    maxPossibleScore += this.criteria.TEAM.weight;

    // 6. Traction (10%)
    const tractionScore = this.calculateTractionScore(startup.traction);
    totalScore += tractionScore * this.criteria.TRACTION.weight;
    maxPossibleScore += this.criteria.TRACTION.weight;

    // Score final sur 100
    const finalScore = Math.round((totalScore / maxPossibleScore) * 100);
    
    return {
      score: finalScore,
      breakdown: {
        industry: Math.round(industryScore * 100),
        stage: Math.round(stageScore * 100),
        amount: Math.round(amountScore * 100),
        location: Math.round(locationScore * 100),
        team: Math.round(teamScore * 100),
        traction: Math.round(tractionScore * 100)
      }
    };
  },

  // Industry match (0-1)
  calculateIndustryMatch(startupIndustry, investorIndustries) {
    if (!investorIndustries.length) return 0.5; // No preference = neutral
    if (investorIndustries.includes(startupIndustry)) return 1;
    if (investorIndustries.some(i => this.areRelatedIndustries(i, startupIndustry))) return 0.7;
    return 0.2;
  },

  // Stage match (0-1)
  calculateStageMatch(startupStage, investorStages) {
    if (!investorStages.length) return 0.5;
    if (investorStages.includes(startupStage)) return 1;
    
    // Stages progression: Pre-seed → Seed → Series A → Series B
    const stageOrder = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c'];
    const startupIdx = stageOrder.indexOf(startupStage);
    
    const matchScores = investorStages.map(stage => {
      const investorIdx = stageOrder.indexOf(stage);
      const diff = Math.abs(startupIdx - investorIdx);
      if (diff === 0) return 1;
      if (diff === 1) return 0.6;
      if (diff === 2) return 0.3;
      return 0.1;
    });
    
    return Math.max(...matchScores);
  },

  // Amount match (0-1)
  calculateAmountMatch(askingAmount, minInvestment = 0, maxInvestment = Infinity) {
    if (!askingAmount) return 0.3;
    if (askingAmount >= minInvestment && askingAmount <= maxInvestment) {
      // Préférence pour le milieu de la fourchette
      const range = maxInvestment - minInvestment;
      const optimal = minInvestment + (range / 2);
      const distance = Math.abs(askingAmount - optimal);
      return Math.max(0.5, 1 - (distance / (range || 1)));
    }
    return 0.1;
  },

  // Location match (0-1)
  calculateLocationMatch(startupLocation, investorLocations) {
    if (!investorLocations.length) return 0.5;
    if (investorLocations.includes(startupLocation)) return 1;
    if (investorLocations.includes('remote') || investorLocations.includes('any')) return 0.8;
    
    // Check regions (simplifié)
    const regions = {
      'sf': ['bay area', 'silicon valley', 'san francisco'],
      'ny': ['new york', 'nyc', 'brooklyn'],
      'europe': ['london', 'berlin', 'paris', 'amsterdam']
    };
    
    for (const [region, cities] of Object.entries(regions)) {
      if (investorLocations.includes(region) && cities.includes(startupLocation.toLowerCase())) {
        return 0.7;
      }
    }
    
    return 0.3;
  },

  // Team score (0-1)
  calculateTeamScore(team) {
    if (!team) return 0.3;
    
    let score = 0;
    let criteria = 0;
    
    // Founders avec expérience
    if (team.founders) {
      const experiencedFounders = team.founders.filter(f => f.yearsExperience > 5).length;
      score += Math.min(1, experiencedFounders / 2) * 0.4;
      criteria += 0.4;
    }
    
    // Complétude de l'équipe
    if (team.hasCTO) score += 0.2;
    if (team.hasCMO) score += 0.15;
    if (team.hasHeadOfSales) score += 0.15;
    criteria += 0.5;
    
    // Éducation
    if (team.hasPHD) score += 0.1;
    if (team.hasMBA) score += 0.1;
    criteria += 0.1;
    
    return criteria > 0 ? score / criteria : 0.5;
  },

  // Traction score (0-1)
  calculateTractionScore(traction) {
    if (!traction) return 0.2;
    
    let score = 0;
    let criteria = 0;
    
    // Revenue
    if (traction.mrr) {
      if (traction.mrr > 100000) score += 1;
      else if (traction.mrr > 50000) score += 0.8;
      else if (traction.mrr > 10000) score += 0.6;
      else if (traction.mrr > 1000) score += 0.4;
      else score += 0.2;
      criteria += 0.4;
    }
    
    // Users/Customers
    if (traction.users) {
      if (traction.users > 10000) score += 1;
      else if (traction.users > 5000) score += 0.8;
      else if (traction.users > 1000) score += 0.6;
      else if (traction.users > 100) score += 0.4;
      else score += 0.2;
      criteria += 0.3;
    }
    
    // Growth rate
    if (traction.growthRate) {
      if (traction.growthRate > 50) score += 1;
      else if (traction.growthRate > 30) score += 0.8;
      else if (traction.growthRate > 20) score += 0.6;
      else if (traction.growthRate > 10) score += 0.4;
      else score += 0.2;
      criteria += 0.3;
    }
    
    return criteria > 0 ? score / criteria : 0.3;
  },

  // Helper: vérifier si deux industries sont liées
  areRelatedIndustries(ind1, ind2) {
    const relatedGroups = {
      'fintech': ['banking', 'payments', 'insurance', 'crypto'],
      'healthtech': ['biotech', 'medtech', 'wellness', 'healthcare'],
      'edtech': ['elearning', 'education', 'training'],
      'saas': ['software', 'cloud', 'b2b', 'enterprise'],
      'ecommerce': ['retail', 'marketplace', 'd2c'],
      'ai': ['machine learning', 'data', 'analytics', 'automation']
    };
    
    for (const [group, industries] of Object.entries(relatedGroups)) {
      if (industries.includes(ind1) && industries.includes(ind2)) return true;
    }
    return false;
  },

  // Obtenir les meilleurs matches pour une startup
  getTopMatchesForStartup(startup, investors, limit = 10) {
    const matches = investors.map(investor => ({
      investor,
      ...this.calculateMatchScore(startup, investor)
    }));
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  // Obtenir les meilleurs matches pour un investisseur
  getTopMatchesForInvestor(investor, startups, limit = 10) {
    const matches = startups.map(startup => ({
      startup,
      ...this.calculateMatchScore(startup, investor)
    }));
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
};

export default matchingService;