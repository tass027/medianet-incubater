'use client';

import { useState } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Card from '@/app/components/common/Card';
import Button from '@/app/components/common/Button';
import Input from '@/app/components/common/Input';
import Badge from '@/app/components/common/Badge';

export default function ApplicantSettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications');
  const [isEditing, setIsEditing] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      applicationUpdates: true,
      marketingEmails: false,
      interviewReminders: true,
      documentRequests: true,
      weeklyDigest: false,
      browserNotifications: true,
      mobileNotifications: false
    },
    privacy: {
      profileVisibility: 'public',
      showContactInfo: false,
      shareApplicationStatus: true,
      showInDirectory: true,
      allowMentions: true,
      dataSharing: 'essential'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      loginAlerts: true,
      deviceManagement: true,
      ipWhitelisting: false
    },
    preferences: {
      language: 'English',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      theme: 'light',
      reducedMotion: false
    },
    integrations: {
      calendarSync: true,
      slackIntegration: false,
      googleDrive: true,
      dropbox: false
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    passwordStrength: 0
  });

  const [sessions, setSessions] = useState([
    { device: 'Chrome / Windows', location: 'New York, USA', ip: '192.168.1.1', lastActive: 'Now', current: true },
    { device: 'Safari / iPhone', location: 'New York, USA', ip: '192.168.1.2', lastActive: '2 hours ago', current: false },
    { device: 'Firefox / MacOS', location: 'Boston, USA', ip: '192.168.1.3', lastActive: '3 days ago', current: false }
  ]);

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleSecurityChange = (key, value) => {
    if (typeof value === 'boolean') {
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          [key]: !prev.security[key]
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          [key]: value
        }
      }));
    }
  };

  const handleSaveSettings = () => {
    // API call to save settings
    setIsEditing(false);
    // Show success notification
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
      passwordStrength: name === 'newPassword' ? calculatePasswordStrength(value) : prev.passwordStrength
    }));
  };

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'privacy', label: 'Privacy', icon: 'lock' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'integrations', label: 'Integrations', icon: 'link' }
  ];

  return (
    <ProtectedRoute allowedRoles={['applicant']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure your account preferences and security options
              </p>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Settings
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSaveSettings}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Settings Navigation */}
            <div className="lg:w-64 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {section.icon === 'bell' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    )}
                    {section.icon === 'lock' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                    {section.icon === 'shield' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    )}
                    {section.icon === 'settings' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    )}
                    {section.icon === 'link' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    )}
                  </svg>
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-200">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="font-medium">Delete Account</span>
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <Card title="Notification Preferences">
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {getNotificationDescription(key)}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={value}
                            onChange={() => handleNotificationChange(key)}
                            disabled={!isEditing}
                          />
                          <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            value ? 'bg-primary-600' : 'bg-gray-200'
                          } ${!isEditing && 'opacity-50 cursor-not-allowed'}`} />
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <Card title="Privacy Settings">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="public">Public - Visible to everyone</option>
                        <option value="private">Private - Only visible to program administrators</option>
                        <option value="hidden">Hidden - Not visible to anyone</option>
                      </select>
                    </div>

                    {['showContactInfo', 'shareApplicationStatus', 'showInDirectory', 'allowMentions'].map((key) => (
                      <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.privacy[key]}
                            onChange={() => handlePrivacyChange(key, !settings.privacy[key])}
                            disabled={!isEditing}
                          />
                          <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            settings.privacy[key] ? 'bg-primary-600' : 'bg-gray-200'
                          } ${!isEditing && 'opacity-50 cursor-not-allowed'}`} />
                        </label>
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Sharing
                      </label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                        value={settings.privacy.dataSharing}
                        onChange={(e) => handlePrivacyChange('dataSharing', e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="essential">Essential Only</option>
                        <option value="limited">Limited Analytics</option>
                        <option value="full">Full Data Sharing</option>
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <>
                  <Card title="Password & Authentication">
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label="Current Password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={!isEditing}
                      />
                      
                      <div>
                        <Input
                          type="password"
                          label="New Password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          disabled={!isEditing}
                        />
                        {passwordData.newPassword && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full ${
                                    level <= passwordData.passwordStrength
                                      ? level <= 2 ? 'bg-red-500' : level <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {passwordData.passwordStrength <= 2 ? 'Weak' : 
                               passwordData.passwordStrength <= 4 ? 'Medium' : 'Strong'} password
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Input
                        type="password"
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        disabled={!isEditing}
                      />
                      
                      <Button 
                        variant="primary" 
                        disabled={!isEditing || !passwordData.currentPassword || !passwordData.newPassword}
                      >
                        Update Password
                      </Button>
                    </div>
                  </Card>

                  <Card title="Two-Factor Authentication">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button 
                        variant={settings.security.twoFactorAuth ? 'outline' : 'primary'}
                        onClick={() => handleSecurityChange('twoFactorAuth', !settings.security.twoFactorAuth)}
                        disabled={!isEditing}
                      >
                        {settings.security.twoFactorAuth ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </Card>

                  <Card title="Active Sessions">
                    <div className="space-y-4">
                      {sessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <p className="font-medium text-gray-900">{session.device}</p>
                              <p className="text-sm text-gray-500">{session.location} • {session.ip}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{session.lastActive}</span>
                            {!session.current && (
                              <button className="text-sm text-red-600 hover:text-red-700">
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Additional Security">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                          disabled={!isEditing}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                        </select>
                      </div>

                      {['loginAlerts', 'deviceManagement', 'ipWhitelisting'].map((key) => (
                        <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={settings.security[key]}
                              onChange={() => handleSecurityChange(key, !settings.security[key])}
                              disabled={!isEditing}
                            />
                            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                              settings.security[key] ? 'bg-primary-600' : 'bg-gray-200'
                            } ${!isEditing && 'opacity-50 cursor-not-allowed'}`} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Preferences */}
              {activeSection === 'preferences' && (
                <Card title="Preferences">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.preferences.language}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, language: e.target.value}
                          }))}
                          disabled={!isEditing}
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.preferences.timezone}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, timezone: e.target.value}
                          }))}
                          disabled={!isEditing}
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.preferences.dateFormat}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, dateFormat: e.target.value}
                          }))}
                          disabled={!isEditing}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.preferences.timeFormat}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, timeFormat: e.target.value}
                          }))}
                          disabled={!isEditing}
                        >
                          <option value="12h">12-hour (12:00 PM)</option>
                          <option value="24h">24-hour (13:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50"
                          value={settings.preferences.theme}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, theme: e.target.value}
                          }))}
                          disabled={!isEditing}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System Default</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Reduced Motion</p>
                        <p className="text-sm text-gray-500 mt-1">Minimize animations throughout the interface</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.preferences.reducedMotion}
                          onChange={() => setSettings(prev => ({
                            ...prev,
                            preferences: {...prev.preferences, reducedMotion: !prev.preferences.reducedMotion}
                          }))}
                          disabled={!isEditing}
                        />
                        <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          settings.preferences.reducedMotion ? 'bg-primary-600' : 'bg-gray-200'
                        } ${!isEditing && 'opacity-50 cursor-not-allowed'}`} />
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Integrations */}
              {activeSection === 'integrations' && (
                <Card title="Connected Services">
                  <div className="space-y-4">
                    {Object.entries(settings.integrations).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {getIntegrationDescription(key)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant={value ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            integrations: {
                              ...prev.integrations,
                              [key]: !value
                            }
                          }))}
                          disabled={!isEditing}
                        >
                          {value ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Helper functions for descriptions
function getNotificationDescription(key) {
  const descriptions = {
    emailNotifications: 'Receive notifications via email',
    applicationUpdates: 'Get notified when your application status changes',
    marketingEmails: 'Receive updates about programs and events',
    interviewReminders: 'Get reminders before scheduled interviews',
    documentRequests: 'Notifications when documents are requested',
    weeklyDigest: 'Weekly summary of your application status',
    browserNotifications: 'Show notifications in your browser',
    mobileNotifications: 'Push notifications to your mobile device'
  };
  return descriptions[key] || '';
}

function getIntegrationDescription(key) {
  const descriptions = {
    calendarSync: 'Sync interviews and events with your calendar',
    slackIntegration: 'Get notifications in Slack',
    googleDrive: 'Access documents from Google Drive',
    dropbox: 'Access files from Dropbox'
  };
  return descriptions[key] || '';
}