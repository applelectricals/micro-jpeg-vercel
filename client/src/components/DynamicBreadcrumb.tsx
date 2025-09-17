import { useLocation } from "wouter";
import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route segment to display name mapping
const routeMapping: Record<string, string> = {
  // Root
  "": "Home",
  
  // Main sections
  "tools": "Tools",
  "compress": "Compress",
  "convert": "Convert",
  "legal": "Legal",
  "wordpress-plugin": "WordPress Plugin",
  "api": "API",
  
  // Tools sub-sections
  "batch": "Batch",
  "optimizer": "Optimizer",
  "free": "Free",
  "pro": "Premium",
  "enterprise": "Enterprise",
  "bulk": "Bulk",
  "raw": "RAW Files",
  
  // Legal pages
  "terms": "Terms of Service",
  "privacy": "Privacy Policy", 
  "cookies": "Cookie Policy",
  "cancellation": "Cancellation Policy",
  "payment-protection": "Payment Protection",
  
  // WordPress sub-sections
  "install": "Installation",
  "docs": "Documentation",
  "development": "Development",
  "download": "Download",
  
  // Specific conversion pages
  "cr2-to-jpg": "CR2 to JPG",
  "nef-to-jpg": "NEF to JPG",
  "arw-to-jpg": "ARW to JPG",
  "raf-to-jpg": "RAF to JPG",
  "dng-to-jpg": "DNG to JPG",
  
  // Other pages
  "about": "About",
  "contact": "Contact",
  "support": "Support",
  "features": "Features",
  "blog": "Blog",
  "profile": "Profile",
  "dashboard": "Dashboard",
  "subscribe": "Subscribe",
  "simple-pricing": "Pricing",
  "login": "Login",
  "signup": "Sign Up",
};

// Generate breadcrumb items from current path
function generateBreadcrumbs(pathname: string) {
  // Remove leading slash and split into segments
  const segments = pathname.slice(1).split('/').filter(Boolean);
  
  const breadcrumbs = [
    {
      label: "Home",
      href: "/",
      isCurrentPage: pathname === "/"
    }
  ];

  // Build cumulative path for each segment
  let currentPath = "";
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Get display name from mapping, fallback to capitalized segment
    const displayName = routeMapping[segment] || 
      segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    
    breadcrumbs.push({
      label: displayName,
      href: currentPath,
      isCurrentPage: isLast
    });
  });

  return breadcrumbs;
}

interface DynamicBreadcrumbProps {
  className?: string;
  showOnHomepage?: boolean;
}

export function DynamicBreadcrumb({ 
  className, 
  showOnHomepage = false 
}: DynamicBreadcrumbProps) {
  const [location] = useLocation();
  
  // Don't show breadcrumbs on homepage unless explicitly requested
  if (location === "/" && !showOnHomepage) {
    return null;
  }
  
  const breadcrumbs = generateBreadcrumbs(location);
  
  // Don't show if only one breadcrumb (Home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={className} data-testid="breadcrumb-navigation">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            <BreadcrumbItem>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage data-testid={`breadcrumb-current-${crumb.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link 
                    href={crumb.href}
                    data-testid={`breadcrumb-link-${crumb.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}