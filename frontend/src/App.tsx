import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import queryClient from './utils/queryClient';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthProvider from './components/auth/AuthProvider';
import AppLayout from './components/app/AppLayout';
import ProfileLayout from './components/profile/ProfileLayout';
import ContactsLayout from './components/contacts/ContactsLayout';
import CreateUserLayout from './components/create-user/CreateUserLayout';
import { SettingsPanel } from './components/settings';
import './App.css';

const App = () => {
  const { isAuthenticated } = useAuthStore();
  
  console.log('Aquí no hay nada 😊. Saludos de un futuro empleado de DIM');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta principal - Redirige según autenticación */}
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/app" /> : <Navigate to="/login" />}
            />
            
            {/* Ruta pública de login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas protegidas */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route index element={<AppLayout />} />
              <Route path="profile" element={<ProfileLayout />} />
              <Route path="contacts" element={<ContactsLayout />} />
              <Route path="create-user" element={<CreateUserLayout />} />
              <Route path="settings" element={<SettingsPanel />} />
            </Route>
            
            {/* Ruta 404 - No encontrado */}
            <Route path="*" element={<div>Página no encontrada</div>} />
          </Routes>
        </BrowserRouter>
        
        {/* React Query Devtools - only in development */}
        <ReactQueryDevtools initialIsOpen={false} />
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
