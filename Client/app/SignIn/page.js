'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Star,
  Flame,
  Eye,
  EyeOff
} from 'lucide-react';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`p-3 rounded-xl shadow-xl flex items-center backdrop-blur-xl border max-w-sm ${
        type === 'success' 
          ? 'bg-emerald-500/95 text-white border-emerald-400/50' 
          : type === 'error' 
            ? 'bg-red-500/95 text-white border-red-400/50' 
            : 'bg-yellow-500/95 text-white border-yellow-400/50'
      }`}>
        <div className="mr-2">
          {type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : type === 'error' ? (
            <X className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
        </div>
        <div className="flex-grow">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="ml-3 hover:scale-110 transition-transform">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to show toast
  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false
    }));
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://datahustle.onrender.com/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token securely
        localStorage.setItem('authToken', data.token);
        
        // Store user info if provided
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify({
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role
          }));
        }

        showToast('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          try {
            // Force a hard navigation instead of client-side navigation
            window.location.href = '/';
          } catch (err) {
            console.error("Navigation error:", err);
            showToast('Login successful. Please navigate to the dashboard.', 'success');
          }
        }, 2000);
      } else {
        setError(data.message || 'Login failed');
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements - More visible */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/10 to-blue-400/10 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="w-3 h-3 text-white animate-bounce" />
            </div>
            
            <div className="relative z-10 text-center">
              {/* DataHustle Logo */}
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-xl">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-white mx-auto mb-1" strokeWidth={3} />
                    <div className="text-white font-bold text-xs">HUSTLE</div>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-1">DATAHUSTLE</h1>
              <p className="text-white/90 text-sm font-medium">Welcome Back</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 rounded-xl flex items-start bg-red-500/20 border border-red-500/40 backdrop-blur-sm">
                <div className="w-5 h-5 rounded-lg bg-red-500/30 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-300" />
                </div>
                <span className="text-red-200 font-medium text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 block w-full rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-3 block w-full rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-white/60 hover:text-white/90 transition-colors" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/60 hover:text-white/90 transition-colors" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-white/30 rounded bg-white/20 backdrop-blur-sm"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-white font-medium">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="/reset" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-4 h-4" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 w-4 h-4" />
                    Sign In
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-white font-medium text-sm">
                Don't have an account? 
                <a href="/SignUp" className="text-emerald-400 hover:text-emerald-300 ml-1 font-bold hover:underline transition-colors">
                  Sign Up
                </a>
              </p>
            </div>

            {/* Additional Features */}
            <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl backdrop-blur-sm">
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300 mb-2">Secure Access</h4>
                  <div className="space-y-1 text-white text-xs font-medium">
                    <p>• Your data is encrypted and secure</p>
                    <p>• Fast and reliable service</p>
                    <p>• 24/7 customer support available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}