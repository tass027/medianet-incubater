'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/common/Card';
import Button from '@/app/components/common/Button';
import Input from '@/app/components/common/Input';
import Select from '@/app/components/common/Select';
import Alert from '@/app/components/common/Alert';
import Badge from '@/app/components/common/Badge';

export default function MultiStepForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    
    // Step 2: Startup Details
    startupName: '',
    website: '',
    industry: '',
    stage: '',
    description: '',
    
    // Step 3: Business Plan
    problem: '',
    solution: '',
    targetMarket: '',
    businessModel: '',
    competition: '',
    
    // Step 4: Financials
    askingAmount: '',
    valuation: '',
    mrr: '',
    burnRate: '',
    runway: '',
    
    // Step 5: Documents
    pitchDeck: null,
    financialProjections: null,
    businessPlan: null,
    teamResumes: null
  });

  const totalSteps = 5;

  const industries = [
    { value: 'fintech', label: 'FinTech' },
    { value: 'healthtech', label: 'HealthTech' },
    { value: 'edtech', label: 'EdTech' },
    { value: 'cleantech', label: 'CleanTech' },
    { value: 'saas', label: 'SaaS' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'ai', label: 'Artificial Intelligence' },
    { value: 'other', label: 'Other' }
  ];

  const stages = [
    { value: 'idea', label: 'Idea / Concept' },
    { value: 'pre-seed', label: 'Pre-seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'series-a', label: 'Series A' },
    { value: 'growth', label: 'Growth' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleNext = () => {
    // Validate current step
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    setError('');
    
    switch(step) {
      case 1:
        if (!formData.fullName) {
          setError('Full name is required');
          return false;
        }
        if (!formData.email) {
          setError('Email is required');
          return false;
        }
        if (!formData.email.includes('@')) {
          setError('Please enter a valid email');
          return false;
        }
        break;
        
      case 2:
        if (!formData.startupName) {
          setError('Startup name is required');
          return false;
        }
        if (!formData.industry) {
          setError('Please select an industry');
          return false;
        }
        if (!formData.stage) {
          setError('Please select your startup stage');
          return false;
        }
        if (!formData.description) {
          setError('Please provide a description');
          return false;
        }
        break;
        
      case 3:
        if (!formData.problem) {
          setError('Please describe the problem you are solving');
          return false;
        }
        if (!formData.solution) {
          setError('Please describe your solution');
          return false;
        }
        if (!formData.targetMarket) {
          setError('Please define your target market');
          return false;
        }
        break;
        
      case 4:
        if (!formData.askingAmount) {
          setError('Please enter the amount you are raising');
          return false;
        }
        if (!formData.mrr) {
          setError('Please enter your monthly recurring revenue');
          return false;
        }
        break;
        
      case 5:
        if (!formData.pitchDeck) {
          setError('Please upload your pitch deck');
          return false;
        }
        if (!formData.financialProjections) {
          setError('Please upload your financial projections');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Application submitted successfully! Redirecting to dashboard...');
      
      setTimeout(() => {
        router.push('/dashboard/applicant/status');
      }, 2000);
      
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600 mt-1">Tell us about yourself</p>
            </div>
            
            <Input
              label="Full Name *"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            
            <Input
              label="Email Address *"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@startup.com"
              required
            />
            
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
            
            <Input
              label="LinkedIn Profile"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Startup Details</h2>
              <p className="text-gray-600 mt-1">Tell us about your venture</p>
            </div>
            
            <Input
              label="Startup Name *"
              name="startupName"
              value={formData.startupName}
              onChange={handleChange}
              placeholder="Your Startup Name"
              required
            />
            
            <Input
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourstartup.com"
            />
            
            <Select
              label="Industry *"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              options={industries}
              required
            />
            
            <Select
              label="Startup Stage *"
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              options={stages}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Startup Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your startup, what problem you solve, and how you solve it..."
                required
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Business Plan</h2>
              <p className="text-gray-600 mt-1">Help us understand your business</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Statement *
              </label>
              <textarea
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="What problem are you solving?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solution *
              </label>
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="How does your solution work?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Market *
              </label>
              <textarea
                name="targetMarket"
                value={formData.targetMarket}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Who are your customers? Market size?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Model
              </label>
              <textarea
                name="businessModel"
                value={formData.businessModel}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="How do you make money?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competition
              </label>
              <textarea
                name="competition"
                value={formData.competition}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Who are your competitors? What's your advantage?"
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Financial Information</h2>
              <p className="text-gray-600 mt-1">Tell us about your financials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount Raising *"
                name="askingAmount"
                value={formData.askingAmount}
                onChange={handleChange}
                placeholder="$500,000"
                required
              />
              
              <Input
                label="Valuation"
                name="valuation"
                value={formData.valuation}
                onChange={handleChange}
                placeholder="$5,000,000"
              />
              
              <Input
                label="Monthly Revenue (MRR) *"
                name="mrr"
                value={formData.mrr}
                onChange={handleChange}
                placeholder="$25,000"
                required
              />
              
              <Input
                label="Monthly Burn Rate"
                name="burnRate"
                value={formData.burnRate}
                onChange={handleChange}
                placeholder="$15,000"
              />
              
              <Input
                label="Runway (months)"
                name="runway"
                type="number"
                value={formData.runway}
                onChange={handleChange}
                placeholder="12"
              />
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <p className="text-gray-600 mt-1">Upload required documents</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pitch Deck * (PDF, PPT)
                </label>
                <input
                  type="file"
                  name="pitchDeck"
                  onChange={handleFileUpload}
                  accept=".pdf,.ppt,.pptx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Financial Projections * (Excel, PDF)
                </label>
                <input
                  type="file"
                  name="financialProjections"
                  onChange={handleFileUpload}
                  accept=".xls,.xlsx,.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Plan
                </label>
                <input
                  type="file"
                  name="businessPlan"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Resumes
                </label>
                <input
                  type="file"
                  name="teamResumes"
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All documents are confidential and will only be shared with verified investors after matching.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-gradient-primary rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}
        
        {success && (
          <Alert type="success" message={success} className="mb-6" />
        )}

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            ← Previous
          </Button>
          
          {currentStep === totalSteps ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
            >
              Next →
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}