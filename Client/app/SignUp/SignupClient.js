'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Gift, ArrowRight, Eye, EyeOff, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SignUpClient() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const darkMode = resolvedTheme === 'dark';
  const toggleDarkMode = () => setTheme(darkMode ? 'light' : 'dark');

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
      localStorage.setItem('referralCode', ref);
    }
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (isRegistrationClosed) {
      setError("Registration is currently closed.");
      return;
    }
    
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://datahustle.onrender.com/api/v1/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          referredBy: formData.referralCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('referralCode');
        window.location.href = '/SignIn';
      } else {
        setError(data.message || 'Signup failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const InputField = ({ icon: Icon, name, type = 'text', placeholder, required = true, showToggle, toggleState, onToggle }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        name={name}
        type={showToggle ? (toggleState ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        disabled={isSubmitting || isRegistrationClosed}
        className={`w-full pl-10 ${showToggle ? 'pr-10' : 'pr-4'} py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          tabIndex={-1}
        >
          {toggleState ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 transition-colors bg-gray-100 dark:bg-gray-900">
      {/* Theme Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2.5 rounded-lg transition-colors z-40 ${
          mounted && darkMode
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
        }`}
        aria-label="Toggle theme"
      >
        {mounted && darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo & Tagline */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-500">DATA HUSTLE</h1>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
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
                Skip signup and purchase directly
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">
              Create account
            </h2>
            <p className="text-sm mb-5 text-gray-600 dark:text-gray-400">
              Join thousands of resellers
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Registration Closed Warning */}
            {isRegistrationClosed && (
              <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> Registration temporarily closed
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3">
              <InputField icon={User} name="name" placeholder="Full Name" />
              <InputField icon={Mail} name="email" type="email" placeholder="Email" />
              <InputField icon={Phone} name="phoneNumber" type="tel" placeholder="Phone (0XX XXX XXXX)" />
              <InputField 
                icon={Lock} 
                name="password" 
                placeholder="Password (min 6 chars)" 
                showToggle 
                toggleState={showPassword} 
                onToggle={() => setShowPassword(!showPassword)} 
              />
              <InputField 
                icon={Lock} 
                name="confirmPassword" 
                placeholder="Confirm Password" 
                showToggle 
                toggleState={showConfirmPassword} 
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
              />
              <InputField 
                icon={Gift} 
                name="referralCode" 
                placeholder="Referral Code (optional)" 
                required={false} 
              />

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting || isRegistrationClosed} 
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/SignIn"
                className="text-indigo-500 hover:text-indigo-600 font-semibold"
              >
                Sign In
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