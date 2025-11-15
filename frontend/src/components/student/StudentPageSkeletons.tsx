import React from 'react';
import SkeletonLoader, { CardSkeleton, JobCardSkeleton } from '../SkeletonLoader';

export const ApplicationsPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonLoader height="h-8" width="w-64" className="mb-2" />
        <SkeletonLoader height="h-4" width="w-96" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] p-4">
            <div className="flex items-center justify-between mb-4">
              <SkeletonLoader height="h-5" width="w-24" />
              <SkeletonLoader height="h-6" width="w-8" rounded />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <CardSkeleton key={j} className="p-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const RecommendationsPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonLoader height="h-8" width="w-64" className="mb-2" />
        <SkeletonLoader height="h-4" width="w-96" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const AnalyticsPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonLoader height="h-8" width="w-48" className="mb-2" />
        <SkeletonLoader height="h-4" width="w-80" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton className="h-96" />
        <CardSkeleton className="h-96" />
      </div>
    </div>
  </div>
);

export const ProfilePageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonLoader height="h-8" width="w-40" className="mb-2" />
        <SkeletonLoader height="h-4" width="w-64" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <SkeletonLoader height="h-6" width="w-32" />
          <SkeletonLoader lines={4} />
          <SkeletonLoader height="h-6" width="w-40" />
          <SkeletonLoader lines={3} />
        </div>
      </div>
    </div>
  </div>
);

export const SubmissionHistoryPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonLoader height="h-8" width="w-56" className="mb-2" />
        <SkeletonLoader height="h-4" width="w-80" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);


