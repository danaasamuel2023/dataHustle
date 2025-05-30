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
  Moon,
  Sun,
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
  Settings
} from 'lucide-react';

const MobileNavbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [userRole, setUserRole] = useState("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Check system preference and local storage on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (savedTheme === null && prefersDarkMode)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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

  // Navigation Item Component - Modern & Compact
  const NavItem = ({ icon, text, path, onClick, disabled = false, badge = null }) => {
    const itemClasses = `group relative flex items-center py-3 px-4 ${
      disabled 
        ? 'opacity-40 cursor-not-allowed' 
        : 'hover:bg-white/10 cursor-pointer'
    } transition-all duration-300 rounded-xl mx-2 mb-1 backdrop-blur-sm`;
    
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
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-400/20 text-emerald-300 mr-3 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className="text-white/90 font-medium text-sm flex-1 group-hover:text-white transition-colors">
          {text}
        </span>
        {badge && (
          <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-900 rounded-full">
            {badge}
          </span>
        )}
        {disabled && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
            Soon
          </span>
        )}
        {!disabled && (
          <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" />
        )}
      </div>
    );
  };

  // Section Heading Component - Compact
  const SectionHeading = ({ title, icon }) => (
    <div className="flex items-center px-4 py-2 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 mx-2">
      {icon && <div className="mr-2">{icon}</div>}
      {title}
    </div>
  );

  return (
    <>
      {/* Fixed Header - Compact */}
      <header className="fixed top-0 left-0 w-full bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl shadow-xl z-40 border-b border-white/10">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center">
            <span 
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => router.push('/')}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text tracking-tight">
                  DATAHUSTLE
                </h1>
              </div>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Modern Glass Design */}
      <aside 
        className={`fixed right-0 top-0 h-full w-80 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl transform transition-all duration-500 ease-out z-50 border-l border-white/10 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Sidebar Header - Compact */}
        <div className="relative z-10 border-b border-white/10 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20">
          <div className="flex justify-between items-center p-4">
            <span 
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => {
                router.push('/');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
                  DATAHUSTLE
                </h1>
              </div>
            </span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* User Info Section - Compact */}
          {isLoggedIn && (
            <div className="p-4 pt-0">
              <div 
                className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-105 border border-white/10"
                onClick={navigateToProfile}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <User size={18} />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-bold text-sm text-white">
                    {userName ? userName : 'My Account'}
                  </div>
                  <div className="text-xs text-emerald-400 font-medium">View Profile</div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Content - Compact */}
        <div className="relative z-10 h-[calc(100vh-140px)] overflow-y-auto py-3">
          {isLoggedIn ? (
            <>
              <div className="py-2">
                <SectionHeading title="Dashboard" icon={<Activity size={12} />} />
                <NavItem 
                  icon={<Home size={16} />} 
                  text="Dashboard" 
                  path="/" 
                />
                {userRole === "admin" && (
                  <NavItem 
                    icon={<LayoutDashboard size={16} />} 
                    text="Admin Panel" 
                    path="/admin" 
                    badge="Admin"
                  />
                )}
              </div>

              <div className="py-2">
                <SectionHeading title="Services" icon={<Layers size={12} />} />
                <NavItem 
                  icon={<Layers size={16} />} 
                  text="AirtelTigo" 
                  path="/at-ishare" 
                />
                <NavItem 
                  icon={<Layers size={16} />} 
                  text="MTN Data" 
                  path="/mtnup2u" 
                />
                <NavItem 
                  icon={<Layers size={16} />} 
                  text="Telecel" 
                  path="/TELECEL" 
                />
                <NavItem 
                  icon={<Layers size={16} />} 
                  text="AT Big Time" 
                  path="/at-big-time"
                  disabled={true} 
                />
              </div>

              <div className="py-2">
                <SectionHeading title="Finance" icon={<TrendingUp size={12} />} />
                <NavItem 
                  icon={<CreditCard size={16} />} 
                  text="Top Up" 
                  path="/topup" 
                />
                <NavItem 
                  icon={<ShoppingCart size={16} />} 
                  text="Transactions" 
                  path="/myorders" 
                />
              </div>

              <div className="py-2">
                <SectionHeading title="More" icon={<Settings size={12} />} />
                <NavItem 
                  icon={<BarChart2 size={16} />} 
                  text="Analytics" 
                  path="/reports"
                  disabled={true}
                />
              </div>

              {/* Logout Button - Bottom */}
              <div className="mt-6 mx-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-xl border border-red-500/30 hover:from-red-500/30 hover:to-pink-500/30 hover:text-red-200 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <LogOut size={16} className="mr-2" strokeWidth={2} />
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            // Not logged in state - Compact
            <div className="p-6 flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text mb-2">
                  Welcome Back!
                </h2>
                <p className="text-white/70 text-sm">Sign in to access your hustle zone</p>
              </div>
              
              <button
                onClick={() => {
                  router.push('/SignIn');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mb-3 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="font-bold text-sm">Sign In</span>
              </button>
              
              <button
                onClick={() => {
                  router.push('/SignUp');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 px-4 bg-white/10 text-emerald-400 border border-emerald-400/50 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <span className="font-bold text-sm">Create Account</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-14">
        {/* Your content goes here */}
      </main>

      {/* Enhanced Animation Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #0d9488);
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0f766e);
        }
      `}</style>
    </>
  );
};

export default MobileNavbar;