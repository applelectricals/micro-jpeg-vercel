// client/src/components/DualCounter.tsx

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Activity, Image, Camera } from 'lucide-react';

interface DualCounterProps {
  compact?: boolean;
  showRaw?: boolean;
  pageType?: 'regular' | 'raw' | 'both';
}

export const DualCounter: React.FC<DualCounterProps> = ({ 
  compact = false, 
  showRaw = true,
  pageType = 'both'
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/universal-usage-stats', {
        credentials: 'include'
      });
      const data = await response.json();
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    
    const handleRefresh = () => fetchStats();
    window.addEventListener('refreshUniversalCounter', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshUniversalCounter', handleRefresh);
    };
  }, []);

  if (loading || !stats) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Compact view for mobile
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Image className="w-3 h-3 text-blue-600" />
        <span className="font-medium">
          {stats.regular.monthly.used}/{stats.regular.monthly.limit}
        </span>
        {showRaw && (
          <>
            <Camera className="w-3 h-3 text-purple-600" />
            <span className="font-medium">
              {stats.raw.monthly.used}/{stats.raw.monthly.limit}
            </span>
          </>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="flex flex-col gap-2">
      {/* Regular Operations */}
      {(pageType === 'regular' || pageType === 'both') && (
        <div className="flex items-center gap-3 text-sm">
          <Image className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-700">Regular:</span>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>{stats.regular.monthly.used}/{stats.regular.monthly.limit}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-gray-500" />
            <span>{stats.regular.daily.used}/{stats.regular.daily.limit}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{stats.regular.hourly.used}/{stats.regular.hourly.limit}</span>
          </div>
        </div>
      )}

      {/* RAW Operations */}
      {showRaw && (pageType === 'raw' || pageType === 'both') && (
        <div className="flex items-center gap-3 text-sm">
          <Camera className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-700">RAW:</span>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>{stats.raw.monthly.used}/{stats.raw.monthly.limit}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-gray-500" />
            <span>{stats.raw.daily.used}/{stats.raw.daily.limit}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{stats.raw.hourly.used}/{stats.raw.hourly.limit}</span>
          </div>
        </div>
      )}

      {/* Combined Progress Bar */}
      {pageType === 'both' && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
            style={{ 
              width: `${Math.min(
                ((stats.regular.monthly.used + stats.raw.monthly.used) / 
                 (stats.regular.monthly.limit + stats.raw.monthly.limit)) * 100, 
                100
              )}%` 
            }}
          />
        </div>
      )}
    </div>
  );
};