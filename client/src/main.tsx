import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getCurrentPageIdentifier } from "./lib/pageIdentifier";

// Global fetch wrapper to ensure pageIdentifier is added to all API requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  // Only intercept API calls (requests starting with /api or /paypal)
  const isApiCall = typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/paypal'));
  
  if (isApiCall) {
    const pageIdentifier = getCurrentPageIdentifier();
    
    // Add headers if not already present
    const headers = new Headers(init.headers);
    
    // Only add pageIdentifier header if not already set
    if (!headers.has('X-Page-Identifier')) {
      headers.set('X-Page-Identifier', pageIdentifier);
    }
    
    // For FormData bodies, also add pageIdentifier as a field (for multipart requests)
    let body = init.body;
    if (body instanceof FormData && !body.has('pageIdentifier')) {
      body.append('pageIdentifier', pageIdentifier);
    }
    
    init = {
      ...init,
      headers,
      body,
    };
  }
  
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
