'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const Icons = {
  Star: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Filter: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Search: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Building: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function FounderMatches() {
  const { user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const investors = [
    {
      id: 1,
      name: 'FinTech Ventures',
      logo: 'FV',
      focus: ['Fintech', 'Banking', 'Payments'],
      stage: ['Seed', 'Series A'],
      investmentRange: '500K - 2M',
      match: 95,
      location: 'Tunis',
      founded: 2018,
      description: 'Investment fund specializing in FinTech startups in the MENA region.',
      meetingScheduled: false
    },
    {
      id: 2,
      name: 'Innovation Capital',
      logo: 'IC',
      focus: ['AI', 'Machine Learning', 'SaaS'],
      stage: ['Pre-seed', 'Seed'],
      investmentRange: '250K - 1M',
      match: 88,
      location: 'Paris',
      founded: 2020,
      description: 'Early-stage fund investing in innovative high-growth startups.',
      meetingScheduled: false
    },
    {
      id: 3,
      name: 'Mediterranean Fund',
      logo: 'MF',
      focus: ['MedTech', 'AgriTech', 'CleanTech'],
      stage: ['Seed', 'Series A'],
      investmentRange: '300K - 1.5M',
      match: 82,
      location: 'Casablanca',
      founded: 2015,
      description: 'Investment fund focused on Mediterranean impact startups.',
      meetingScheduled: true,
      meetingDate: '2026-04-15T14:00:00'
    },
    {
      id: 4,
      name: 'Tech Growth Partners',
      logo: 'TG',
      focus: ['SaaS', 'Marketplace', 'E-commerce'],
      stage: ['Series A', 'Series B'],
      investmentRange: '1M - 5M',
      match: 76,
      location: 'Dubai',
      founded: 2012,
      description: 'Growth fund supporting high-potential tech startups.',
      meetingScheduled: false
    },
    {
      id: 5,
      name: 'Digital Horizon',
      logo: 'DH',
      focus: ['Digital', 'Web3', 'Blockchain'],
      stage: ['Pre-seed', 'Seed'],
      investmentRange: '150K - 800K',
      match: 71,
      location: 'Berlin',
      founded: 2021,
      description: 'Early-stage fund investing in innovative digital startups.',
      meetingScheduled: false
    },
    {
      id: 6,
      name: 'Impact Ventures',
      logo: 'IV',
      focus: ['Social Impact', 'Sustainability', 'Education'],
      stage: ['Seed', 'Series A'],
      investmentRange: '200K - 1.2M',
      match: 68,
      location: 'London',
      founded: 2017,
      description: 'Impact fund investing in startups with social and environmental missions.',
      meetingScheduled: false
    }
  ];

  const filteredInvestors = investors.filter(investor => {
    if (filter !== 'all' && filter === 'scheduled') {
      return investor.meetingScheduled;
    }
    if (filter !== 'all' && filter === 'available') {
      return !investor.meetingScheduled;
    }
    if (searchTerm) {
      return investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             investor.focus.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  if (!mounted) return null;

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

          .match-badge {
            transition: all 0.2s ease;
          }
          .match-badge:hover {
            transform: scale(1.05);
          }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    INVESTOR MATCHING
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Recommended Investors
                </h1>
                <p className="text-blue-100 text-base max-w-2xl">
                  Discover investors that best match your profile
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search investor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All ({investors.length})
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'scheduled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Meetings Scheduled ({investors.filter(i => i.meetingScheduled).length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'available'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Available ({investors.filter(i => !i.meetingScheduled).length})
            </button>
          </div>

          {/* Investors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInvestors.map((investor, idx) => (
              <div
                key={investor.id}
                className="glass-card rounded-xl overflow-hidden hover-scale transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl">
                        {investor.logo}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{investor.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info" size="sm">{investor.location}</Badge>
                          <span className="text-xs text-gray-400">Founded {investor.founded}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center match-badge">
                        <span className="text-white font-bold text-xl">{investor.match}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Match</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {investor.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {investor.focus.map((f, i) => (
                      <Badge key={i} variant="outline" size="sm">{f}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Investment Range</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{investor.investmentRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Preferred Stages</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{investor.stage.join(', ')}</p>
                    </div>
                  </div>

                  {investor.meetingScheduled && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2">
                      <Icons.Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-400">
                        Meeting scheduled for {new Date(investor.meetingDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link href={`/dashboard/founder/matches/${investor.id}`} className="flex-1">
                      <Button variant="primary" className="w-full">
                        View Profile
                        <Icons.ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="flex-1">
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredInvestors.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <Icons.Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No investors found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Adjust your search criteria or check back later for new investor matches.
              </p>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-start">
            <Link href="/dashboard/founder">
              <Button variant="outline" className="flex items-center gap-2">
                <Icons.ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Matching Program</h3>
                  <p className="text-white/60 text-sm">Improve your profile to increase matches</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">AI</p>
                  <p className="text-white/60 text-xs">Smart recommendations</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">REALTIME</p>
                  <p className="text-white/60 text-xs">Daily updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}