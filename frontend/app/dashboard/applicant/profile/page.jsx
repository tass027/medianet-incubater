'use client';

import { useState, useRef } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Card from '@/app/components/common/Card';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Input from '@/app/components/common/Input';

export default function ApplicantProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    avatar: null,
    avatarPreview: '/default-avatar.png', // Default avatar path
    personalInfo: {
      firstName: 'Imen',
      lastName: '',
      email: 'imen@example.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1990-05-15',
      nationality: 'United States',
      linkedin: 'https://linkedin.com/in/imen',
      github: 'https://github.com/imen',
      website: 'https://imen.com',
      bio: 'Innovative entrepreneur with expertise in technology and business development.',
      expertise: ['Product Strategy', 'Innovation', 'Business Development', 'Tech Leadership']
    },
    companyInfo: {
      companyName: 'MEDIANET INCUBATOR',
      companyStage: 'Seed',
      foundedYear: '2024',
      industry: 'Technology / Incubation',
      subIndustry: 'Startup Accelerator',
      teamSize: '2-5',
      website: 'https://medianet.com',
      description: 'Technology incubator focused on nurturing innovative startups.',
      problemStatement: 'Early-stage startups need comprehensive support and resources.',
      solution: 'Providing mentorship, funding, and infrastructure for emerging companies.',
      traction: '5 startups in current cohort, 2 successful graduates',
      fundingRaised: '$500K',
      currentRevenue: '$100K ARR',
      investors: 'Angel investors, Venture partners'
    },
    documents: [
      { name: 'Resume / CV', file: 'imen_resume_2026.pdf', size: '2.1 MB', uploadedAt: '2026-02-01', status: 'verified' },
      { name: 'Pitch Deck', file: 'medianet_pitch_deck_v2.pdf', size: '7.8 MB', uploadedAt: '2026-02-03', status: 'verified' },
      { name: 'Business Plan', file: 'medianet_business_plan.pdf', size: '3.5 MB', uploadedAt: '2026-02-03', status: 'verified' },
      { name: 'Financial Projections', file: 'medianet_financials_2026.xlsx', size: '1.9 MB', uploadedAt: '2026-02-04', status: 'pending' }
    ],
    social: {
      twitter: '@imen',
      linkedin: 'in/imen',
      github: 'imen',
      angelList: 'imen'
    }
  });

  const handleInputChange = (section, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please upload an image smaller than 5MB.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          avatar: file,
          avatarPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfileData(prev => ({
      ...prev,
      avatar: null,
      avatarPreview: '/default-avatar.png'
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    // API call to save profile including avatar
    // You would typically use FormData to send the file
    const formData = new FormData();
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }
    // Append other profile data...
    
    setIsEditing(false);
    // Show success notification
  };

  const getInitials = () => {
    const first = profileData.personalInfo.firstName?.[0] || '';
    const last = profileData.personalInfo.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'IM';
  };

  const getCompletionPercentage = () => {
    const totalFields = 25;
    let completed = 0;
    
    Object.values(profileData.personalInfo).forEach(val => {
      if (val && val.length > 0) completed++;
    });
    
    Object.values(profileData.companyInfo).forEach(val => {
      if (val && val.length > 0) completed++;
    });
    
    return Math.round((completed / totalFields) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <ProtectedRoute allowedRoles={['applicant']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with MEDIANET INCUBATOR branding */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MEDIANET INCUBATOR</h1>
              <p className="text-gray-600 mt-1">Profile · Manage your professional information and company details</p>
            </div>
          </div>

          {/* Header with Avatar and Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar with upload functionality */}
              <div className="relative group">
                <div 
                  className={`w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg ${
                    isEditing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                  }`}
                  onClick={handleAvatarClick}
                >
                  {profileData.avatarPreview ? (
                    <img 
                      src={profileData.avatarPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials()}
                    </div>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Upload overlay */}
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full" />
                    <button 
                      className="relative z-10 text-white text-sm font-medium"
                      onClick={handleAvatarClick}
                    >
                      Change
                    </button>
                  </div>
                )}
                
                {/* Camera icon for editing */}
                {isEditing && (
                  <button 
                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                    onClick={handleAvatarClick}
                    title="Upload photo"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Profile info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profileData.personalInfo.firstName} {profileData.personalInfo.lastName || 'Imen'}
                </h2>
                <p className="text-gray-600">{profileData.companyInfo.companyName}</p>
                <p className="text-sm text-gray-500">{profileData.personalInfo.email}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {isEditing && profileData.avatarPreview !== '/default-avatar.png' && (
                <Button variant="outline" onClick={handleRemoveAvatar} size="sm">
                  Remove Photo
                </Button>
              )}
              {!isEditing ? (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile Completion Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Profile Completion</p>
                  <p className="text-2xl font-bold">{completionPercentage}%</p>
                </div>
              </div>
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              <button className="py-3 px-1 border-b-2 border-primary-600 text-primary-600 font-medium text-sm">
                Dashboard
              </button>
              <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Apply
              </button>
              <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Status
              </button>
            </nav>
          </div>

          {/* Profile Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              {[
                { id: 'personal', label: 'Personal Information' },
                { id: 'company', label: 'Company Details' },
                { id: 'documents', label: 'Documents' },
                { id: 'social', label: 'Social Profiles' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <Card>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profileData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profileData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Doe"
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={profileData.personalInfo.email}
                      onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={profileData.personalInfo.phone}
                      onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={profileData.personalInfo.dateOfBirth}
                      onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    <p className="text-xs text-gray-500 mt-1">15/05/1990</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <Input
                      value={profileData.personalInfo.nationality}
                      onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn Profile
                    </label>
                    <Input
                      value={profileData.personalInfo.linkedin}
                      onChange={(e) => handleInputChange('personalInfo', 'linkedin', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professional Bio
                    </label>
                    <textarea
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        !isEditing ? 'bg-gray-50 text-gray-500' : ''
                      }`}
                      rows="4"
                      value={profileData.personalInfo.bio}
                      onChange={(e) => handleInputChange('personalInfo', 'bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tell us about your professional background..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Expertise
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.personalInfo.expertise.map((skill, index) => (
                      <Badge key={index} variant="info" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                    {isEditing && (
                      <button className="px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Company Details Tab */}
          {activeTab === 'company' && (
            <Card>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profileData.companyInfo.companyName}
                      onChange={(e) => handleInputChange('companyInfo', 'companyName', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 font-medium" : ""}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Stage
                    </label>
                    <Input
                      value={profileData.companyInfo.companyStage}
                      onChange={(e) => handleInputChange('companyInfo', 'companyStage', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Founded Year
                    </label>
                    <Input
                      value={profileData.companyInfo.foundedYear}
                      onChange={(e) => handleInputChange('companyInfo', 'foundedYear', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <Input
                      value={profileData.companyInfo.industry}
                      onChange={(e) => handleInputChange('companyInfo', 'industry', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Size
                    </label>
                    <Input
                      value={profileData.companyInfo.teamSize}
                      onChange={(e) => handleInputChange('companyInfo', 'teamSize', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Website
                    </label>
                    <Input
                      value={profileData.companyInfo.website}
                      onChange={(e) => handleInputChange('companyInfo', 'website', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Description
                    </label>
                    <textarea
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        !isEditing ? 'bg-gray-50 text-gray-500' : ''
                      }`}
                      rows="3"
                      value={profileData.companyInfo.description}
                      onChange={(e) => handleInputChange('companyInfo', 'description', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card>
              <div className="space-y-4">
                {profileData.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{doc.file}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>Uploaded {doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={doc.status === 'verified' ? 'success' : 'warning'}>
                        {doc.status === 'verified' ? 'Verified' : 'Pending Review'}
                      </Badge>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full mt-4">
                  Upload New Document
                </Button>
              </div>
            </Card>
          )}

          {/* Social Profiles Tab */}
          {activeTab === 'social' && (
            <Card>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Twitter Handle"
                    value={profileData.social.twitter}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social: {...prev.social, twitter: e.target.value}
                    }))}
                    disabled={!isEditing}
                    placeholder="@username"
                  />
                  <Input
                    label="LinkedIn Profile"
                    value={profileData.social.linkedin}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social: {...prev.social, linkedin: e.target.value}
                    }))}
                    disabled={!isEditing}
                    placeholder="username"
                  />
                  <Input
                    label="GitHub Profile"
                    value={profileData.social.github}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social: {...prev.social, github: e.target.value}
                    }))}
                    disabled={!isEditing}
                    placeholder="username"
                  />
                  <Input
                    label="AngelList Profile"
                    value={profileData.social.angelList}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social: {...prev.social, angelList: e.target.value}
                    }))}
                    disabled={!isEditing}
                    placeholder="username"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}