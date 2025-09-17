import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Loading component for better UX during chunk loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load components - Critical pages first (loaded immediately)
const Landing = lazy(() => import("@/pages/micro-jpeg-landing"));

// Authentication pages (medium priority)
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const EmailVerification = lazy(() => import("@/pages/email-verification"));

// Core compression pages (high priority)
const FreeSignedCompress = lazy(() => import("@/pages/free-signed-compress"));
const PremiumCompress = lazy(() => import("@/pages/premium-compress"));
const TestPremiumCompress = lazy(() => import("@/pages/test-premium-compress"));
const EnterpriseCompress = lazy(() => import("@/pages/enterprise-compress"));

// User dashboard pages (medium priority)
const Profile = lazy(() => import("@/pages/profile"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

// Payment and subscription pages (medium priority)
const Subscribe = lazy(() => import("@/pages/subscribe"));
const SubscriptionSuccess = lazy(() => import("@/pages/subscription-success"));
const RazorpayCheckout = lazy(() => import("@/pages/razorpay-checkout"));
const SimplePricing = lazy(() => import("@/pages/simple-pricing"));
const PaymentProtection = lazy(() => import("@/pages/payment-protection"));

// API related pages (lower priority)
const ApiDashboard = lazy(() => import("@/pages/api-dashboard"));
const ApiDocs = lazy(() => import("@/pages/api-docs"));
const ApiDemo = lazy(() => import("@/pages/api-demo"));

// Web tools pages (lower priority)
const WebOverview = lazy(() => import("@/pages/web-overview"));
const WebCompress = lazy(() => import("@/pages/web-compress"));
const WebConvert = lazy(() => import("@/pages/web-convert"));

// NEW: Tools pages (professional hierarchy)
const Tools = lazy(() => import("@/pages/tools"));
const ToolsCompress = lazy(() => import("@/pages/tools-compress"));
const ToolsConvert = lazy(() => import("@/pages/tools-convert"));
const ToolsBatch = lazy(() => import("@/pages/tools-batch"));
const ToolsOptimizer = lazy(() => import("@/pages/tools-optimizer"));

// WordPress integration pages (lower priority)
const WordPressDetails = lazy(() => import("@/pages/wordpress-details"));
const WordPressInstallation = lazy(() => import("@/pages/wordpress-installation"));
const WordPressDevelopment = lazy(() => import("@/pages/wordpress-development"));
const WordPressImagePlugin = lazy(() => import("@/pages/wordpress-image-plugin"));

// SEO and marketing pages (lower priority)
const CompressRawFiles = lazy(() => import("@/pages/compress-raw-files"));
const BulkImageCompression = lazy(() => import("@/pages/bulk-image-compression"));

// Dynamic conversion page for all format combinations
const ConversionPage = lazy(() => import("@/pages/ConversionPage"));

// RAW conversion landing pages now use dynamic ConversionPage

// Content pages (lower priority)
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Support = lazy(() => import("@/pages/support"));
const Features = lazy(() => import("@/pages/features"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));

// Legal pages (lowest priority)
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const CancellationPolicy = lazy(() => import("@/pages/cancellation-policy"));

// NEW: Legal pages - Professional Hierarchy
const LegalTerms = lazy(() => import("@/pages/legal-terms"));
const LegalPrivacy = lazy(() => import("@/pages/legal-privacy"));
const LegalCookies = lazy(() => import("@/pages/legal-cookies"));
const LegalCancellation = lazy(() => import("@/pages/legal-cancellation"));
const LegalPaymentProtection = lazy(() => import("@/pages/legal-payment-protection"));

// Redirect components for legacy URLs
const LegalRedirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
};

const WordPressRedirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
};

const CompressRedirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
};

const WebToolsRedirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
};

