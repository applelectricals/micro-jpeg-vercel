import { SiWordpress } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Activity, Clock, Calendar, Image, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import logoUrl from '@assets/mascot-logo-optimized.png';
import { FORMATS } from '@/data/conversionMatrix';

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dualStats, setDualStats] = useState<any>(null);
  const [location] = useLocation();
  const optimisticCounterRef = useRef<{monthly: number, daily: number, hourly: number} | null>(null);


  // Fetch dual usage statistics for header display
  useEffect(() => {
    const fetchDualStats = async () => {
      try {
        const response = await fetch('/api/universal-usage-stats', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store', // Force fresh data every time
        });
        
        if (response.ok) {
          const data = await response.json();
          setDualStats(data);
          // Reset optimistic counter when we get real data
          optimisticCounterRef.current = null;
        }
      } catch (error) {
        console.log('Header: Error fetching dual usage stats:', error);
      }
    };

    fetchDualStats();
    
    // Refresh every 30 seconds for updates
    const interval = setInterval(fetchDualStats, 30000);
    
    // Listen for manual refresh events from file operations with debounce
    let refreshTimeout: NodeJS.Timeout;
    const handleRefresh = () => {
      console.log('🔄 Header: Refreshing counter after operation');
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchDualStats();
      }, 250);
    };
    
    window.addEventListener('refreshUniversalCounter', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshUniversalCounter', handleRefresh);
    };
  }, []);

  // Determine what type of operations to show based on current page
  const getPageType = () => {
    const path = (typeof window !== 'undefined' ? window.location.pathname : location || '').toLowerCase();
    
    // Main landing page shows both counters
    if (path === '/' || path === '') {
      return 'both';
    }
    
    // Check for conversion pages: /convert/format-to-format
    const convertMatch = path.match(/^\/convert\/([^-]+)-to-/);
    if (convertMatch) {
      const sourceFormat = convertMatch[1];
      const formatInfo = FORMATS[sourceFormat];
      if (formatInfo && formatInfo.category === 'raw') {
        return 'raw';
      } else if (formatInfo) {
        return 'regular';
      }
    }
    
    // Check for RAW compression pages
    if (path.includes('/compress-raw-files')) {
      return 'raw';
    }
    
    // Default to both for other pages (main landing, pricing, etc.)
    return 'both';
  };

  // Sleek header counter component with dual usage tracking
  const HeaderCounter = () => {
    const stats = dualStats?.stats ?? dualStats;
    if (!stats) return null;

    const pageType = getPageType();
    
    // For RAW conversion pages, show only RAW counter
    if (pageType === 'raw') {
      const displayStats = stats.raw;
      if (!displayStats) return null;

      return (
        <div className="flex items-center gap-3 text-xs">
          {/* Page type indicator */}
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-medium text-gray-600 capitalize">RAW</span>
          </div>
          
          {/* Monthly */}
          <div className="flex items-center gap-1" data-testid="header-monthly-counter">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span className="font-medium text-brand-dark">{displayStats.monthly.used}/{displayStats.monthly.limit}</span>
            <span className="text-gray-500">month</span>
          </div>
          
          {/* Daily */}
          <div className="flex items-center gap-1" data-testid="header-daily-counter">
            <Activity className="w-3 h-3 text-green-600" />
            <span className="font-medium text-brand-dark">{displayStats.daily.used}/{displayStats.daily.limit}</span>
            <span className="text-gray-500">day</span>
          </div>
          
          {/* Hourly */}
          <div className="flex items-center gap-1" data-testid="header-hourly-counter">
            <Clock className="w-3 h-3 text-orange-600" />
            <span className="font-medium text-brand-dark">{displayStats.hourly.used}/{displayStats.hourly.limit}</span>
            <span className="text-gray-500">hour</span>
          </div>
        </div>
      );
    }

    // For regular format conversion pages, show only Regular counter
    if (pageType === 'regular') {
      const displayStats = stats.regular;
      if (!displayStats) return null;

      return (
        <div className="flex items-center gap-3 text-xs">
          {/* Page type indicator */}
          <div className="flex items-center gap-1">
            <Image className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-gray-600 capitalize">Regular</span>
          </div>
          
          {/* Monthly */}
          <div className="flex items-center gap-1" data-testid="header-monthly-counter">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span className="font-medium text-brand-dark">{displayStats.monthly.used}/{displayStats.monthly.limit}</span>
            <span className="text-gray-500">month</span>
          </div>
          
          {/* Daily */}
          <div className="flex items-center gap-1" data-testid="header-daily-counter">
            <Activity className="w-3 h-3 text-green-600" />
            <span className="font-medium text-brand-dark">{displayStats.daily.used}/{displayStats.daily.limit}</span>
            <span className="text-gray-500">day</span>
          </div>
          
          {/* Hourly */}
          <div className="flex items-center gap-1" data-testid="header-hourly-counter">
            <Clock className="w-3 h-3 text-orange-600" />
            <span className="font-medium text-brand-dark">{displayStats.hourly.used}/{displayStats.hourly.limit}</span>
            <span className="text-gray-500">hour</span>
          </div>
        </div>
      );
    }

    // For main landing page, show both Regular and RAW in two rows
    if (pageType === 'both') {
      return (
        <div className="flex flex-col gap-1 text-xs">
          {/* Regular Operations Row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Regular</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-regular-monthly-counter">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-brand-dark">{stats.regular.monthly.used}/{stats.regular.monthly.limit}</span>
              <span className="text-gray-500">month</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-regular-daily-counter">
              <Activity className="w-3 h-3 text-green-600" />
              <span className="font-medium text-brand-dark">{stats.regular.daily.used}/{stats.regular.daily.limit}</span>
              <span className="text-gray-500">day</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-regular-hourly-counter">
              <Clock className="w-3 h-3 text-orange-600" />
              <span className="font-medium text-brand-dark">{stats.regular.hourly.used}/{stats.regular.hourly.limit}</span>
              <span className="text-gray-500">hour</span>
            </div>
          </div>

          {/* RAW Operations Row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">RAW</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-raw-monthly-counter">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-brand-dark">{stats.raw.monthly.used}/{stats.raw.monthly.limit}</span>
              <span className="text-gray-500">month</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-raw-daily-counter">
              <Activity className="w-3 h-3 text-green-600" />
              <span className="font-medium text-brand-dark">{stats.raw.daily.used}/{stats.raw.daily.limit}</span>
              <span className="text-gray-500">day</span>
            </div>
            
            <div className="flex items-center gap-1" data-testid="header-raw-hourly-counter">
              <Clock className="w-3 h-3 text-orange-600" />
              <span className="font-medium text-brand-dark">{stats.raw.hourly.used}/{stats.raw.hourly.limit}</span>
              <span className="text-gray-500">hour</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Header - Simplified approach */}
      <header className="lg:hidden sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200/50 h-16">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img 
              src={logoUrl} 
              alt="MicroJPEG Logo" 
              className="w-8 h-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold font-poppins text-brand-dark">MicroJPEG</span>
              <span className="text-xs font-opensans text-brand-dark opacity-70 tracking-wider">PICTURE PERFECT</span>
            </div>
          </div>
          
          {/* Mobile Usage Counter - Compact */}
          <div className="flex items-center gap-2 text-xs">
            {dualStats?.stats && (
              <>
                {(() => {
                  const pageType = getPageType();
                  
                  // For CR2-to-PNG page, show only RAW
                  if (pageType === 'raw') {
                    const displayStats = dualStats.stats.raw;
                    return (
                      <div className="flex items-center gap-1" data-testid="mobile-monthly-counter">
                        <Camera className="w-3 h-3 text-purple-600" />
                        <span className="font-medium text-brand-dark text-xs">
                          {displayStats.monthly.used}/{displayStats.monthly.limit}
                        </span>
                      </div>
                    );
                  }
                  
                  // For main landing page, show both (compact)
                  if (pageType === 'both') {
                    return (
                      <div className="flex items-center gap-1" data-testid="mobile-both-counter">
                        <Image className="w-3 h-3 text-blue-600" />
                        <span className="font-medium text-brand-dark text-xs">
                          {dualStats.stats.regular.monthly.used}/{dualStats.stats.regular.monthly.limit}
                        </span>
                        <Camera className="w-3 h-3 text-purple-600" />
                        <span className="font-medium text-brand-dark text-xs">
                          {dualStats.stats.raw.monthly.used}/{dualStats.stats.raw.monthly.limit}
                        </span>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </>
            )}
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border border-gray-300 rounded bg-transparent"
            data-testid="mobile-menu-button"
          >
            <Menu className="w-5 h-5 text-brand-dark" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-brand-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src={logoUrl} alt="MicroJPEG Logo" className="w-8 h-8 sm:w-[45px] sm:h-[45px]" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold font-poppins text-brand-dark whitespace-nowrap">MicroJPEG</span>
                <span className="text-xs font-opensans text-brand-dark/70 tracking-widest whitespace-nowrap">PICTURE PERFECT</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a href="/web/overview" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium transition-colors">
                Web
              </a>
              
              <a href="/api-docs#overview" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium transition-colors">
                API
              </a>
              
              <a href="/wordpress-plugin" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium transition-colors flex items-center gap-1">
                <SiWordpress className="w-4 h-4" />
                Plugin
              </a>
              <button 
                onClick={() => window.location.href = "/simple-pricing"}
                className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium bg-transparent border-none cursor-pointer transition-colors"
              >
                Pricing
              </button>
              
            </nav>

            {/* Desktop Usage Counter */}
            <HeaderCounter />

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="hidden lg:block text-sm font-medium text-brand-dark">
                    Hello, User!
                  </span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
                    Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    fetch('/api/logout', { method: 'GET', credentials: 'include' })
                      .finally(() => window.location.href = '/');
                  }}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:gap-3">
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                    Sign In
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = '/signup'}>
                    Sign Up
                  </Button>
                  <Button size="sm" className="bg-brand-gold hover:bg-brand-gold-dark text-white" onClick={() => window.location.href = '/'}>
                    Back to App
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <div 
            className="absolute top-16 right-4 w-60 bg-white rounded-lg shadow-2xl border"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'absolute',
              top: '4rem',
              right: '1rem',
              width: '15rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e5e7eb',
              zIndex: 1000
            }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-2">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-4 pb-4 space-y-3">
              {/* Navigation Links */}
              <div>
                <a 
                  href="/web/overview" 
                  className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Web
                </a>
                <a 
                  href="/api-docs#overview" 
                  className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  API
                </a>
                <a 
                  href="/wordpress-plugin" 
                  className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <SiWordpress className="w-4 h-4" />
                    <span>Plugin</span>
                  </div>
                </a>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.location.href = "/simple-pricing";
                  }}
                  className="block w-full text-left py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2 bg-transparent border-none cursor-pointer"
                >
                  Pricing
                </button>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-sm text-gray-600">
                    Hello, User!
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/dashboard';
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      fetch('/api/logout', { method: 'GET', credentials: 'include' })
                        .finally(() => window.location.href = '/');
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/login';
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/signup';
                    }}
                  >
                    Sign Up
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full justify-center bg-brand-gold hover:bg-brand-gold-dark text-white"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/';
                    }}
                  >
                    Back to App
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}