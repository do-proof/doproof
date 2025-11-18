import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  role?: string;
}

/**
 * Responsive card component with mobile-first design
 * Automatically adjusts padding, spacing, and layout based on viewport
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  padding = 'md',
  elevation = 'md',
  interactive = false,
  onClick,
  ariaLabel,
  role,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6',
    lg: isMobile ? 'p-5' : isTablet ? 'p-6' : 'p-8',
  };

  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:translate-y-0'
    : '';

  const baseClasses = `
    bg-white rounded-lg border border-gray-200
    ${elevationClasses[elevation]}
    ${interactiveClasses}
    ${className}
  `;

  const CardWrapper = onClick ? 'button' : 'div';
  const cardProps = onClick
    ? {
        onClick,
        'aria-label': ariaLabel || title,
        role: role || 'button',
        className: `${baseClasses} w-full text-left`,
      }
    : {
        'aria-label': ariaLabel,
        role,
        className: baseClasses,
      };

  return (
    <CardWrapper {...cardProps}>
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div
          className={`
            ${paddingClasses[padding]}
            ${footer || children ? 'border-b border-gray-200' : ''}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={`
                  font-semibold text-gray-900 truncate
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`
                  text-gray-600 mt-1
                  ${isMobile ? 'text-sm' : 'text-base'}
                `}>
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children && (
        <div className={paddingClasses[padding]}>
          {children}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div
          className={`
            ${paddingClasses[padding]}
            border-t border-gray-200 bg-gray-50
          `}
        >
          {footer}
        </div>
      )}
    </CardWrapper>
  );
};

export default ResponsiveCard;
