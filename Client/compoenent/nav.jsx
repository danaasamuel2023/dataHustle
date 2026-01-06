'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  CheckCircle,
  AlertCircle,
  Loader,
  Smartphone,
  Receipt,
  Settings,
  HelpCircle
} from 'lucide-react';
// Simple Success/Error Animation Components (no Lottie needed)
const SuccessAnimation = () => (
  <div className="flex justify-center items-center w-[180px] h-[180px] mx-auto">
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-success-pop">
        <svg className="w-12 h-12 text-emerald-500 animate-check-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-20"></div>
    </div>
  </div>
);

const ErrorAnimation = () => (
  <div className="flex justify-center items-center w-[180px] h-[180px] mx-auto">
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-success-pop">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  </div>
);

// ============================================
// NETWORK LOGO COMPONENTS
// ============================================

const MTNLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="16" fill="#FFCC00"/>
    <ellipse cx="50" cy="50" rx="38" ry="26" stroke="#000" strokeWidth="4" fill="none"/>
    <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="20" fontWeight="900" fill="#000">MTN</text>
  </svg>
);

const TelecelLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="16" fill="#FFF"/>
    <circle cx="50" cy="50" r="42" fill="#E30613"/>
    <text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="600" fill="#FFF">t</text>
  </svg>
);

const TigoLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#0066B3"/>
    <circle cx="35" cy="40" r="6" fill="#FFF"/>
    <circle cx="65" cy="40" r="6" fill="#FFF"/>
    <path d="M30 58 Q50 78 70 58" stroke="#FFF" strokeWidth="6" fill="none" strokeLinecap="round"/>
  </svg>
);

