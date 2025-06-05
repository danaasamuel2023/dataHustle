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
  ArrowRight
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

  // Navigation Item Component - Minimal Modern Style
  const NavItem = ({ icon, text, path, onClick, disabled = false, badge = null, isActive = false }) => {
    const itemClasses = `relative flex items-center py-4 px-6 ${
      disabled 
        ? 'opacity-30 cursor-not-allowed' 
        : 'hover:bg-gradient-to-r hover:from-transparent hover:to-indigo-500/5 cursor-pointer'
    } transition-all duration-300 group ${
      isActive ? 'bg-gradient-to-r from-transparent to-indigo-500/10 border-r-2 border-indigo-500' : ''
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
        <div className={`mr-4 transition-all duration-300 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-400'}`}>
          {icon}
        </div>
        <span className={`font-medium text-[15px] flex-1 transition-colors ${
          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
        }`}>
          {text}
        </span>
        {badge && (
          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-500 text-white rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
        {disabled && (
          <span className="px-2.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
            Soon
          </span>
        )}
        {!disabled && !isActive && (
          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
        )}
      </div>
    );
  };

  // Section Heading Component - Minimal Style
  const SectionHeading = ({ title }) => (
    <div className="px-6 py-2 mb-1">
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {title}
      </p>
    </div>
  );

  return (
    <>
      {/* Fixed Header - Minimal & Clean */}
      <header className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center h-16 px-4 max-w-screen-xl mx-auto">
          <div className="flex items-center">
            <span 
              className="cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  DATAHUSTLE
                </h1>
              </div>
            </span>
          </div>
          <div className="flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="p-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300"
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
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Minimal Design */}
      <aside 
        className={`fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-500 ease-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header - Clean & Minimal */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 px-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User Info Section - Card Style */}
          {isLoggedIn && (
            <div className="px-6 pb-6">
              <div 
                className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl cursor-pointer hover:shadow-md transition-all duration-300 border border-indigo-100 dark:border-indigo-800/50"
                onClick={navigateToProfile}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <User size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {userName ? userName : 'My Account'}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">View Profile</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Content - Clean Layout */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto">
          {isLoggedIn ? (
            <div className="py-4">
              <SectionHeading title="Main" />
              <NavItem 
                icon={<Home size={20} />} 
                text="Dashboard" 
                path="/" 
                isActive={activeSection === "Dashboard"}
              />
              {userRole === "admin" && (
                <NavItem 
                  icon={<Shield size={20} />} 
                  text="Admin Panel" 
                  path="/admin" 
                  badge="Admin"
                />
              )}

              <div className="my-6">
                <SectionHeading title="Services" />
                <NavItem 
                  icon={<Globe size={20} />} 
                  text="AirtelTigo" 
                  path="/at-ishare" 
                />
                <NavItem 
                  icon={<Activity size={20} />} 
                  text="MTN Data" 
                  path="/mtnup2u" 
                />
                <NavItem 
                  icon={<Layers size={20} />} 
                  text="Telecel" 
                  path="/TELECEL" 
                />
                <NavItem 
                  icon={<Sparkles size={20} />} 
                  text="AT Big Time" 
                  path="/at-big-time"
                  disabled={true} 
                />
              </div>

              <div className="my-6">
                <SectionHeading title="Finance" />
                <NavItem 
                  icon={<Wallet size={20} />} 
                  text="Top Up" 
                  path="/topup" 
                />
                <NavItem 
                  icon={<ShoppingCart size={20} />} 
                  text="Transactions" 
                  path="/myorders" 
                />
              </div>

              <div className="my-6">
                <SectionHeading title="More" />
                <NavItem 
                  icon={<BarChart2 size={20} />} 
                  text="Analytics" 
                  path="/reports"
                  disabled={true}
                />
                <NavItem 
                  icon={<Settings size={20} />} 
                  text="Settings" 
                  path="/settings"
                  disabled={true}
                />
              </div>

              {/* Logout Button - Bottom */}
              <div className="mt-8 px-6 pb-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-300 font-medium"
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // Not logged in state - Clean & Modern
            <div className="p-6 flex flex-col items-center justify-center h-full">
              <div className="text-center mb-8 max-w-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to DataHustle
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Sign in to access all features and start your data journey</p>
              </div>
              
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => {
                    router.push('/SignIn');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  Sign In
                </button>
                
                <button
                  onClick={() => {
                    router.push('/SignUp');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 font-semibold"
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