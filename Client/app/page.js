'use client'
import DashboardPage from '@/component/UserDashboard';
import AuthGuard from '@/component/AuthGuide';
import LandingPage from '@/component/LandingPage';

export default function Home() {
  return (
    <AuthGuard fallback={<LandingPage />}>
      <DashboardPage />
    </AuthGuard>
  );
}
