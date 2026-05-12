'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/common/Card';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import { useSelector } from 'react-redux';

export default function FounderDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    // ✅ DONNÉES MOCK - CONTEXTE MEDIANET / INTRAPRENEUR
    setStats({
      monthlyRevenue: '45,000 TND',
      revenueChange: '+12%',
      fundingRaised: '350,000 TND',
      fundingChange: '+50,000 TND',
      users: '2,500',
      usersChange: '+18%',
      teamSize: 8,
      teamChange: '+2'
    });

    setMatches([
      { 
        investor: 'Africinvest Group', 
        match: 94, 
        status: 'pending',
        contact: 'Samia Belhadj',
        date: '2026-02-15'
      },
      { 
        investor: 'Tunisia Venture', 
        match: 82, 
        status: 'reviewing',
        contact: 'Mehdi Gharbi',
        date: '2026-02-10'
      },
      { 
        investor: 'North Africa Capital', 
        match: 76, 
        status: 'scheduled',
        contact: 'Karim Mansour',
        date: '2026-02-20'
      }
    ]);

    setMilestones([
      { name: 'MVP Launch', status: 'completed', date: '2026-01-15' },
      { name: 'First 1000 Users', status: 'completed', date: '2026-02-01' },
      { name: 'Seed Funding', status: 'in_progress', date: 'Q1 2026' },
      { name: 'Series A', status: 'pending', date: 'Q3 2026' }
    ]);
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Founder Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="primary">MEDIANET Intrapreneur</Badge>
            <Badge variant="info">{user?.department || 'R&D'}</Badge>
            <span className="text-sm text-gray-600">
              {user?.yearsAtMedianet || 8} ans chez MEDIANET
            </span>
          </div>
        </div>
        <Link href="/dashboard/founder/startup">
          <Button variant="primary">
            Modifier mon profil
          </Button>
        </Link>
      </div>

      {/* Stats Cards - DEVISES TND */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Revenu mensuel (MRR)</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.monthlyRevenue}</p>
          <p className="text-sm text-green-600 mt-1">{stats.revenueChange}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-gray-600">Fonds levés</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.fundingRaised}</p>
          <p className="text-sm text-green-600 mt-1">{stats.fundingChange}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-gray-600">Utilisateurs</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.users}</p>
          <p className="text-sm text-green-600 mt-1">{stats.usersChange}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-gray-600">Taille équipe</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.teamSize}</p>
          <p className="text-sm text-green-600 mt-1">{stats.teamChange}</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investor Matches */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">🤝 Matching investisseurs</h2>
            <Badge variant="success">{matches.length} matches</Badge>
          </div>
          
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.investor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{match.investor}</span>
                    <Badge variant="success" size="sm">{match.match}% match</Badge>
                    <Badge 
                      variant={
                        match.status === 'pending' ? 'warning' : 
                        match.status === 'reviewing' ? 'info' : 
                        'success'
                      } 
                      size="sm"
                    >
                      {match.status === 'pending' && 'En attente'}
                      {match.status === 'reviewing' && 'En cours'}
                      {match.status === 'scheduled' && 'Planifié'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Contact: {match.contact} • {new Date(match.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <Link href="/dashboard/founder/matches">
              <Button variant="ghost" className="w-full">
                Voir tous les matches →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Milestones */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">🎯 Jalons</h2>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  milestone.status === 'completed' ? 'bg-green-100' :
                  milestone.status === 'in_progress' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {milestone.status === 'completed' && <span className="text-green-600 text-sm">✓</span>}
                  {milestone.status === 'in_progress' && <span className="text-yellow-600 text-sm">⏳</span>}
                  {milestone.status === 'pending' && <span className="text-gray-400 text-sm">○</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                  <p className="text-xs text-gray-500">{milestone.date}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/dashboard/founder/kpis">
              <Button variant="ghost" size="sm" className="w-full">
                Gérer mes KPIs
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">⚡ Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/founder/startup">
            <div className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-sm font-medium">Ma startup</div>
            </div>
          </Link>
          <Link href="/dashboard/founder/kpis">
            <div className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm font-medium">KPIs</div>
            </div>
          </Link>
          <Link href="/dashboard/founder/matches">
            <div className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-sm font-medium">Matches</div>
            </div>
          </Link>
          <Link href="/dashboard/medianet/coworking">
            <div className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🏢</div>
              <div className="text-sm font-medium">Coworking</div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}