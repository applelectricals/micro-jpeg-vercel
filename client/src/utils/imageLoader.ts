// Dynamic imports for images to enable code splitting
export const loadMascotImages = {
  logo: () => import('@assets/mascot-logo-optimized.png').then(m => m.default),
  mascot: () => import('@/assets/mascot.webp').then(m => m.default),
  owl01: () => import('@assets/owl-mascot-01.webp').then(m => m.default),
  owl02: () => import('@assets/owl-mascot-02.webp').then(m => m.default),
  owl03: () => import('@assets/owl-mascot-03.webp').then(m => m.default),
  owl05: () => import('@assets/owl-mascot-05.webp').then(m => m.default),
  owl09: () => import('@assets/owl-mascot-09.webp').then(m => m.default),
  owlApiGraduate: () => import('@assets/owl-api-graduate.webp').then(m => m.default),
  owlEnterpriseGraduate: () => import('@assets/owl-enterprise-graduate.webp').then(m => m.default),
};

export const loadFormatIcons = {
  avif: () => import('@/assets/format-icons/avif.jpg').then(m => m.default),
  jpeg: () => import('@/assets/format-icons/jpeg.jpg').then(m => m.default),
  png: () => import('@/assets/format-icons/png.jpg').then(m => m.default),
  webp: () => import('@/assets/format-icons/webp.jpg').then(m => m.default),
};

export const loadBetaUserImages = {
  user1: () => import('@assets/01_1756987891168.webp').then(m => m.default),
  user2: () => import('@assets/06_1756987891169.webp').then(m => m.default),
  user3: () => import('@assets/07_1756987891169.webp').then(m => m.default),
};

export const loadBackgroundImages = {
  freeSignedBg: () => import('@assets/BG_FREE_SIGNED_IN_1756967630788.webp').then(m => m.default),
  enterpriseBg: () => import('@assets/Enterprise_1757182829138.webp').then(m => m.default),
  natureBg: () => import("@assets/pexels-asphotograpy-96627_1754826551408.jpg").then(m => m.default),
};

// Preload critical images that are above the fold
export function preloadCriticalImages() {
  return Promise.all([
    loadMascotImages.logo(),
    loadMascotImages.mascot()
  ]);
}

// Lazy load non-critical images
export function loadImageWhenNeeded(loader: () => Promise<string>): Promise<string> {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loader().then(resolve);
      });
    } else {
      setTimeout(() => {
        loader().then(resolve);
      }, 100);
    }
  });
}