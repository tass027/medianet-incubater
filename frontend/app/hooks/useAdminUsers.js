// src/app/hooks/useAdminUsers.js
// Hook React pour la gestion des utilisateurs via l'API admin réelle

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Helper fetch avec auth ───────────────────────────────────────────────────
function useAuthFetch() {
  const { accessToken } = useSelector(s => s.auth); // ✅ was: { token }

  return useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // ✅ was: token
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const d = await res.json(); msg = d.message || msg; } catch {}
      throw new Error(msg);
    }

    // CSV export → blob
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/csv')) return res.blob();
    return res.json();
  }, [accessToken]);
}

// ═════════════════════════════════════════════════════════════════════════════
// useAdminUsers — liste paginée + CRUD
// ═════════════════════════════════════════════════════════════════════════════
export function useAdminUsers() {
  const authFetch = useAuthFetch();

  // ── State ─────────────────────────────────────────────────────────────────
  const [users,       setUsers]       = useState([]);
  const [stats,       setStats]       = useState({});
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Filtres / tri
  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);
  const [sort,         setSort]         = useState('-createdAt');

  // Sélection multiple
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce search
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  '12',
        sort,
        ...(debouncedSearch  ? { search: debouncedSearch }     : {}),
        ...(filterRole   !== 'all' ? { role:   filterRole }   : {}),
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
      });

      const data = await authFetch(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setStats(data.stats || {});
      setPagination(data.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
      setSelectedIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, sort, debouncedSearch, filterRole, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createUser = useCallback(async (payload) => {
    const data = await authFetch('/api/admin/users', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    await fetchUsers();
    return data;
  }, [authFetch, fetchUsers]);

  const updateUser = useCallback(async (id, payload) => {
    const data = await authFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, ...data.user } : u));
    return data;
  }, [authFetch]);

  const updateStatus = useCallback(async (id, status) => {
    const data = await authFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, ...data.user } : u));
    return data;
  }, [authFetch]);

  const updatePermissions = useCallback(async (id, permissions) => {
    const data = await authFetch(`/api/admin/users/${id}/permissions`, {
      method: 'PATCH',
      body:   JSON.stringify({ permissions }),
    });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, permissions } : u));
    return data;
  }, [authFetch]);

  const deleteUser = useCallback(async (id) => {
    await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u._id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, [authFetch]);

  const bulkAction = useCallback(async (action, value) => {
    await authFetch('/api/admin/users/bulk', {
      method: 'POST',
      body:   JSON.stringify({ action, ids: selectedIds, value }),
    });
    await fetchUsers();
  }, [authFetch, selectedIds, fetchUsers]);

  const exportCSV = useCallback(async () => {
    const blob = await authFetch('/api/admin/users/export');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `users_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [authFetch]);

  // ── Sélection ─────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === users.length ? [] : users.map(u => u._id)
    );
  }, [users]);

  return {
    users, stats, pagination, loading, error,
    search, setSearch,
    filterRole, setFilterRole,
    filterStatus, setFilterStatus,
    page, setPage,
    sort, setSort,
    selectedIds, toggleSelect, selectAll,
    fetchUsers,
    createUser, updateUser, updateStatus, updatePermissions, deleteUser,
    bulkAction, exportCSV,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// useAdminUserDetail — détail d'un utilisateur
// ═════════════════════════════════════════════════════════════════════════════
export function useAdminUserDetail(id) {
  const authFetch = useAuthFetch();

  const [user,     setUser]     = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch(`/api/admin/users/${id}`);
      setUser(data.user);
      setActivity(data.activity || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const updateUser = useCallback(async (payload) => {
    const data = await authFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    setUser(prev => ({ ...prev, ...data.user }));
    return data;
  }, [authFetch, id]);

  const updatePermissions = useCallback(async (permissions) => {
    const data = await authFetch(`/api/admin/users/${id}/permissions`, {
      method: 'PATCH',
      body:   JSON.stringify({ permissions }),
    });
    setUser(prev => ({ ...prev, permissions }));
    return data;
  }, [authFetch, id]);

  const updateStatus = useCallback(async (status) => {
    const data = await authFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    });
    setUser(prev => ({ ...prev, ...data.user }));
    return data;
  }, [authFetch, id]);

  return { user, activity, loading, error, fetchUser, updateUser, updatePermissions, updateStatus };
}