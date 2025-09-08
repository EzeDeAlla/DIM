import { useState, useEffect } from 'react';

const useIsMobile = (maxWidth = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Detectar si estamos en un dispositivo móvil real o en modo móvil del navegador
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobileViewport = window.innerWidth < maxWidth;
    const isMobileMode = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    
    return isMobileDevice || isMobileViewport || isMobileMode;
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileViewport = window.innerWidth < maxWidth;
      const isMobileMode = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
      
      setIsMobile(isMobileDevice || isMobileViewport || isMobileMode);
    };

    // Listener para cambios de tamaño de ventana
    window.addEventListener('resize', handleResize);
    
    // Listener para cambios en media queries
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleResize);
    } else {
      // Fallback para navegadores más antiguos
      mediaQuery.addListener(handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleResize);
      } else {
        mediaQuery.removeListener(handleResize);
      }
    };
  }, [maxWidth]);

  return isMobile;
};

export default useIsMobile;