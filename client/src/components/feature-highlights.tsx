import { Shield, Zap, Smartphone } from "lucide-react";

export default function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <div className="text-center p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Shield className="text-blue-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Secure</h3>
        <p className="text-gray-600">All processing happens on our secure servers. Your images are automatically deleted after compression.</p>
      </div>
      <div className="text-center p-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Zap className="text-green-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
        <p className="text-gray-600">Optimized compression algorithms ensure fast processing without quality loss.</p>
      </div>
      <div className="text-center p-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Smartphone className="text-purple-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Friendly</h3>
        <p className="text-gray-600">Works perfectly on all devices - desktop, tablet, and mobile phones.</p>
      </div>
    </div>
  );
}
