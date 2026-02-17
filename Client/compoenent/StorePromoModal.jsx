'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Store,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Zap,
  Users,
  Gift
} from 'lucide-react';

export default function StorePromoModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if user has seen the modal recently (within 24 hours)
    const lastSeen = localStorage.getItem('storePromoLastSeen');
    const hasStore = localStorage.getItem('userHasStore');

    if (hasStore === 'true') return; // Don't show if user already has a store

    if (lastSeen) {
      const hoursSince = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Don't show within 24 hours
    }

    // Show modal after 3 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('storePromoLastSeen', Date.now().toString());
  };

  const handleGetStarted = () => {
    handleClose();
    router.push('/store/create');
  };

  const slides = [
    {
      icon: Store,
      iconBg: 'from-indigo-500 to-purple-600',
      title: 'Your Own Data Store',
      description: 'Create your personalized store in minutes. Sell data bundles under your own brand name.',
      highlight: 'Free to create!'
    },
    {
      icon: TrendingUp,
      iconBg: 'from-emerald-500 to-teal-600',
      title: 'Make Real Profit',
      description: 'Set your own prices and keep the profit. The more you sell, the more you earn.',
      highlight: 'Up to 30% profit margin'
    },
    {
      icon: Wallet,
      iconBg: 'from-amber-500 to-orange-600',
      title: 'Instant Withdrawals',
      description: 'Withdraw your earnings directly to Mobile Money anytime. No minimum wait period.',
      highlight: 'Direct to MoMo'
    },
    {
      icon: Clock,
      iconBg: 'from-blue-500 to-cyan-600',
      title: 'Works 24/7 For You',
      description: 'Your store runs automatically. Customers buy, data delivers, you earn - even while you sleep!',
      highlight: 'Passive income'
    }
  ];

  const features = [
    { icon: Zap, text: 'Instant data delivery' },
    { icon: Users, text: 'Unlimited customers' },
    { icon: Gift, text: 'No monthly fees' },
  ];

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient */}
        <div className={`relative p-8 pb-16 bg-gradient-to-br ${currentSlideData.iconBg} text-white overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            New Feature
          </div>

          {/* Icon */}
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 animate-float">
            <SlideIcon className="w-10 h-10" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">{currentSlideData.title}</h2>
          <p className="text-white/80">{currentSlideData.description}</p>

          {/* Highlight badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {currentSlideData.highlight}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-12rem)] flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-6 bg-white'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
              >
                <feature.icon className="w-5 h-5 text-indigo-500" />
                <span className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <button
            onClick={handleGetStarted}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30"
          >
            Create My Store
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleClose}
            className="w-full mt-3 py-3 text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Maybe later
          </button>

          {/* Trust text */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            Join 500+ store owners already earning with Data Hustle
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-pop {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-modal-pop {
          animation: modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
