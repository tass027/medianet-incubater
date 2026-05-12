'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Edit: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Globe: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Award: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Building: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

export default function StartupDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => {
      setStartup({
        id: id,
        name: 'TechInnovation',
        sector: 'FinTech',
        stage: 'Amorçage',
        founded: 2024,
        teamSize: 12,
        location: 'Tunis, Tunisie',
        website: 'https://techinnovation.com',
        description: 'TechInnovation est une startup FinTech qui révolutionne les paiements en ligne en Afrique du Nord. Notre solution permet aux commerçants d\'accepter des paiements de manière sécurisée avec des frais réduits de 70% par rapport aux solutions traditionnelles.',
        mission: 'Démocratiser l\'accès aux services financiers en Afrique grâce à la technologie.',
        vision: 'Devenir la plateforme de paiement leader en Afrique d\'ici 2028.',
        keyMetrics: {
          revenue: '45 200 TND',
          users: '2 340',
          growth: '+23%',
          retention: '87%'
        },
        milestones: [
          { title: 'Lancement du MVP', date: '2024-01-15', completed: true },
          { title: 'Premiers 100 utilisateurs', date: '2024-02-20', completed: true },
          { title: 'Financement Amorçage', date: '2024-04-10', completed: true },
          { title: 'Série A', date: '2025-01-15', completed: false, target: true }
        ],
        team: [
          { name: 'Ahmed Ben Ali', role: 'PDG & Fondateur', avatar: 'AB' },
          { name: 'Sara Ben Salem', role: 'Directrice Technique', avatar: 'SB' },
          { name: 'Mehdi Trabelsi', role: 'Lead Développeur', avatar: 'MT' }
        ],
        investors: [
          { name: 'FinTech Ventures', type: 'Amorçage', amount: '500 000 TND', date: '2024-04-10' }
        ],
        awards: [
          { name: 'Meilleure Startup FinTech 2024', organizer: 'Tunisia Digital Summit' },
          { name: 'Prix de l\'Innovation', organizer: 'MEDIANET' }
        ]
      });
      setLoading(false);
    }, 500);
  }, [id]);

  if (!mounted || loading) {
    return (
      <ProtectedRoute allowedRoles={['founder']}>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['founder']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }

          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          .animate-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
          .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }

          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card {
            background: #1e293b;
            border: 1px solid #334155;
          }
          .glass-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15);
          }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* En-tête */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard/founder/startups">
                  <button className="flex items-center gap-2 text-white/80 hover:text-white transition">
                    <Icons.ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                </Link>
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Icons.Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">{startup.name}</h1>
                    <Badge variant="info" size="lg">{startup.sector}</Badge>
                  </div>
                  <p className="text-blue-100 text-base max-w-2xl">
                    {startup.description}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a href={startup.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2">
                    <Icons.Globe className="w-4 h-4" />
                    Site web
                  </a>
                  <Button variant="primary">
                    Postuler au programme
                    <Icons.ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-6 text-blue-100 text-sm">
                <span className="flex items-center gap-1">{startup.location}</span>
                <span className="flex items-center gap-1">Fondée en {startup.founded}</span>
                <span className="flex items-center gap-1">{startup.teamSize} membres</span>
                <span className="flex items-center gap-1">Stade: {startup.stage}</span>
              </div>
            </div>
          </div>

          {/* Indicateurs clés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenus mensuels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{startup.keyMetrics.revenue}</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{startup.keyMetrics.users}</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Croissance</p>
              <p className="text-2xl font-bold text-emerald-600">{startup.keyMetrics.growth}</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Taux de rétention</p>
              <p className="text-2xl font-bold text-primary-600">{startup.keyMetrics.retention}</p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Mission</h2>
              <p className="text-gray-600 dark:text-gray-400">{startup.mission}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Vision</h2>
              <p className="text-gray-600 dark:text-gray-400">{startup.vision}</p>
            </div>
          </div>

          {/* Jalons */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Jalons</h2>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-6">
                  {startup.milestones.map((milestone, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        milestone.completed ? 'bg-emerald-500 text-white' : milestone.target ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {milestone.completed ? <Icons.Check className="w-5 h-5" /> : <span className="text-sm">{idx + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                        <p className="text-sm text-gray-500">{new Date(milestone.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {milestone.target && (
                        <Badge variant="warning" size="sm">Objectif</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Équipe</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {startup.team.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investisseurs & Récompenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Investisseurs</h2>
              </div>
              <div className="p-6">
                {startup.investors.map((investor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{investor.name}</p>
                      <p className="text-sm text-gray-500">{investor.type} - {investor.amount}</p>
                    </div>
                    <Badge variant="info" size="sm">{new Date(investor.date).toLocaleDateString('fr-FR')}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Distinctions</h2>
              </div>
              <div className="p-6">
                {startup.awards.map((award, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Icons.Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{award.name}</p>
                      <p className="text-sm text-gray-500">{award.organizer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Besoin d'accompagnement ?</h3>
                  <p className="text-white/60 text-sm">Notre équipe est à votre disposition</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">MENTORAT</p>
                  <p className="text-white/60 text-xs">Experts à votre écoute</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">RÉSEAU</p>
                  <p className="text-white/60 text-xs">+500 startups accompagnées</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <Link href="/contact" className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2">
                  Nous contacter
                  <Icons.ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}