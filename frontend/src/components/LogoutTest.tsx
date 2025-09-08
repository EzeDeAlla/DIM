import { useLogout } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LogoutTest = () => {
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Prueba de Cierre de Sesión</h2>
      <p className="mb-4">Esta página es para probar la funcionalidad de cierre de sesión.</p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default LogoutTest;