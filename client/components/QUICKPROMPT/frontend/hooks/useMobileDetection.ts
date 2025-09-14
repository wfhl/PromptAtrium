import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const windowWidth = window.innerWidth;
      
      // Check for mobile user agents
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUserAgent = mobileRegex.test(userAgent);
      
      // Check for mobile screen width (768px and below)
      const isMobileWidth = windowWidth <= 768;
      
      // Only consider mobile if it's a mobile user agent AND mobile width
      // This prevents desktop browsers from being detected as mobile when resized
      setIsMobile(isMobileUserAgent && isMobileWidth);
    };

    // Check on mount
    checkMobile();

    // Check on window resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}