import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
        role="banner"
      >
        <nav className="container-custom py-4" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-3xl" aria-hidden="true">🚀</div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  <a href="/" aria-label="DoProof home page">DoProof</a>
                </h1>
                <p className="text-xs text-gray-500 -mt-1 sr-only sm:not-sr-only">Empowering Innovation</p>
              </div>
            </div>

            {/* Login/Logout Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm text-gray-600 sr-only sm:not-sr-only">
                  Welcome, <span className="font-medium">{user?.email}</span>!
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-outline text-sm px-4 sm:px-6 py-2 min-h-[44px] min-w-[44px] sm:min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Logout"
                >
                  <span className="sr-only sm:not-sr-only">Logout</span>
                  <span className="sm:sr-only" aria-hidden="true">🚪</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-outline text-sm px-4 sm:px-6 py-2 min-h-[44px] min-w-[44px] sm:min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Get started - Login or sign up"
              >
                <span className="sr-only sm:not-sr-only">Get Started</span>
                <span className="sm:sr-only" aria-hidden="true">👤</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20"></div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};

export default Header; 