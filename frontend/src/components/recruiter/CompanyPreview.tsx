import React from 'react';
import { Company } from '../../hooks/recruiter/useCompany';

interface CompanyPreviewProps {
  company: Company;
  onClose: () => void;
}

const CompanyPreview: React.FC<CompanyPreviewProps> = ({ company, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatCompanySize = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      '1-10': '1-10 employees',
      '11-50': '11-50 employees',
      '51-200': '51-200 employees',
      '201-1000': '201-1000 employees',
      '1000+': '1000+ employees',
    };
    return sizeMap[size] || size;
  };

  const formatCompanyStage = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      'idea': 'Idea Stage',
      'seed': 'Seed',
      'series_a': 'Series A',
      'series_b': 'Series B',
      'series_c': 'Series C',
      'growth': 'Growth',
      'public': 'Public',
      'established': 'Established',
    };
    return stageMap[stage] || stage;
  };

  const formatIndustry = (industry: string) => {
    return industry.charAt(0).toUpperCase() + industry.slice(1);
  };

  const activeBenefits = Object.entries(company.benefits)
    .filter(([key, value]) => key !== 'custom_benefits' && value === true)
    .map(([key]) => key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));

  const allBenefits = [...activeBenefits, ...company.benefits.custom_benefits];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Company Profile Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Company Header */}
          <div className="relative mb-8">
            {/* Banner */}
            {company.branding.banner_url && (
              <div className="h-48 rounded-lg overflow-hidden mb-4">
                <img
                  src={company.branding.banner_url}
                  alt="Company Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Company Info */}
            <div className="flex items-start space-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {company.branding.logo_url ? (
                  <img
                    src={company.branding.logo_url}
                    alt={`${company.name} Logo`}
                    className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">
                      {company.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Company Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                  {company.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                
                {company.tagline && (
                  <p className="text-lg text-gray-600 mb-3">{company.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                    {formatIndustry(company.industry)}
                  </span>
                  
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {formatCompanySize(company.company_size)}
                  </span>
                  
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {formatCompanyStage(company.company_stage)}
                  </span>
                  
                  {company.founded_year && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Founded {company.founded_year}
                    </span>
                  )}
                </div>

                {/* Contact & Social Links */}
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Visit Website
                    </a>
                  )}
                  
                  {company.social_links.linkedin && (
                    <a
                      href={company.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      LinkedIn
                    </a>
                  )}
                  
                  {company.social_links.twitter && (
                    <a
                      href={company.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Twitter
                    </a>
                  )}
                  
                  {company.social_links.github && (
                    <a
                      href={company.social_links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{company.total_jobs_posted}</div>
              <div className="text-sm text-blue-800">Jobs Posted</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{company.total_applications_received}</div>
              <div className="text-sm text-green-800">Applications Received</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{company.total_hires}</div>
              <div className="text-sm text-purple-800">Successful Hires</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* About Section */}
            <div className="space-y-6">
              {company.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About Us</h3>
                  <p className="text-gray-700 leading-relaxed">{company.description}</p>
                </div>
              )}

              {company.mission_statement && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Mission</h3>
                  <p className="text-gray-700 leading-relaxed">{company.mission_statement}</p>
                </div>
              )}

              {company.culture_description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Culture</h3>
                  <p className="text-gray-700 leading-relaxed">{company.culture_description}</p>
                </div>
              )}

              {company.values.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.values.map((value, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Locations */}
              {company.locations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Locations</h3>
                  <div className="space-y-2">
                    {company.locations.map((location, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <svg className="w-4 h-4 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">
                            {location.city}, {location.country}
                            {location.is_headquarters && (
                              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                HQ
                              </span>
                            )}
                          </div>
                          {location.address && (
                            <div className="text-sm text-gray-600">{location.address}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {allBenefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {allBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {company.email && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-700">{company.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Company profile created {formatDate(company.created_at)}
            {company.updated_at !== company.created_at && (
              <span> • Last updated {formatDate(company.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPreview;