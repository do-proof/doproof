import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false,
  lines = 1
}) => {
  const baseClasses = `animate-pulse bg-gray-200 ${width} ${height} ${
    rounded ? 'rounded-full' : 'rounded'
  } ${className}`;

  if (lines === 1) {
    return <div className={baseClasses} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${
            index === lines - 1 ? 'w-3/4' : ''
          }`}
        />
      ))}
    </div>
  );
};

// Predefined skeleton components for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-4">
      <SkeletonLoader height="h-6" width="w-3/4" />
      <SkeletonLoader lines={3} />
      <div className="flex space-x-2">
        <SkeletonLoader width="w-20" height="h-8" rounded />
        <SkeletonLoader width="w-16" height="h-8" rounded />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 4, 
  className = '' 
}) => (
  <tr className={className}>
    {Array.from({ length: columns }, (_, index) => (
      <td key={index} className="px-6 py-4">
        <SkeletonLoader />
      </td>
    ))}
  </tr>
);

export const JobCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonLoader height="h-6" width="w-2/3" className="mb-2" />
          <SkeletonLoader height="h-4" width="w-1/2" />
        </div>
        <SkeletonLoader width="w-16" height="h-6" rounded />
      </div>
      
      {/* Content */}
      <SkeletonLoader lines={2} />
      
      {/* Task info */}
      <div className="bg-gray-50 rounded-md p-3">
        <SkeletonLoader height="h-4" width="w-1/3" className="mb-2" />
        <SkeletonLoader lines={2} />
      </div>
      
      {/* Stats */}
      <div className="flex justify-between">
        <SkeletonLoader width="w-20" height="h-4" />
        <SkeletonLoader width="w-24" height="h-4" />
        <SkeletonLoader width="w-16" height="h-4" />
      </div>
      
      {/* Actions */}
      <div className="flex space-x-2 pt-2">
        <SkeletonLoader width="w-16" height="h-8" rounded />
        <SkeletonLoader width="w-20" height="h-8" rounded />
        <SkeletonLoader width="w-12" height="h-8" rounded />
      </div>
    </div>
  </div>
);

export const CandidateCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-4">
      {/* Header with avatar */}
      <div className="flex items-center space-x-4">
        <SkeletonLoader width="w-12" height="h-12" rounded />
        <div className="flex-1">
          <SkeletonLoader height="h-5" width="w-1/2" className="mb-1" />
          <SkeletonLoader height="h-4" width="w-1/3" />
        </div>
      </div>
      
      {/* Skills */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonLoader key={index} width="w-16" height="h-6" rounded />
        ))}
      </div>
      
      {/* Stats */}
      <SkeletonLoader lines={2} />
      
      {/* Actions */}
      <div className="flex space-x-2">
        <SkeletonLoader width="w-20" height="h-8" rounded />
        <SkeletonLoader width="w-24" height="h-8" rounded />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;