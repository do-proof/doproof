import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Responsive grid component with mobile-first column layout
 * Automatically adjusts columns and spacing based on viewport
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { base: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '',
}) => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop, getResponsiveValue } = useResponsive();

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-5 lg:gap-6',
    lg: 'gap-6 sm:gap-7 lg:gap-8',
    xl: 'gap-8 sm:gap-10 lg:gap-12',
  };

  const currentColumns = getResponsiveValue({
    base: columns.base || 1,
    sm: columns.sm,
    md: columns.md,
    lg: columns.lg,
    xl: columns.xl,
  });

  const gridTemplateColumns = `repeat(${currentColumns}, minmax(0, 1fr))`;

  return (
    <div
      className={`grid ${gapClasses[gap]} ${className}`}
      style={{ gridTemplateColumns }}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
