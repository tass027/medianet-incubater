import { useState, useEffect, useCallback } from 'react';
import { axiosAuth } from '@/app/store/slices/authSlice';

export function useInvestors(filtres = {}) {
  const [investors, setInvestors]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]           = useState(null);

  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtres.type     && filtres.type     !== 'tous') params.append('type',      filtres.type);
      if (filtres.secteur  && filtres.secteur  !== 'tous') params.append('secteur',   filtres.secteur);
      if (filtres.stade    && filtres.stade    !== 'tous') params.append('stade',     filtres.stade);
      if (filtres.recherche && filtres.recherche.trim())   params.append('recherche', filtres.recherche);

      // ✅ Correction : /api/investors au lieu de /investors
      const res = await axiosAuth.get(`/api/investors?${params.toString()}`);
      setInvestors(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Investors error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors du chargement des investisseurs.');
    } finally {
      setLoading(false);
    }
  }, [filtres.type, filtres.secteur, filtres.stade, filtres.recherche]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      // ✅ Correction : /api/investors/stats
      const res = await axiosAuth.get('/api/investors/stats');
      setStats(res.data.data || null);
    } catch (err) {
      console.error('❌ Stats error:', err.response?.data || err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvestors(); }, [fetchInvestors]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const ajouterInvestisseur = async (data) => {
    const res = await axiosAuth.post('/api/investors', data);
    const nouveau = res.data.data;
    setInvestors(prev => [nouveau, ...prev]);
    await fetchStats();
    return nouveau;
  };

  const supprimerInvestisseur = async (id) => {
    await axiosAuth.delete(`/api/investors/${id}`);
    setInvestors(prev => prev.filter(i => i._id !== id));
    await fetchStats();
  };

  const validerMatch = async (investorId, matchId) => {
    const res = await axiosAuth.patch(`/api/investors/${investorId}/matches/${matchId}/valider`);
    const mis = res.data.data;
    setInvestors(prev => prev.map(i => i._id === investorId ? mis : i));
    await fetchStats();
    return mis;
  };

  const rejeterMatch = async (investorId, matchId) => {
    const res = await axiosAuth.patch(`/api/investors/${investorId}/matches/${matchId}/rejeter`);
    const mis = res.data.data;
    setInvestors(prev => prev.map(i => i._id === investorId ? mis : i));
    await fetchStats();
    return mis;
  };
  

  return {
    investors,
    stats,
    loading,
    statsLoading,
    error,
    refetch: fetchInvestors,
    ajouterInvestisseur,
    supprimerInvestisseur,
    validerMatch,
    rejeterMatch,
  };
}