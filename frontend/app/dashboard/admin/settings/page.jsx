'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Card from '@/app/components/common/Card';
import Button from '@/app/components/common/Button';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';
import useTheme from '@/app/hooks/useTheme';

export default function SettingsPage() {
  const { user } = useSelector((state) => state.auth);
  const { t, language, changeLanguage } = useTranslation();
  const { theme, changeTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  // Notifications settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    mentions: true,
    comments: true,
    evaluations: true,
    matches: true
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    activityStatus: true
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  useEffect(() => {
    setMounted(true);
    
    // Load saved settings from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    const savedPrivacy = localStorage.getItem('privacy');
    const savedSecurity = localStorage.getItem('security');
    
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
    if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
  }, []);

  const handleSaveSettings = () => {
    setLoading(true);
    
    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('privacy', JSON.stringify(privacy));
    localStorage.setItem('security', JSON.stringify(security));
    
    setTimeout(() => {
      setLoading(false);
      setAlert({
        show: true,
        type: 'success',
        message: t.saved_success || 'Settings saved successfully'
      });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    }, 800);
  };

  const handleResetSettings = () => {
    setNotifications({
      email: true,
      push: true,
      marketing: false,
      mentions: true,
      comments: true,
      evaluations: true,
      matches: true
    });
    setPrivacy({
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      activityStatus: true
    });
    setSecurity({
      twoFactor: false,
      sessionTimeout: '30',
      loginAlerts: true
    });
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSecurity = (key) => {
    setSecurity(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = () => {
    alert(t.change_password || 'Password change functionality');
  };

  const handleDeleteAccount = () => {
    if (confirm(t.delete_account_confirm || 'Are you absolutely sure? This action cannot be undone.')) {
      alert(t.delete_account || 'Account deletion');
    }
  };

  const handleExportData = () => {
    const userData = {
      profile: user,
      settings: {
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
        notifications: JSON.parse(localStorage.getItem('notifications') || '{}'),
        privacy: JSON.parse(localStorage.getItem('privacy') || '{}'),
        security: JSON.parse(localStorage.getItem('security') || '{}')
      }
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `user-data-${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['admin', 'founder', 'investor', 'mentor', 'applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slide-in {
            animation: slideIn 0.3s ease-out forwards;
          }

          .settings-section {
            transition: all 0.3s ease;
          }

          .settings-section:hover {
            transform: translateY(-2px);
          }

          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 48px;
            height: 24px;
          }

          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .3s;
            border-radius: 34px;
          }

          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
          }

          input:checked + .toggle-slider {
            background-color: #3b82f6;
          }

          input:checked + .toggle-slider:before {
            transform: translateX(24px);
          }

          .theme-option {
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }

          .theme-option:hover {
            transform: scale(1.02);
            border-color: #3b82f6;
          }

          .theme-option.selected {
            border-color: #3b82f6;
            background-color: #eff6ff;
          }

          /* Dark mode styles */
          :global(.dark) .theme-option.selected {
            background-color: #1e293b;
            border-color: #3b82f6;
          }

          :global(.dark) .text-gray-900 {
            color: #f9fafb;
          }

          :global(.dark) .text-gray-700 {
            color: #d1d5db;
          }

          :global(.dark) .text-gray-600 {
            color: #9ca3af;
          }

          :global(.dark) .text-gray-500 {
            color: #6b7280;
          }

          :global(.dark) .border-gray-200 {
            border-color: #374151;
          }

          :global(.dark) .border-gray-100 {
            border-color: #1f2937;
          }

          :global(.dark) .bg-gray-50 {
            background-color: #1f2937;
          }

          :global(.dark) .bg-primary-50 {
            background-color: #1e3a5f;
          }

          :global(.dark) select {
            background-color: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }

          :global(.dark) select option {
            background-color: #1f2937;
            color: #f9fafb;
          }
        `}</style>

        <div className="space-y-6 animate-slide-in">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t.settings_title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t.settings_subtitle}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={handleResetSettings}
              >
                {t.reset || 'Reset'}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveSettings}
                loading={loading}
              >
                {t.save_changes}
              </Button>
            </div>
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert 
              type={alert.type} 
              message={alert.message}
              onClose={() => setAlert({ show: false, type: '', message: '' })}
            />
          )}

          {/* Theme Settings */}
          <Card className="p-6 settings-section dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t.appearance}
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t.theme}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light theme option */}
                <div 
                  className={`theme-option p-4 border-2 rounded-xl cursor-pointer ${
                    theme === 'light' ? 'selected' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => changeTheme('light')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.light}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.default_theme}</p>
                    </div>
                  </div>
                </div>

                {/* Dark theme option */}
                <div 
                  className={`theme-option p-4 border-2 rounded-xl cursor-pointer ${
                    theme === 'dark' ? 'selected' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => changeTheme('dark')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.dark}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.eye_friendly}</p>
                    </div>
                  </div>
                </div>

                {/* System theme option */}
                <div 
                  className={`theme-option p-4 border-2 rounded-xl cursor-pointer ${
                    theme === 'system' ? 'selected' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => changeTheme('system')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.system}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.follow_device}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Language selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.language}
              </label>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
              {language === 'ar' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.rtl_notice || 'Right-to-left text direction will be applied'}
                </p>
              )}
            </div>
          </Card>

          {/* Notifications Settings */}
          <Card className="p-6 settings-section dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t.notifications}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.email_notifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.email_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.push_notifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.push_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.marketing}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.marketing_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.marketing}
                    onChange={() => toggleNotification('marketing')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white mb-3">{t.notification_types}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t.mentions}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifications.mentions}
                        onChange={() => toggleNotification('mentions')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t.comments}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifications.comments}
                        onChange={() => toggleNotification('comments')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t.evaluations_updates}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifications.evaluations}
                        onChange={() => toggleNotification('evaluations')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t.matches}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifications.matches}
                        onChange={() => toggleNotification('matches')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card className="p-6 settings-section dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t.privacy}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profile_visibility}
                </label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="public">{t.public}</option>
                  <option value="private">{t.private}</option>
                  <option value="connections">{t.connections}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.show_email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.show_email_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={privacy.showEmail}
                    onChange={() => togglePrivacy('showEmail')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.show_phone}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.show_phone_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={privacy.showPhone}
                    onChange={() => togglePrivacy('showPhone')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.activity_status}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.activity_status_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={privacy.activityStatus}
                    onChange={() => togglePrivacy('activityStatus')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6 settings-section dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t.security}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.two_factor}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.two_factor_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={security.twoFactor}
                    onChange={() => toggleSecurity('twoFactor')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.session_timeout}
                </label>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="15">15 {t.minutes}</option>
                  <option value="30">30 {t.minutes}</option>
                  <option value="60">1 {t.hour}</option>
                  <option value="120">2 {t.hours}</option>
                  <option value="240">4 {t.hours}</option>
                  <option value="480">8 {t.hours}</option>
                  <option value="0">{t.never}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.login_alerts}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.login_alerts_desc}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={security.loginAlerts}
                    onChange={() => toggleSecurity('loginAlerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleChangePassword}
                >
                  {t.change_password}
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-2 border-red-200 dark:border-red-900/50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              {t.danger_zone}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.delete_account}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.delete_account_desc}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={handleDeleteAccount}
                >
                  {t.delete_account}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.export_data}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.export_data_desc}</p>
                </div>
                <Button 
                  variant="ghost"
                  onClick={handleExportData}
                >
                  {t.export_data}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}