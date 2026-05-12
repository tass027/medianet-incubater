'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const Icons = {
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
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Download: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

export default function FounderKPIs() {
  const { user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    setMounted(true);
  }, []);

  const metrics = {
    revenue: {
      label: 'Revenue',
      value: '45,200',
      unit: 'TND',
      growth: 23,
      data: [12, 18, 25, 32, 38, 45],
      history: [
        { month: 'Jan', value: 32 },
        { month: 'Feb', value: 35 },
        { month: 'Mar', value: 38 },
        { month: 'Apr', value: 42 },
        { month: 'May', value: 45 },
        { month: 'Jun', value: 48 },
      ]
    },
    users: {
      label: 'Active Users',
      value: '2,340',
      unit: '',
      growth: 12,
      data: [1200, 1450, 1780, 1980, 2150, 2340],
      history: [
        { month: 'Jan', value: 1450 },
        { month: 'Feb', value: 1670 },
        { month: 'Mar', value: 1890 },
        { month: 'Apr', value: 2050 },
        { month: 'May', value: 2210 },
        { month: 'Jun', value: 2340 },
      ]
    },
    customers: {
      label: 'Customers',
      value: '189',
      unit: '',
      growth: 18,
      data: [85, 102, 118, 135, 156, 189],
      history: [
        { month: 'Jan', value: 102 },
        { month: 'Feb', value: 118 },
        { month: 'Mar', value: 135 },
        { month: 'Apr', value: 156 },
        { month: 'May', value: 172 },
        { month: 'Jun', value: 189 },
      ]
    },
    retention: {
      label: 'Retention Rate',
      value: '87',
      unit: '%',
      growth: 5,
      data: [72, 75, 78, 82, 85, 87],
      history: [
        { month: 'Jan', value: 75 },
        { month: 'Feb', value: 78 },
        { month: 'Mar', value: 82 },
        { month: 'Apr', value: 85 },
        { month: 'May', value: 86 },
        { month: 'Jun', value: 87 },
      ]
    }
  };

  const currentMetric = metrics[selectedMetric];
  const maxValue = Math.max(...currentMetric.data);

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
          
          .kpi-card {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .kpi-card.active {
            border-color: #0088ba;
            background: rgba(0,136,186,0.05);
          }
          :global(.dark) .kpi-card.active {
            background: rgba(0,136,186,0.15);
          }
          
          .bar {
            transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
                    KEY PERFORMANCE INDICATORS
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  KPIs & Performance
                </h1>
                <p className="text-blue-100 text-base max-w-2xl">
                  Track your performance indicators and analyze your growth
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white/10 rounded-lg p-1">
                  {['week', 'month', 'quarter', 'year'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeframe === tf ? 'bg-white text-primary-600' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : tf === 'quarter' ? 'Quarter' : 'Year'}
                    </button>
                  ))}
                </div>
                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                  <Icons.Download className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics).map(([key, metric]) => (
              <div
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`glass-card rounded-xl p-5 cursor-pointer transition-all kpi-card ${selectedMetric === key ? 'active' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    key === 'revenue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    key === 'users' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    key === 'customers' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    {key === 'revenue' && <Icons.TrendingUp className="w-5 h-5 text-blue-600" />}
                    {key === 'users' && <Icons.Users className="w-5 h-5 text-emerald-600" />}
                    {key === 'customers' && <Icons.Chart className="w-5 h-5 text-purple-600" />}
                    {key === 'retention' && <Icons.Calendar className="w-5 h-5 text-amber-600" />}
                  </div>
                  <Badge variant={metric.growth > 0 ? 'success' : 'error'} size="sm">
                    {metric.growth > 0 ? '+' : ''}{metric.growth}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}{metric.unit && <span className="text-sm font-normal text-gray-500">{metric.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentMetric.label} Evolution
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last 6 months
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Current value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-200 rounded-full"></div>
                  <span className="text-xs text-gray-500">Average</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-3 h-64 mt-8">
              {currentMetric.history.map((item, idx) => {
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[60px] bg-primary-500/30 rounded-t-lg bar"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-500 rounded-t-lg bar"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.month}</span>
                      <p className="text-xs text-gray-500 mt-1">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Monthly Average</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(currentMetric.history.reduce((a, b) => a + b.value, 0) / currentMetric.history.length)}
                  {currentMetric.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Growth Rate</p>
                <p className="text-lg font-semibold text-emerald-600">+{currentMetric.growth}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Best Month</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.max(...currentMetric.history.map(h => h.value))}
                  {currentMetric.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Projection</p>
                <p className="text-lg font-semibold text-primary-600">
                  {Math.round(currentMetric.value * 1.2)}
                  {currentMetric.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="flex justify-between items-center">
            <Link href="/dashboard/founder">
              <Button variant="outline" className="flex items-center gap-2">
                <Icons.ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button variant="primary" className="flex items-center gap-2">
              <Icons.Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>

          {/* Footer */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Chart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Advanced Analytics</h3>
                  <p className="text-white/60 text-sm">Access detailed reports</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">REALTIME</p>
                  <p className="text-white/60 text-xs">Live data</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">AUTO</p>
                  <p className="text-white/60 text-xs">Automatic updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}