import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ProtectedRouteProps } from '../../interfaces/auth.interfaces';
import Navbar from '../Navbar';

/**
 * Componente que protege rutas que requieren autenticación
 * Si el usuario no está autenticado, redirige a /login
 * Si está autenticado, renderiza los children o un Outlet para rutas anidadas
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, isAuthenticated } = useAuthStore();
  
  // Si no hay token o no está autenticado, redirigir a login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Renderizar con Navbar incluido
  return (
    <div className="h-screen w-full flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        {children ? <>{children}</> : <Outlet />}
      </div>
    </div>
  );
};

export default ProtectedRoute;