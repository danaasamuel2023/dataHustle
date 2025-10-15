'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  LayoutDashboard, 
  Layers, 
  User,
  CreditCard,
  LogOut,
  ChevronRight,
  ShoppingCart,
  BarChart2,
  Menu,
  X,
  Zap,
  Sparkles,
  Activity,
  TrendingUp,
  Settings,
  Wallet,
  Globe,
  Shield,
  ArrowRight,
  Database
} from 'lucide-react';

const MobileNavbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [userRole, setUserRole] = useState("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Check user role and login status on initial load
  useEffect(() => {
    // Check user role and login status from localStorage
    try {
      const authToken = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const dataUser = JSON.parse(localStorage.getItem('data.user') || '{}');
      
      const loggedIn = !!authToken;
      setIsLoggedIn(loggedIn);
      
      if (!loggedIn) {
        return;
      }
      
      if (userData && userData.role) {
        setUserRole(userData.role);
        setUserName(userData.name || '');
      } else if (dataUser && dataUser.role) {
        setUserRole(dataUser.role);
        setUserName(dataUser.name || '');
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setIsLoggedIn(false);
    }
  }, []);

  // Enhanced Logout function
  const handleLogout = () => {
    console.log("Logout initiated");
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('data.user');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      setIsLoggedIn(false);
      setUserRole("user");
      
      window.location.href = '/';
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = '/';
    }
  };

  // Navigate to profile page
  const navigateToProfile = () => {
    router.push('/profile');
    setIsMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Navigation Item Component - Matching Dashboard Style
  const NavItem = ({ icon, text, path, onClick, disabled = false, badge = null, isActive = false }) => {
    const itemClasses = `relative flex items-center py-3.5 px-4 ${
      disabled 
        ? 'opacity-30 cursor-not-allowed' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
    } transition-all duration-200 group ${
      isActive ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500' : ''
    }`;
    
    return (
      <div 
        className={itemClasses}
        onClick={() => {
          if (disabled) return;
          if (onClick) {
            onClick();
          } else {
            router.push(path);
            setIsMobileMenuOpen(false);
          }
        }}
      >
        <div className={`mr-3 transition-all duration-200 ${isActive ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400 group-hover:text-yellow-600'}`}>
          {icon}
        </div>
        <span className={`font-medium text-sm flex-1 transition-colors ${
          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
        }`}>
          {text}
        </span>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-white rounded-full">
            {badge}
          </span>
        )}
        {disabled && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
            Soon
          </span>
        )}
        {!disabled && !isActive && (
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200" />
        )}
      </div>
    );
  };

  // Section Heading Component
  const SectionHeading = ({ title }) => (
    <div className="px-4 pt-4 pb-2">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {title}
      </p>
    </div>
  );

  return (
    <>
      {/* Fixed Header - Matching Dashboard Style */}
      <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-sm z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center h-16 px-4 max-w-screen-xl mx-auto">
          <div className="flex items-center">
            <span 
              className="cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center shadow-sm">
                  <Database className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  DataHustle
                </h1>
              </div>
            </span>
          </div>
          <div className="flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Matching Dashboard Style */}
      <aside 
        className={`fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-out z-50 border-l border-gray-200 dark:border-gray-800 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User Info Section */}
          {isLoggedIn && (
            <div className="px-4 pb-4">
              <div 
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={navigateToProfile}
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-sm">
                  <User size={18} />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {userName ? userName : 'My Account'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">View Profile</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto">
          {isLoggedIn ? (
            <div className="py-2">
              <SectionHeading title="Main" />
              <NavItem 
                icon={<Home size={19} />} 
                text="Dashboard" 
                path="/" 
                isActive={activeSection === "Dashboard"}
              />
              {userRole === "admin" && (
                <NavItem 
                  icon={<Shield size={19} />} 
                  text="Admin Panel" 
                  path="/admin" 
                  badge="Admin"
                />
              )}

              <SectionHeading title="Services" />
              <NavItem 
                icon={<Activity size={19} />} 
                text="MTN Data" 
                path="/mtnup2u" 
              />
              <NavItem 
                icon={<Globe size={19} />} 
                text="AirtelTigo" 
                path="/at-ishare" 
              />
              <NavItem 
                icon={<Layers size={19} />} 
                text="Telecel" 
                path="/TELECEL" 
              />
              <NavItem 
                icon={<Sparkles size={19} />} 
                text="AT Big Time" 
                path="/at-big-time"
                disabled={true} 
              />

              <SectionHeading title="Finance" />
              <NavItem 
                icon={<Wallet size={19} />} 
                text="Top Up" 
                path="/topup" 
              />
              <NavItem 
                icon={<ShoppingCart size={19} />} 
                text="Transactions" 
                path="/myorders" 
              />

              <SectionHeading title="More" />
              <NavItem 
                icon={<BarChart2 size={19} />} 
                text="Analytics" 
                path="/reports"
                disabled={true}
              />
              <NavItem 
                icon={<Settings size={19} />} 
                text="Settings" 
                path="/settings"
                disabled={true}
              />

              {/* Logout Button */}
              <div className="mt-6 px-4 pb-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors font-medium text-sm border border-gray-200 dark:border-gray-700"
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // Not logged in state
            <div className="p-6 flex flex-col items-center justify-center h-full">
              <div className="text-center mb-8 max-w-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-yellow-500 flex items-center justify-center shadow-md">
                  <Database className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to DataHustle
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to access all features and start managing your data</p>
              </div>
              
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => {
                    router.push('/SignIn');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600 transition-colors font-semibold text-sm"
                >
                  Sign In
                </button>
                
                <button
                  onClick={() => {
                    router.push('/SignUp');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-16">
        {/* Your content goes here */}
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        
        .dark ::-webkit-scrollbar-thumb {
          background: #374151;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </>
  );
};

export default MobileNavbar;