const MobileNavbar = () => {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const sidebarRef = useRef(null);

  // Avatar configurations - different people
  const avatars = [
    { // Young man with short hair
      skin: '#FDBF6F', hair: '#5D4037', shirt: '#6366F1', bg: '#E0E7FF',
      hairPath: 'M26 32 Q26 10 50 10 Q74 10 74 32 L72 26 Q65 18 50 18 Q35 18 28 26 Z'
    },
    { // Woman with long hair
      skin: '#DEB887', hair: '#1A1A1A', shirt: '#8B5CF6', bg: '#EDE9FE',
      hairPath: 'M22 70 Q20 30 26 20 Q35 10 50 10 Q65 10 74 20 Q80 30 78 70 Q75 50 74 35 L72 26 Q65 16 50 16 Q35 16 28 26 L26 35 Q25 50 22 70 Z'
    },
    { // Man with beard
      skin: '#C68642', hair: '#2C1810', shirt: '#6366F1', bg: '#E0E7FF',
      hairPath: 'M26 30 Q26 8 50 8 Q74 8 74 30 L72 24 Q65 14 50 14 Q35 14 28 24 Z',
      beard: true
    },
    { // Woman with curly hair
      skin: '#8D5524', hair: '#1A1A1A', shirt: '#818CF8', bg: '#E0E7FF',
      hairPath: 'M20 45 Q18 25 28 15 Q38 8 50 8 Q62 8 72 15 Q82 25 80 45 Q78 35 75 28 Q68 12 50 12 Q32 12 25 28 Q22 35 20 45 Z',
      curly: true
    },
    { // Young woman with ponytail
      skin: '#F5CBA7', hair: '#6B4423', shirt: '#A5B4FC', bg: '#E0E7FF',
      hairPath: 'M26 32 Q26 10 50 10 Q74 10 74 32 L72 26 Q65 18 50 18 Q35 18 28 26 Z',
      ponytail: true
    },
    { // Man with glasses
      skin: '#FDBF6F', hair: '#4A4A4A', shirt: '#6366F1', bg: '#E0E7FF',
      hairPath: 'M28 30 Q28 12 50 12 Q72 12 72 30 L70 25 Q65 18 50 18 Q35 18 30 25 Z',
      glasses: true
    },
  ];

  // Change avatar when sidebar opens
  useEffect(() => {
    if (isMobileMenuOpen) {
      setAvatarIndex(Math.floor(Math.random() * avatars.length));
    }
  }, [isMobileMenuOpen]);

  // Avatar Component
  const UserAvatar = ({ avatar }) => (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="100" height="100" rx="16" fill={avatar.bg}/>
      
      {/* Shirt */}
      <path d="M20 100 Q20 78 50 72 Q80 78 80 100" fill={avatar.shirt}/>
      
      {/* Neck */}
      <rect x="42" y="62" width="16" height="14" fill={avatar.skin}/>
      
      {/* Face */}
      <ellipse cx="50" cy="42" rx="24" ry="28" fill={avatar.skin}/>
      
      {/* Hair */}
      <path d={avatar.hairPath} fill={avatar.hair}/>
      
      {/* Extra hair for long/curly styles */}
      {avatar.curly && (
        <>
          <circle cx="24" cy="35" r="6" fill={avatar.hair}/>
          <circle cx="20" cy="45" r="5" fill={avatar.hair}/>
          <circle cx="76" cy="35" r="6" fill={avatar.hair}/>
          <circle cx="80" cy="45" r="5" fill={avatar.hair}/>
        </>
      )}
      
      {/* Ponytail */}
      {avatar.ponytail && (
        <ellipse cx="78" cy="25" rx="8" ry="15" fill={avatar.hair}/>
      )}
      
      {/* Ears */}
      <ellipse cx="26" cy="42" rx="4" ry="7" fill={avatar.skin}/>
      <ellipse cx="74" cy="42" rx="4" ry="7" fill={avatar.skin}/>
      
      {/* Eyebrows */}
      <path d="M34 32 Q38 30 44 33" stroke={avatar.hair} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M56 33 Q62 30 66 32" stroke={avatar.hair} strokeWidth="2" fill="none" strokeLinecap="round"/>
      
      {/* Eye whites */}
      <ellipse cx="39" cy="40" rx="6" ry="5" fill="white"/>
      <ellipse cx="61" cy="40" rx="6" ry="5" fill="white"/>
      
      {/* Pupils */}
      <circle cx="39" cy="41" r="3" fill="#4A3728"/>
      <circle cx="61" cy="41" r="3" fill="#4A3728"/>
      
      {/* Eye shine */}
      <circle cx="40" cy="40" r="1" fill="white"/>
      <circle cx="62" cy="40" r="1" fill="white"/>
      
      {/* Glasses */}
      {avatar.glasses && (
        <>
          <circle cx="39" cy="40" r="10" stroke="#1F2937" strokeWidth="2" fill="none"/>
          <circle cx="61" cy="40" r="10" stroke="#1F2937" strokeWidth="2" fill="none"/>
          <path d="M49 40 L51 40" stroke="#1F2937" strokeWidth="2"/>
          <path d="M29 38 L26 36" stroke="#1F2937" strokeWidth="2"/>
          <path d="M71 38 L74 36" stroke="#1F2937" strokeWidth="2"/>
        </>
      )}
      
      {/* Eyelids (for blink) */}
      <ellipse cx="39" cy="40" rx="7" ry="0" fill={avatar.skin}>
        <animate attributeName="ry" values="0;6;0" dur="4s" repeatCount="indefinite" keyTimes="0;0.05;0.1" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
      </ellipse>
      <ellipse cx="61" cy="40" rx="7" ry="0" fill={avatar.skin}>
        <animate attributeName="ry" values="0;6;0" dur="4s" repeatCount="indefinite" keyTimes="0;0.05;0.1" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
      </ellipse>
      
      {/* Beard */}
      {avatar.beard && (
        <path d="M30 52 Q35 70 50 72 Q65 70 70 52 Q65 60 50 62 Q35 60 30 52" fill={avatar.hair} opacity="0.9"/>
      )}
      
      {/* Nose */}
      <ellipse cx="50" cy="52" rx="3" ry="2" fill={avatar.hair} opacity="0.2"/>
      
      {/* Smile */}
      <path d="M40 58 Q50 66 60 58" stroke="#5D4037" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      
      {/* Cheeks */}
      <circle cx="30" cy="50" r="5" fill="#FFB6C1" opacity="0.3"/>
      <circle cx="70" cy="50" r="5" fill="#FFB6C1" opacity="0.3"/>
    </svg>
  );

  // Set mounted to true after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const authToken = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const dataUser = JSON.parse(localStorage.getItem('data.user') || '{}');

      const loggedIn = !!authToken;
      setIsLoggedIn(loggedIn);

      if (!loggedIn) return;

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

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Use resolvedTheme to determine if dark mode is active
  const isDarkMode = resolvedTheme === 'dark';

  const handleLogout = () => {
    // Save current page before logging out
    const currentPath = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', currentPath);
    
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    setIsLoggedIn(false);
    setUserRole("user");
    setIsMobileMenuOpen(false);
    
    router.push('/SignIn');
  };

  const navigateToProfile = () => {
    router.push('/profile');
    setIsMobileMenuOpen(false);
  };

  const handleVerify = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a Transaction ID');
      setShowErrorAnimation(true);
      setTimeout(() => setShowErrorAnimation(false), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in first');
        setTimeout(() => router.push('/SignIn'), 1500);
        return;
      }

      const response = await fetch('https://datahustle.onrender.com/api/payments/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ trxId: transactionId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setSuccessData({
          amount: data.amount,
          amountCredited: data.amountCredited,
          senderName: data.senderName,
          newBalance: data.newBalance,
          referenceText: data.referenceText
        });
        setTransactionId('');
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setSuccess('');
          setSuccessData(null);
          setShowSuccessAnimation(false);
        }, 8000);
      } else {
        setError(data.message || 'Failed to claim payment');
        setShowErrorAnimation(true);
        setTimeout(() => setShowErrorAnimation(false), 4000);
      }
    } catch (err) {
      setError('Server error: ' + err.message);
      setShowErrorAnimation(true);
      setTimeout(() => setShowErrorAnimation(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSuccess('');
    setSuccessData(null);
    setShowSuccessAnimation(false);
    setError('');
    setShowErrorAnimation(false);
    setTransactionId('');
  };

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

  // Menu items configuration - Updated with indigo
  const menuSections = [
    {
      title: null,
      items: [
        { icon: Home, text: 'Dashboard', path: '/', color: 'indigo' },
        ...(userRole === 'admin' ? [{ icon: LayoutDashboard, text: 'Admin', path: '/admin', color: 'purple' }] : [])
      ]
    },
    {
      title: 'Buy Data',
      items: [
        { logo: MTNLogo, text: 'MTN Data', path: '/mtnup2u', isNetwork: true },
        { logo: TigoLogo, text: 'AirtelTigo', path: '/at-ishare', isNetwork: true },
        { logo: TelecelLogo, text: 'Telecel', path: '/TELECEL', isNetwork: true },
      ]
    },
    {
      title: 'More Services',
      items: [
        { icon: Smartphone, text: 'Foreign Numbers', path: '/verification-services', color: 'green', disabled: true },
        { icon: Receipt, text: 'Transaction History', path: '/myorders', color: 'slate' },
      ]
    }
  ];

  // Nav Item Component
  const NavItem = ({ icon: Icon, logo: Logo, text, path, color, index, disabled, isNetwork }) => {
    const colorClasses = {
      indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      red: 'bg-red-500/10 text-red-600 dark:text-red-400',
      green: 'bg-green-500/10 text-green-600 dark:text-green-400',
      purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    };

    return (
      <button
        onClick={() => {
          if (!disabled) {
            router.push(path);
            setIsMobileMenuOpen(false);
          }
        }}
        disabled={disabled}
        className={`
          nav-item w-full flex items-center gap-3 px-3 py-3 rounded-xl
          transition-all duration-200 group
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 active:scale-[0.98]'
          }
        `}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Network Logo or Icon */}
        {isNetwork && Logo ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <Logo size={40} />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]} transition-transform duration-200 ${!disabled && 'group-hover:scale-110'}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <span className="flex-1 text-left text-[15px] font-medium text-gray-800 dark:text-gray-200">
          {text}
        </span>
        {disabled ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Soon
          </span>
        ) : (
          <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 transition-transform duration-200 group-hover:translate-x-1" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Header - Indigo themed */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-50 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo - Updated to Data Hustle with Indigo */}
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">DH</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Data<span className="text-indigo-500">Hustle</span>
            </span>
          </button>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <>
                <button 
                  onClick={() => { resetModal(); setIsClaimModalOpen(true); }}
                  className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all"
                >
                  <CreditCard size={20} />
                </button>
                <button 
                  onClick={navigateToProfile}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
                >
                  <User size={20} />
                </button>
              </>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-gray-900 z-50
          transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="h-[calc(100%-64px)] overflow-y-auto overscroll-contain">
          {isLoggedIn ? (
            <div className="p-3">
              {/* User Card */}
              <button 
                onClick={navigateToProfile}
                className="nav-item w-full flex items-center gap-3 p-3 mb-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-[0.99] transition-all"
                style={{ animationDelay: '0ms' }}
              >
                {/* Rotating Avatar */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <UserAvatar avatar={avatars[avatarIndex]} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-[15px]">
                    {userName || 'My Account'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View profile</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>

              {/* Menu Sections */}
              {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-2">
                  {section.title && (
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <NavItem 
                        key={item.text}
                        icon={item.icon}
                        logo={item.logo}
                        text={item.text}
                        path={item.path}
                        color={item.color}
                        isNetwork={item.isNetwork}
                        disabled={item.disabled}
                        index={sectionIndex * 3 + itemIndex + 1}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Settings Section */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {/* Dark Mode Toggle - Indigo themed */}
                <button
                  onClick={toggleDarkMode}
                  className="nav-item w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 active:scale-[0.98] transition-all"
                  style={{ animationDelay: '400ms' }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mounted && isDarkMode ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-600'} transition-all`}>
                    {mounted && isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <span className="flex-1 text-left text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {mounted && isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                  {/* Toggle Switch - Indigo */}
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${mounted && isDarkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${mounted && isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="nav-item w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all"
                  style={{ animationDelay: '450ms' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <LogOut size={20} />
                  </div>
                  <span className="flex-1 text-left text-[15px] font-medium">Sign Out</span>
                </button>
              </div>

              {/* Footer - Updated branding */}
              <div className="mt-6 px-3 py-4 text-center">
                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                  Data Hustle © 2026
                </p>
              </div>
            </div>
          ) : (
            /* Logged Out State - Indigo themed */
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6">
                <span className="text-white font-black text-2xl">DH</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Data Hustle
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                Sign in to access all features
              </p>
              
              <button
                onClick={() => { router.push('/SignIn'); setIsMobileMenuOpen(false); }}
                className="w-full py-3.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 active:scale-[0.98] transition-all mb-3"
              >
                Sign In
              </button>
              
              <button
                onClick={() => { router.push('/SignUp'); setIsMobileMenuOpen(false); }}
                className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Claim Payment Modal - Indigo themed */}
      {isClaimModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsClaimModalOpen(false)}
        >
          <div 
            className="claim-modal bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Claim Payment</h2>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {/* Success State */}
              {success && successData && (
                <div className="animate-fadeIn">
                  {showSuccessAnimation && (
                    <div className="flex justify-center -mt-4 mb-2">
                      <SuccessAnimation />
                    </div>
                  )}

                  <div className="text-center mb-5">
                    <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      Payment Claimed!
                    </h3>
                  </div>

                  <div className="text-center py-6 mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                    <p className="text-emerald-100 text-sm mb-1">Amount Credited</p>
                    <p className="text-white text-4xl font-bold">
                      GHS {(successData.amountCredited || successData.amount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">From</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {successData.senderName || 'Unknown'}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                    <div className="flex justify-between items-center py-1 px-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg -mx-1">
                      <span className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">New Balance</span>
                      <span className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                        GHS {(successData.newBalance || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={resetModal}
                    className="w-full py-3.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 active:scale-[0.98] transition-all"
                  >
                    Claim Another
                  </button>
                </div>
              )}

              {/* Error State */}
              {error && !success && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Error</p>
                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Input State */}
              {!success && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => { setTransactionId(e.target.value); setError(''); }}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      placeholder="Enter your transaction ID"
                      disabled={loading}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      From your MoMo or bank SMS
                    </p>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading || !transactionId.trim()}
                    className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      loading || !transactionId.trim()
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <span>Verify & Claim</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Styles */}
      <style jsx global>{`
        /* Nav item stagger animation */
        .nav-item {
          opacity: 0;
          transform: translateX(20px);
          animation: navItemIn 0.4s ease-out forwards;
        }
        
        @keyframes navItemIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Claim modal slide up */
        .claim-modal {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        /* Success animation */
        @keyframes success-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-success-pop {
          animation: success-pop 0.5s ease-out forwards;
        }
        
        @keyframes check-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        
        .animate-check-draw {
          stroke-dasharray: 24;
          animation: check-draw 0.4s ease-out 0.3s forwards;
          stroke-dashoffset: 24;
        }

        /* Custom scrollbar */
        aside::-webkit-scrollbar {
          width: 4px;
        }
        
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        
        aside::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        
        .dark aside::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>
    </>
  );
};

export default MobileNavbar;