// src/app/hooks/useAdminRoles.js

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    return res.json();
  }, [accessToken]);
}

export function useAdminRoles() {
  const authFetch = useAuthFetch();

  const [roles,   setRoles]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, system: 0, custom: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch('/api/admin/roles');
      setRoles(data.roles || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const createRole = useCallback(async (payload) => {
    const data = await authFetch('/api/admin/roles', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    setRoles(prev => [...prev, { ...data.role, userCount: 0 }]);
    setStats(prev => ({ ...prev, total: prev.total + 1, custom: prev.custom + 1 }));
    return data;
  }, [authFetch]);

  const updateRole = useCallback(async (roleId, payload) => {
    const data = await authFetch(`/api/admin/roles/${roleId}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...payload } : r));
    return data;
  }, [authFetch]);

  const updateRolePermissions = useCallback(async (roleId, permissions) => {
    const data = await authFetch(`/api/admin/roles/${roleId}/permissions`, {
      method: 'PATCH',
      body:   JSON.stringify({ permissions }),
    });
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions } : r));
    return data;
  }, [authFetch]);

  const deleteRole = useCallback(async (roleId) => {
    await authFetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
    setRoles(prev => prev.filter(r => r.id !== roleId));
    setStats(prev => ({ ...prev, total: prev.total - 1, custom: prev.custom - 1 }));
  }, [authFetch]);

  const duplicateRole = useCallback(async (roleId) => {
    const data = await authFetch(`/api/admin/roles/${roleId}/duplicate`, { method: 'POST' });
    setRoles(prev => [...prev, { ...data.role, userCount: 0 }]);
    setStats(prev => ({ ...prev, total: prev.total + 1, custom: prev.custom + 1 }));
    return data;
  }, [authFetch]);

  return {
    roles, stats, loading, error,
    fetchRoles,
    createRole, updateRole, updateRolePermissions, deleteRole, duplicateRole,
  };
}