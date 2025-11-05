import React, { useState, useRef } from 'react';
import { Company, CompanyCreate, CompanyUpdate, CompanyLocation, CompanyBenefits } from '../../hooks/recruiter/useCompany';

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CompanyCreate | CompanyUpdate) => Promise<void>;
  loading?: boolean;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const COMPANY_STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'growth', label: 'Growth' },
  { value: 'public', label: 'Public' },
  { value: 'established', label: 'Established' },
];

const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    tagline: company?.tagline || '',
    website: company?.website || '',
    industry: company?.industry || 'technology',
    company_size: company?.company_size || '1-10',
    company_stage: company?.company_stage || 'idea',
    founded_year: company?.founded_year || new Date().getFullYear(),
    email: company?.email || '',
    phone: company?.phone || '',
    mission_statement: company?.mission_statement || '',
    culture_description: company?.culture_description || '',
    values: company?.values || [],
    locations: company?.locations || [],
    social_links: {
      linkedin: company?.social_links?.linkedin || '',
      twitter: company?.social_links?.twitter || '',
      facebook: company?.social_links?.facebook || '',
      instagram: company?.social_links?.instagram || '',
      github: company?.social_links?.github || '',
    },
    branding: {
      logo_url: company?.branding?.logo_url || '',
      banner_url: company?.branding?.banner_url || '',
      primary_color: company?.branding?.primary_color || '#007bff',
      secondary_color: company?.branding?.secondary_color || '#6c757d',
      font_family: company?.branding?.font_family || '',
    },
    benefits: {
      health_insurance: company?.benefits?.health_insurance || false,
      dental_insurance: company?.benefits?.dental_insurance || false,
      vision_insurance: company?.benefits?.vision_insurance || false,
      retirement_plan: company?.benefits?.retirement_plan || false,
      paid_time_off: company?.benefits?.paid_time_off || false,
      flexible_hours: company?.benefits?.flexible_hours || false,
      remote_work: company?.benefits?.remote_work || false,
      professional_development: company?.benefits?.professional_development || false,
      gym_membership: company?.benefits?.gym_membership || false,
      free_meals: company?.benefits?.free_meals || false,
      stock_options: company?.benefits?.stock_options || false,
      custom_benefits: company?.benefits?.custom_benefits || [],
    },
  });

  const [newValue, setNewValue] = useState('');
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [newLocation, setNewLocation] = useState<CompanyLocation>({
    city: '',
    country: '',
    address: '',
    state: '',
    postal_code: '',
    is_headquarters: false,
  });
  const [showLocationForm, setShowLocationForm] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => {
      const parentData = prev[parent as keyof typeof prev] as Record<string, any>;
      return {
        ...prev,
        [parent]: {
          ...parentData,
          [field]: value,
        },
      };
    });
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll create a mock URL
    const mockUrl = `https://storage.example.com/${type}/${Date.now()}-${file.name}`;
    
    handleNestedInputChange('branding', `${type}_url`, mockUrl);
    
    // TODO: Implement actual file upload to cloud storage
    console.log(`Uploading ${type}:`, file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'logo');
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'banner');
    }
  };

  const addValue = () => {
    if (newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }));
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  };

  const addCustomBenefit = () => {
    if (newCustomBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: {
          ...prev.benefits,
          custom_benefits: [...prev.benefits.custom_benefits, newCustomBenefit.trim()],
        },
      }));
      setNewCustomBenefit('');
    }
  };

  const removeCustomBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        custom_benefits: prev.benefits.custom_benefits.filter((_, i) => i !== index),
      },
    }));
  };

  const addLocation = () => {
    if (newLocation.city && newLocation.country) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation],
      }));
      setNewLocation({
        city: '',
        country: '',
        address: '',
        state: '',
        postal_code: '',
        is_headquarters: false,
      });
      setShowLocationForm(false);
    }
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief company tagline"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your company..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Founded Year
            </label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.founded_year}
              onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
            </label>
            <select
              required
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INDUSTRY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size *
            </label>
            <select
              required
              value={formData.company_size}
              onChange={(e) => handleInputChange('company_size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COMPANY_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Stage *
            </label>
            <select
              required
              value={formData.company_stage}
              onChange={(e) => handleInputChange('company_stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COMPANY_STAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Locations</h3>
          <button
            type="button"
            onClick={() => setShowLocationForm(true)}
            className="btn-secondary"
          >
            Add Location
          </button>
        </div>

        {formData.locations.length > 0 && (
          <div className="space-y-3 mb-4">
            {formData.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium">
                    {location.city}, {location.country}
                    {location.is_headquarters && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        HQ
                      </span>
                    )}
                  </div>
                  {location.address && (
                    <div className="text-sm text-gray-600">{location.address}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {showLocationForm && (
          <div className="border border-gray-200 rounded-md p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={newLocation.city}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={newLocation.country}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={newLocation.state}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={newLocation.postal_code}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_headquarters"
                checked={newLocation.is_headquarters}
                onChange={(e) => setNewLocation(prev => ({ ...prev, is_headquarters: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_headquarters" className="ml-2 block text-sm text-gray-900">
                This is our headquarters
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={addLocation}
                className="btn-primary"
              >
                Add Location
              </button>
              <button
                type="button"
                onClick={() => setShowLocationForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Branding */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Branding</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                {formData.branding.logo_url && (
                  <img
                    src={formData.branding.logo_url}
                    alt="Company Logo"
                    className="h-16 w-16 object-cover rounded-md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Upload Logo
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner
              </label>
              <div className="flex items-center space-x-4">
                {formData.branding.banner_url && (
                  <img
                    src={formData.branding.banner_url}
                    alt="Company Banner"
                    className="h-16 w-32 object-cover rounded-md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Upload Banner
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <input
                type="color"
                value={formData.branding.primary_color}
                onChange={(e) => handleNestedInputChange('branding', 'primary_color', e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                value={formData.branding.secondary_color}
                onChange={(e) => handleNestedInputChange('branding', 'secondary_color', e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={formData.social_links.linkedin}
              onChange={(e) => handleNestedInputChange('social_links', 'linkedin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="url"
              value={formData.social_links.twitter}
              onChange={(e) => handleNestedInputChange('social_links', 'twitter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://twitter.com/yourcompany"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={formData.social_links.facebook}
              onChange={(e) => handleNestedInputChange('social_links', 'facebook', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://facebook.com/yourcompany"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub
            </label>
            <input
              type="url"
              value={formData.social_links.github}
              onChange={(e) => handleNestedInputChange('social_links', 'github', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/yourcompany"
            />
          </div>
        </div>
      </div>

      {/* Culture & Values */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Culture & Values</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission Statement
            </label>
            <textarea
              rows={3}
              value={formData.mission_statement}
              onChange={(e) => handleInputChange('mission_statement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What is your company's mission?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culture Description
            </label>
            <textarea
              rows={4}
              value={formData.culture_description}
              onChange={(e) => handleInputChange('culture_description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your company culture..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Values
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a company value"
              />
              <button
                type="button"
                onClick={addValue}
                className="btn-primary"
              >
                Add
              </button>
            </div>
            {formData.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.values.map((value, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => removeValue(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Benefits & Perks</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formData.benefits).map(([key, value]) => {
              if (key === 'custom_benefits') return null;
              
              const label = key.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              
              return (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value as boolean}
                    onChange={(e) => handleNestedInputChange('benefits', key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={key} className="ml-2 block text-sm text-gray-900">
                    {label}
                  </label>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Benefits
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newCustomBenefit}
                onChange={(e) => setNewCustomBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomBenefit())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a custom benefit"
              />
              <button
                type="button"
                onClick={addCustomBenefit}
                className="btn-primary"
              >
                Add
              </button>
            </div>
            {formData.benefits.custom_benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.benefits.custom_benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeCustomBenefit(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : company ? 'Update Company Profile' : 'Create Company Profile'}
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;