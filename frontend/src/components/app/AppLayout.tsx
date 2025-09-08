import useIsMobile from '../../hooks/useIsMobile';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

const AppLayout = () => {
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};

export default AppLayout;