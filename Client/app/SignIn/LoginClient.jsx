'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const darkMode = resolvedTheme === 'dark';
  const toggleDarkMode = () => setTheme(darkMode ? 'light' : 'dark');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://datahustle.onrender.com/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify({
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role
          }));
        }
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 transition-colors bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        {/* Logo & Tagline */}
        <div className="flex flex-col items-center mb-6">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
            <rect width="40" height="40" rx="10" fill="#6366F1" />
            <rect x="8" y="26" width="5" height="6" rx="1.5" fill="white" opacity="0.5" />
            <rect x="15" y="20" width="5" height="12" rx="1.5" fill="white" opacity="0.7" />
            <rect x="22" y="14" width="5" height="18" rx="1.5" fill="white" opacity="0.85" />
            <rect x="29" y="8" width="5" height="24" rx="1.5" fill="white" />
            <circle cx="31.5" cy="6" r="2" fill="white" opacity="0.6" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Data<span className="text-indigo-500">Hustle</span>
          </h1>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            Ghana's Data Marketplace
          </p>
        </div>

        {/* Quick Buy Card */}
        <div
          onClick={() => window.location.href = '/buy'}
          className="mb-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-indigo-900 dark:text-indigo-100">
                Want to buy now?
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Skip login and purchase directly
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm mb-5 text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Remember Me & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-400">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 mr-2" 
                  />
                  Remember me
                </label>
                <Link 
                  href="/reset" 
                  className="text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  Forgot?
                </Link>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/SignUp"
                className="text-indigo-500 hover:text-indigo-600 font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-4 text-gray-400 dark:text-gray-600">
          © 2025 Data Hustle Ghana
        </p>
      </div>
    </div>
  );
}