'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/app/store/slices/authSlice';
import Input from '@/app/components/common/Input';
import Button from '@/app/components/common/Button';
import Alert from '@/app/components/common/Alert';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ✅ COMPTES DE TEST CONTEXTE MEDIANET / TUNISIE
    const mockUsers = {
      // ✅ ADMINISTRATION MEDIANET - MOHAMED JERBI (Head of Project Management)
      'admin@medianet.tn': { 
        id: 1, 
        name: 'Mohamed Jerbi', 
        email: 'admin@medianet.tn', 
        role: 'admin',
        department: 'Head of Project Management',
        title: 'Project Manager',
        company: 'MEDIANET',
        location: 'Tunis',
        avatar: null 
      },
      
      // Medianautes (employés MEDIANET - intrapreneurs)
      'ahmed.trabelsi@medianet.tn': { 
        id: 2, 
        name: 'Ahmed Trabelsi', 
        email: 'ahmed.trabelsi@medianet.tn', 
        role: 'founder',
        department: 'R&D',
        title: 'R&D Engineer',
        yearsAtMedianet: 8,
        project: 'AI Customer Service',
        company: 'MEDIANET (Intrapreneur)',
        location: 'Tunis',
        avatar: null 
      },
      
      // Africinvest Group
      'samia.belhadj@africinvest.com': { 
        id: 3, 
        name: 'Samia Belhadj', 
        email: 'samia.belhadj@africinvest.com', 
        role: 'investor',
        fund: 'Africinvest North Africa Fund',
        title: 'Investment Manager',
        region: 'Tunisie, Maroc, Côte d\'Ivoire',
        company: 'Africinvest Group',
        location: 'Tunis',
        avatar: null 
      },
      
      // Mentor externe / Consultant
      'mohamed.ali@mentor.tn': { 
        id: 4, 
        name: 'Mohamed Ali', 
        email: 'mohamed.ali@mentor.tn', 
        role: 'mentor',
        expertise: 'Digital Transformation & Innovation',
        title: 'Senior Consultant',
        company: 'Independent Consultant',
        location: 'Tunis',
        avatar: null 
      },
      
      // Candidat externe - Startup tunisienne
      'imen.benammar@startup.tn': { 
        id: 5, 
        name: 'Imen Ben Ammar', 
        email: 'imen.benammar@startup.tn', 
        role: 'applicant',
        startup: 'PayTunis',
        stage: 'Seed',
        title: 'Founder & CEO',
        location: 'Tunis',
        company: 'External Applicant',
        avatar: null 
      },

      // Deuxième investisseur Africinvest
      'mehdi.gharbi@africinvest.com': {
        id: 6,
        name: 'Mehdi Gharbi',
        email: 'mehdi.gharbi@africinvest.com',
        role: 'investor',
        fund: 'Africinvest Tech Fund',
        title: 'Investment Associate',
        region: 'Afrique de l\'Ouest',
        company: 'Africinvest Group',
        location: 'Casablanca',
        avatar: null
      },

      // Deuxième fondateur MEDIANET
      'sara.benali@medianet.tn': {
        id: 7,
        name: 'Sara Ben Ali',
        email: 'sara.benali@medianet.tn',
        role: 'founder',
        department: 'Digital Marketing',
        title: 'Marketing Manager',
        yearsAtMedianet: 5,
        project: 'EduTech Platform',
        company: 'MEDIANET (Intrapreneur)',
        location: 'Tunis',
        avatar: null
      },

      // Mentor - Karim Ghorbel (CFO)
      'karim.ghorbel@mentor.tn': {
        id: 8,
        name: 'Karim Ghorbel',
        email: 'karim.ghorbel@mentor.tn',
        role: 'mentor',
        expertise: 'Finance & Strategy',
        title: 'Chief Financial Officer',
        company: 'Medianet',
        location: 'Tunis',
        avatar: null
      }
    };

    const user = mockUsers[formData.email];

    if (user && formData.password === 'password') {
      const mockData = {
        user,
        accessToken: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };

      localStorage.setItem('accessToken', mockData.accessToken);
      localStorage.setItem('refreshToken', mockData.refreshToken);
      localStorage.setItem('user', JSON.stringify(mockData.user));
      dispatch(setCredentials(mockData));
      
      router.push(`/dashboard/${user.role}/dashboard`);
    } else {
      setError('Invalid credentials. Try: admin@medianet.tn / password');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-strong p-8 animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to VentureBridge by MEDIANET</p>
      </div>

      {/* ✅ TEST CREDENTIALS - WITHOUT ICONS */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-2">Test Accounts - MEDIANET / Africinvest:</p>
        <div className="text-xs text-blue-800">
          <div className="mb-2">
            <p className="font-semibold">ADMIN:</p>
            <p className="ml-2">• Mohamed Jerbi: admin@medianet.tn / password</p>
          </div>
          <div className="mb-2">
            <p className="font-semibold">FOUNDERS:</p>
            <p className="ml-2">• Ahmed Trabelsi (R&D): ahmed.trabelsi@medianet.tn / password</p>
            <p className="ml-2">• Sara Ben Ali (Marketing): sara.benali@medianet.tn / password</p>
          </div>
          <div className="mb-2">
            <p className="font-semibold">INVESTORS:</p>
            <p className="ml-2">• Samia Belhadj: samia.belhadj@africinvest.com / password</p>
            <p className="ml-2">• Mehdi Gharbi: mehdi.gharbi@africinvest.com / password</p>
          </div>
          <div className="mb-2">
            <p className="font-semibold">MENTORS:</p>
            <p className="ml-2">• Mohamed Ali: mohamed.ali@mentor.tn / password</p>
            <p className="ml-2">• Karim Ghorbel: karim.ghorbel@mentor.tn / password</p>
          </div>
          <div>
            <p className="font-semibold">APPLICANT:</p>
            <p className="ml-2">• Imen Ben Ammar (PayTunis): imen.benammar@startup.tn / password</p>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">All passwords: <span className="font-mono font-bold">password</span></p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@medianet.tn"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        <Button
          type="submit"
          className="w-full bg-primary-500 hover:bg-primary-600"
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}