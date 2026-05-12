'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import useMentorResources from '@/app/hooks/useMentorResources';
import useMentorStartups from '@/app/hooks/useMentorStartups';

const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Link: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Document: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Video: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.866v6.268a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Template: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
};

const TYPE_ICONS = {
  link:     Icons.Link,
  document: Icons.Document,
  video:    Icons.Video,
  template: Icons.Template,
};

const TYPE_COLORS = {
  link:     'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  document: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  video:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  template: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
};

export default function MentorResourcesPage() {
  const [mounted,    setMounted]    = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStartup, setFilterStartup] = useState('');

  const { startups }                                     = useMentorStartups();
  const { resources, loading, error, createResource, deleteResource } =
    useMentorResources(filterStartup || null);

  const [form, setForm] = useState({
    title:          '',
    description:    '',
    type:           'link',
    url:            '',
    targetStartups: [],
    tags:           '',
  });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type) return;
    setSubmitting(true);
    try {
      await createResource({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        targetStartups: form.targetStartups,
      });
      setForm({ title: '', description: '', type: 'link', url: '', targetStartups: [], tags: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    try { await deleteResource(id); } catch (e) { console.error(e); }
  };

  const filtered = resources.filter((r) => !filterType || r.type === filterType);

  return (
    <ProtectedRoute allowedRoles={['mentor']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }
          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card { background: #1e293b; border: 1px solid #334155; }
          .glass-card:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -12px rgba(0,0,0,0.12); }
          .input-base {
            width: 100%; padding: 0.625rem 1rem;
            border: 1px solid #e5e7eb; border-radius: 0.75rem;
            background: white; color: #111827; transition: all 0.2s;
          }
          :global(.dark) .input-base { border-color: #374151; background: #1f2937; color: #f9fafb; }
          .input-base:focus { outline: none; border-color: #006d94; box-shadow: 0 0 0 3px rgba(0,109,148,0.15); }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                  <Link href="/dashboard/mentor/startups">
                    <button className="flex items-center gap-2 text-white/80 hover:text-white transition">
                      <Icons.ArrowLeft className="w-4 h-4" />
                      Retour
                    </button>
                  </Link>
                <Button
                  variant="primary"
                  className="!bg-white !text-[#006d94] flex items-center gap-2"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Icons.Plus className="w-4 h-4" />
                  Ajouter une ressource
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-white">Ressources</h1>
              <p className="text-blue-100 mt-1">Documents, liens et templates pour vos startups</p>
            </div>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Nouvelle ressource</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
                    <input type="text" value={form.title} onChange={set('title')} required className="input-base" placeholder="Nom de la ressource…" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <select value={form.type} onChange={set('type')} className="input-base">
                      <option value="link">Lien</option>
                      <option value="document">Document</option>
                      <option value="video">Vidéo</option>
                      <option value="template">Template</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL</label>
                  <input type="url" value={form.url} onChange={set('url')} className="input-base" placeholder="https://…" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={2} className="input-base resize-none" placeholder="Décrivez brièvement cette ressource…" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Partager avec (laisser vide = toutes les startups)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {startups.map((s) => {
                      const selected = form.targetStartups.includes(s._id);
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            targetStartups: selected
                              ? prev.targetStartups.filter((id) => id !== s._id)
                              : [...prev.targetStartups, s._id],
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            selected
                              ? 'bg-[#006d94] text-white border-[#006d94]'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#006d94]'
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags (séparés par virgule)</label>
                  <input type="text" value={form.tags} onChange={set('tags')} className="input-base" placeholder="fintech, business model, pitch…" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Ajout…' : 'Ajouter la ressource'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStartup}
              onChange={(e) => setFilterStartup(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="">Toutes les startups</option>
              {startups.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="link">Liens</option>
              <option value="document">Documents</option>
              <option value="video">Vidéos</option>
              <option value="template">Templates</option>
            </select>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="glass-card rounded-xl p-8 text-center text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-gray-400">
              <Icons.Document className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Aucune ressource trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((resource) => {
                const TypeIcon = TYPE_ICONS[resource.type] || Icons.Document;
                return (
                  <div key={resource._id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[resource.type]}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => handleDelete(resource._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Supprimer"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{resource.description}</p>
                    )}

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#006d94] hover:underline flex items-center gap-1 mb-3"
                      >
                        <Icons.Link className="w-3 h-3" />
                        Accéder à la ressource
                      </a>
                    )}

                    {resource.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                      {resource.targetStartups?.length === 0
                        ? 'Partagé avec toutes les startups'
                        : `Partagé avec ${resource.targetStartups.length} startup${resource.targetStartups.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}