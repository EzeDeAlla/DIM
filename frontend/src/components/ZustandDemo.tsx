import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/uiStore';

interface LoginForm {
  email: string;
  password: string;
}

export const ZustandDemo = () => {
  const navigate = useNavigate();
  
  // Auth Store
  const { user, isAuthenticated } = useAuthStore();
  
  // UI Store  
  const { showSuccess, showError } = useUIStore();
  
  // Local state
  const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });
  
  const handleLogin = () => {
    showSuccess('Demo login exitoso');
    // ('Login demo', formData);
  };
  
  const handleLogout = () => {
    showError('Demo logout');
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Zustand Store Demo</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Estado de Autenticación</h3>
        <p className="text-sm text-gray-600">
          Usuario autenticado: {isAuthenticated ? 'Sí' : 'No'}
        </p>
        {user && (
          <p className="text-sm text-gray-600">
            Usuario: {user.first_name} {user.last_name} ({user.email})
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulario de Prueba</h3>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleLogin}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Login Demo
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
        >
          Logout Demo
        </button>
      </div>
    </div>
  );
};