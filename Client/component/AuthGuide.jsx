'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const AuthGuard = ({ children, fallback = null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState('loading'); // loading | authenticated | unauthenticated

  const publicRoutes = ['/SignIn', '/SignUp'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isPublicRoute) {
      setAuthState('authenticated');
      return;
    }

    const userData = localStorage.getItem('userData');

    if (!userData) {
      if (fallback) {
        setAuthState('unauthenticated');
      } else {
        router.push('/SignUp');
      }
    } else {
      setAuthState('authenticated');
    }
  }, [router, isPublicRoute, pathname, fallback]);

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
            <rect width="40" height="40" rx="10" fill="#6366F1" />
            <rect x="8" y="26" width="5" height="6" rx="1.5" fill="white" opacity="0.5" />
            <rect x="15" y="20" width="5" height="12" rx="1.5" fill="white" opacity="0.7" />
            <rect x="22" y="14" width="5" height="18" rx="1.5" fill="white" opacity="0.85" />
            <rect x="29" y="8" width="5" height="24" rx="1.5" fill="white" />
            <circle cx="31.5" cy="6" r="2" fill="white" opacity="0.6" />
          </svg>
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated' && fallback) {
    return fallback;
  }

  return authState === 'authenticated' ? children : null;
};

export default AuthGuard;
