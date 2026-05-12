'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Card from '@/app/components/common/Card';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import { useSelector } from 'react-redux';
import Link from 'next/link';

// ===================================================
// ICONS
// ===================================================
const Icons = {
  Rocket: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function FounderDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startupData = {
    name: 'TechInnovation',
    sector: 'FinTech',
    stage: 'Seed',
    teamSize: 12,
    matchScore: 87,
    monthlyRevenue: '45K',
    activeUsers: 2340,
    runway: 18,
    burnRate: '25K',
    revenueGrowth: 23,
    usersGrowth: 156,
  };

  const milestones = [
    { title: 'Product Launch', status: 'completed', date: '2 weeks ago' },
    { title: 'First 1000 Users', status: 'completed', date: '1 week ago' },
    { title: 'Series A Pitch', status: 'in-progress', date: 'In 3 days' },
    { title: 'Break Even', status: 'upcoming', date: 'Q2 2026' },
  ];

  const investors = [
    { name: 'FinTech Ventures', focus: 'Fintech specialist', match: 95 },
    { name: 'Innovation Capital', focus: 'AI & Machine Learning', match: 88 },
    { name: 'Mediterranean Fund', focus: 'Mediterranean startups', match: 82 },
    { name: 'Tech Growth Partners', focus: 'Scale-up stage', match: 76 },
  ];

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
          .dark-glass {
            background: linear-gradient(135deg, rgba(0,82,110,0.95), rgba(0,109,148,0.95));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
          }

          :global(.dark) .text-gray-900 { color: #f1f5f9; }
          :global(.dark) .text-gray-700 { color: #cbd5e1; }
          :global(.dark) .text-gray-600 { color: #94a3b8; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header Section */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    FOUNDER SPACE
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">Dashboard</span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Welcome, {user?.name?.split(' ')[0] || 'Founder'}
                </h1>
                <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                  Manage your startup and track your progress
                </p>
                <div className="flex items-center gap-4 text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <Icons.Clock className="w-4 h-4 text-blue-200" />
                    <span className="mono text-sm">
                      {mounted && time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/30"></div>
                  <span className="text-sm">
                    {mounted && time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="dark-glass rounded-xl p-4 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'FD'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.name || 'Founder'}</p>
                    <p className="text-blue-200 text-xs mono">FOUNDER</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Startup Overview Card */}
          <div className="glass-card rounded-xl p-6 animate-scale-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{startupData.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{startupData.sector} · {startupData.stage}</p>
              </div>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Funding Stage</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{startupData.stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
                <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">{startupData.teamSize} members</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Match Score</p>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400 mt-1">{startupData.matchScore}/100</p>
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-5 hover-scale dark:!bg-[#1e293b] group transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="success" size="sm">+{startupData.revenueGrowth}%</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Monthly Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${startupData.monthlyRevenue}</p>
              <p className="text-xs text-gray-400 mt-1">vs previous month</p>
            </div>

            <div className="glass-card rounded-xl p-5 hover-scale dark:!bg-[#1e293b] group transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="success" size="sm">+{startupData.usersGrowth}</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Active Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{startupData.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">this week</p>
            </div>

            <div className="glass-card rounded-xl p-5 hover-scale dark:!bg-[#1e293b] group transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <Badge variant="info" size="sm">Healthy</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Runway</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{startupData.runway} months</p>
              <p className="text-xs text-gray-400 mt-1">until next funding</p>
            </div>

            <div className="glass-card rounded-xl p-5 hover-scale dark:!bg-[#1e293b] group transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Chart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="warning" size="sm">Monitor</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Burn Rate</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">${startupData.burnRate}</p>
              <p className="text-xs text-gray-400 mt-1">monthly expenses</p>
            </div>
          </div>

          {/* Milestones & Matches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Milestones</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track your progress</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {milestones.map((milestone, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        milestone.status === 'completed' ? 'bg-emerald-500' :
                        milestone.status === 'in-progress' ? 'bg-amber-500 animate-pulse' :
                        'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{milestone.date}</p>
                      </div>
                      {milestone.status === 'completed' && (
                        <Icons.Check className="w-5 h-5 text-emerald-500" />
                      )}
                      {milestone.status === 'in-progress' && (
                        <Badge variant="warning" size="sm">In Progress</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recommended Investors</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top matches</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {investors.map((investor, i) => (
                    <Link href={`/dashboard/founder/matches/${i + 1}`} key={i} className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {investor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{investor.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{investor.focus}</p>
                          </div>
                        </div>
                        <Badge variant="success">{investor.match}% match</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/dashboard/founder/matches">
                  <Button variant="outline" className="w-full mt-4">
                    View All Investors
                    <Icons.ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Support */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Incubation Program</h3>
                  <p className="text-white/60 text-sm">Access resources and events</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">MENTORING</p>
                  <p className="text-white/60 text-xs">Personalized support</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">EVENTS</p>
                  <p className="text-white/60 text-xs">Networking & pitch sessions</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <Link href="/dashboard/founder/apply" className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2">
                  Apply to program
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