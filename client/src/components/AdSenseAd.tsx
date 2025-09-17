import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSenseAd({ adSlot, adFormat = 'auto', className = '' }: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // AdSense script is already loaded in HTML head
    // Just initialize the ad unit when component mounts

    // Initialize AdSense after script loads
    const initAd = () => {
      if (window.adsbygoogle && !pushedRef.current && adRef.current) {
        try {
          window.adsbygoogle.push({});
          pushedRef.current = true;
        } catch (error) {
          console.error('AdSense initialization error:', error);
        }
      }
    };

    // Wait for script to load
    const checkAdSense = setInterval(() => {
      if (window.adsbygoogle) {
        clearInterval(checkAdSense);
        initAd();
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkAdSense);
    };
  }, []);

  return (
    <div className={`adsense-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '250px' }}
        data-ad-client="ca-pub-9368777119109420"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}