interface MicroJpegLogoProps {
  className?: string;
  size?: number;
}

export function MicroJpegLogo({ className = "", size = 32 }: MicroJpegLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id={`logoGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill={`url(#logoGradient-${size})`} stroke="#E5E7EB" strokeWidth="1"/>
        
        {/* Micro "μ" symbol */}
        <path
          d="M12 12v8c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5V12M12 22v3"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* JPEG indicator - stylized squares */}
        <rect x="22" y="12" width="4" height="4" fill="white" rx="1"/>
        <rect x="27" y="12" width="4" height="4" fill="white" opacity="0.7" rx="1"/>
        <rect x="22" y="17" width="4" height="4" fill="white" opacity="0.5" rx="1"/>
        <rect x="27" y="17" width="4" height="4" fill="white" opacity="0.3" rx="1"/>
        
        {/* Compression arrow */}
        <path
          d="M24 24l2-1.5 2 1.5M26 22.5v4"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold text-foreground">Micro</span>
        <span className="text-xs font-medium text-muted-foreground">JPEG</span>
      </div>
    </div>
  );
}

export function MicroJpegLogoCompact({ className = "", size = 24 }: MicroJpegLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`logoGradientCompact-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#logoGradientCompact-${size})`} stroke="#E5E7EB" strokeWidth="1"/>
      
      {/* Micro "μ" symbol */}
      <path
        d="M12 12v8c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5V12M12 22v3"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* JPEG indicator - stylized squares */}
      <rect x="22" y="12" width="4" height="4" fill="white" rx="1"/>
      <rect x="27" y="12" width="4" height="4" fill="white" opacity="0.7" rx="1"/>
      <rect x="22" y="17" width="4" height="4" fill="white" opacity="0.5" rx="1"/>
      <rect x="27" y="17" width="4" height="4" fill="white" opacity="0.3" rx="1"/>
      
      {/* Compression arrow */}
      <path
        d="M24 24l2-1.5 2 1.5M26 22.5v4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}