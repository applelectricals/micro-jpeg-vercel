import { AdSenseAd } from './AdSenseAd';

interface SidebarAdProps {
  showAd: boolean;
}

export function SidebarAd({ showAd }: SidebarAdProps) {
  if (!showAd) {
    return null;
  }

  return (
    <div className="sidebar-ad mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
        Advertisement
      </div>
      <div className="min-h-[300px] w-full bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
            AdSense Placeholder
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            300x250 Rectangle Ad
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Publisher: ca-pub-9368777119109420
          </div>
        </div>
      </div>
    </div>
  );
}