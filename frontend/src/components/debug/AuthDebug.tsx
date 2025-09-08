import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { testLogin, checkAuthState } from '../../utils/testAuth';

const AuthDebug: React.FC = () => {
  const { token, user, isAuthenticated, _hasHydrated } = useAuthStore();

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-bold text-lg mb-2">🔍 Debug de Autenticación</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Hidratado:</strong> {_hasHydrated ? '✅ Sí' : '❌ No'}
        </div>
        <div>
          <strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}
        </div>
        <div>
          <strong>Token:</strong> {token ? `✅ ${token.substring(0, 20)}...` : '❌ No hay token'}
        </div>
        <div>
          <strong>Usuario:</strong> {user ? `✅ ${user.email}` : '❌ No hay usuario'}
        </div>
        <div>
          <strong>LocalStorage:</strong> 
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(localStorage.getItem('auth-storage'), null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={() => testLogin().then(result => console.log('Test result:', result))}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Test Login
        </button>
        <button 
          onClick={() => console.log('Auth state:', checkAuthState())}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Check Auth State
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;