import logoUrl from "@assets/mascot-logo-optimized.png";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-black py-16 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="MicroJPEG Logo" className="w-10 h-10" />
              <span className="text-xl font-bold font-poppins">MicroJPEG</span>
            </div>
            <p className="text-gray-600 font-opensans">
              The smartest way to compress and optimize your images for the web.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold font-poppins mb-4">Product</h4>
            <ul className="space-y-2 text-gray-600 font-opensans">
              <li><a href="/features" className="hover:text-black">Features</a></li>
              <li><a href="/simple-pricing" className="hover:text-black">Pricing</a></li>
              <li><a href="/api-docs" className="hover:text-black">API</a></li>
              <li><a href="/api-docs" className="hover:text-black">Documentation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold font-poppins mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600 font-opensans">
              <li><a href="/about" className="hover:text-black">About</a></li>
              <li><a href="/blog" className="hover:text-black">Blog</a></li>
              <li><a href="/contact" className="hover:text-black">Contact</a></li>
              <li><a href="/support" className="hover:text-black">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold font-poppins mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600 font-opensans">
              <li><a href="/privacy-policy" className="hover:text-black">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:text-black">Terms of Service</a></li>
              <li><a href="/cookie-policy" className="hover:text-black">Cookie Policy</a></li>
              <li><a href="/cancellation-policy" className="hover:text-black font-bold text-red-600">Cancellation Policy</a></li>
              <li><a href="/privacy-policy" className="hover:text-black">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-8 pb-4 text-center text-gray-500 font-opensans">
          <p>© 2025 MicroJPEG. All rights reserved. Making the web faster, one image at a time.</p>
        </div>
      </div>
    </footer>
  );
}
