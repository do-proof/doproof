import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { FocusTrap } from '../../utils/accessibility';
import AccessibleButton from '../AccessibleButton';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  ariaLabel: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', path: '/student/dashboard', ariaLabel: 'Go to dashboard home' },
  { id: 'tasks', label: 'Tasks', icon: '📋', path: '/student/dashboard?tab=tasks', ariaLabel: 'Browse available tasks' },
  { id: 'applications', label: 'Applications', icon: '📝', path: '/student/applications', ariaLabel: 'View my applications' },
  { id: 'history', label: 'History', icon: '📚', path: '/student/history', ariaLabel: 'View submission history' },
  { id: 'analytics', label: 'Analytics', icon: '📊', path: '/student/analytics', ariaLabel: 'View performance analytics' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/student/profile', ariaLabel: 'Manage profile settings' },
];

interface ResponsiveNavigationProps {
  currentPath?: string;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusTrap, setFocusTrap] = useState<FocusTrap | null>(null);

  const activePath = currentPath || location.pathname;

  // Handle mobile menu focus trap
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      const menuElement = document.getElementById('mobile-menu');
      if (menuElement) {
        const trap = new FocusTrap(menuElement);
        trap.activate();
        setFocusTrap(trap);
      }
    } else if (focusTrap) {
      focusTrap.deactivate();
      setFocusTrap(null);
    }

    return () => {
      if (focusTrap) {
        focusTrap.deactivate();
      }
    };
  }, [mobileMenuOpen, isMobile]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/student/dashboard') {
      return activePath === path || activePath === '/student/dashboard?tab=home';
    }
    return activePath.startsWith(path);
  };

  // Desktop/Tablet Navigation
  if (!isMobile) {
    return (
      <nav 
        className="bg-white shadow-sm border-b border-gray-200" 
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl" aria-hidden="true">🚀</div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DoProof</h1>
                <p className="text-xs text-gray-500 -mt-1">Student Dashboard</p>
              </div>
            </div>
            
            {/* Navigation Items */}
            <div className="hidden md:flex space-x-1" role="menubar">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all touch-target ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  aria-label={item.ariaLabel}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  role="menuitem"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden lg:inline">
                Welcome, <span className="font-medium">{user?.email}</span>!
              </span>
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Logout from account"
              >
                Logout
              </AccessibleButton>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation
  return (
    <>
      {/* Mobile Header */}
      <nav 
        className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40" 
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-xl" aria-hidden="true">🚀</div>
            <div>
              <h1 className="text-lg font-bold gradient-text">DoProof</h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-target"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 mt-16"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            className="fixed top-16 left-0 right-0 bg-white shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>

            {/* Navigation Items */}
            <div className="py-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left touch-target ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label={item.ariaLabel}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  role="menuitem"
                >
                  <span className="text-xl" aria-hidden="true">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="px-4 py-3 border-t border-gray-200">
              <AccessibleButton
                variant="outline"
                fullWidth
                onClick={handleLogout}
                aria-label="Logout from account"
              >
                Logout
              </AccessibleButton>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <div className="mobile-nav" role="navigation" aria-label="Bottom navigation">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`mobile-nav-item ${
              isActive(item.path) ? 'text-blue-700' : 'text-gray-600'
            }`}
            aria-label={item.ariaLabel}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            <span className="text-xl mb-1" aria-hidden="true">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Spacer for fixed bottom nav */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
};

export default ResponsiveNavigation;