// Error pages
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-blue-600 hover:underline">Go back to home</a>
    </div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes with lazy loading */}
        <Route path="/api-docs" component={ApiDocs} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/support" component={Support} />
        <Route path="/features" component={Features} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        {/* NEW: Legal - Professional Hierarchy */}
        <Route path="/legal/terms" component={LegalTerms} />
        <Route path="/legal/privacy" component={LegalPrivacy} />
        <Route path="/legal/cookies" component={LegalCookies} />
        <Route path="/legal/cancellation" component={LegalCancellation} />
        <Route path="/legal/payment-protection" component={LegalPaymentProtection} />
        
        {/* LEGACY: Legal pages - Redirect to new hierarchy */}
        <Route path="/terms-of-service" component={() => <LegalRedirect to="/legal/terms" />} />
        <Route path="/privacy-policy" component={() => <LegalRedirect to="/legal/privacy" />} />
        <Route path="/cookie-policy" component={() => <LegalRedirect to="/legal/cookies" />} />
        <Route path="/cancellation-policy" component={() => <LegalRedirect to="/legal/cancellation" />} />
        <Route path="/api-demo" component={ApiDemo} />
        <Route path="/payment-protection" component={() => <LegalRedirect to="/legal/payment-protection" />} />
        <Route path="/api-dashboard" component={ApiDashboard} />
        {/* NEW: Tools - Professional Hierarchy */}
        <Route path="/tools" component={Tools} />
        <Route path="/tools/compress" component={ToolsCompress} />
        <Route path="/tools/convert" component={ToolsConvert} />
        <Route path="/tools/batch" component={ToolsBatch} />
        <Route path="/tools/optimizer" component={ToolsOptimizer} />
        
        {/* LEGACY: Web tools - Redirect to new hierarchy */}
        <Route path="/web/overview" component={() => <WebToolsRedirect to="/tools" />} />
        <Route path="/web/compress" component={() => <WebToolsRedirect to="/tools/compress" />} />
        <Route path="/web/convert" component={() => <WebToolsRedirect to="/tools/convert" />} />
        {/* NEW: WordPress Plugin - Consolidated Structure */}
        <Route path="/wordpress-plugin" component={WordPressDetails} />
        <Route path="/wordpress-plugin/install" component={WordPressInstallation} />
        <Route path="/wordpress-plugin/docs" component={WordPressImagePlugin} />
        <Route path="/wordpress-plugin/api" component={WordPressDevelopment} />
        <Route path="/wordpress-plugin/download" component={WordPressDetails} />
        
        {/* LEGACY: WordPress Plugin - Redirect to new hierarchy */}
        <Route path="/wordpress/details" component={() => <WordPressRedirect to="/wordpress-plugin" />} />
        <Route path="/wordpress/installation" component={() => <WordPressRedirect to="/wordpress-plugin/install" />} />
        <Route path="/wordpress-installation" component={() => <WordPressRedirect to="/wordpress-plugin/install" />} />
        <Route path="/wordpress/development" component={() => <WordPressRedirect to="/wordpress-plugin/api" />} />
        <Route path="/wordpress-development" component={() => <WordPressRedirect to="/wordpress-plugin/api" />} />
        <Route path="/wordpress-image-plugin" component={() => <WordPressRedirect to="/wordpress-plugin/docs" />} />
        
        {/* LEGACY: SEO Category Pages - Redirect to new hierarchy */}
        <Route path="/compress-raw-files" component={() => <CompressRedirect to="/compress/raw" />} />
        <Route path="/bulk-image-compression" component={() => <CompressRedirect to="/compress/bulk" />} />
        
        {/* Always available routes */}
        <Route path="/" component={Landing} />
        
        {/* New unified compression structure - MUST come before dynamic routes */}
        <Route path="/compress" component={Landing} />
        <Route path="/compress/free" component={FreeSignedCompress} />
        <Route path="/compress/pro" component={PremiumCompress} />
        <Route path="/compress/enterprise" component={EnterpriseCompress} />
        <Route path="/compress/bulk" component={BulkImageCompression} />
        <Route path="/compress/raw" component={CompressRawFiles} />
        
        {/* LEGACY: Compression pages - Redirect to new hierarchy */}
        <Route path="/compress-free" component={() => <CompressRedirect to="/compress/free" />} />
        <Route path="/compress-premium" component={() => <CompressRedirect to="/compress/pro" />} />
        <Route path="/test-premium" component={TestPremiumCompress} />
        <Route path="/compress-enterprise" component={() => <CompressRedirect to="/compress/enterprise" />} />
        
        {/* Legacy routes now use dynamic ConversionPage */}
        
        {/* Dynamic Conversion Routes - All 80 format combinations - MUST come AFTER specific routes */}
        <Route path="/convert/:conversion" component={ConversionPage} />
        <Route path="/compress/:format" component={ConversionPage} />
        
        <Route path="/verify-email" component={EmailVerification} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/subscription-success" component={SubscriptionSuccess} />
        <Route path="/payment/razorpay-checkout" component={RazorpayCheckout} />
        <Route path="/simple-pricing" component={SimplePricing} />
        
        {isLoading || !isAuthenticated ? (
          <>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
          </>
        ) : (
          <>
            <Route path="/profile" component={Profile} />
            <Route path="/dashboard" component={Dashboard} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
