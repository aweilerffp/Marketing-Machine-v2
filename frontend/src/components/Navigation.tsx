import React from 'react';
import { UserButton } from '@clerk/clerk-react';

interface NavigationProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage = 'dashboard', onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'factory', label: 'Factory Floor', icon: '🏭' },
    { id: 'content', label: 'Content Queue', icon: '📝' },
    { id: 'status', label: 'Status', icon: '🟢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const handleNavClick = (pageId: string) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Marketing Machine</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-3 space-x-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`inline-flex items-center text-sm font-medium transition-colors duration-200 ${
                currentPage === item.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};