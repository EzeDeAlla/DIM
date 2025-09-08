import { useEffect, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Componente que maneja la inicialización de la autenticación
 * Verifica el token almacenado al cargar la aplicación
 */
const AuthProvider = ({ children }: AuthProviderProps) => {
  const { verifyToken, token } = useAuth();

  useEffect(() => {
    // Solo verificar si hay un token almacenado
    if (token) {
      // console.log('🔄 Verificando token almacenado al inicializar la aplicación');
      verifyToken();
    }
  }, []); // Solo ejecutar una vez al montar el componente

  return <>{children}</>;
};

export default AuthProvider;