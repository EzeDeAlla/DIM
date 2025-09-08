import { useAuthStore } from '../store/auth.store';
import { useLogout } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, User, LogOut, UserPlus, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const Navbar = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate('/login');
    },
    onError: (error) => {
      console.error('Error al cerrar sesión:', error);
    }
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Error al hacer logout:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/app/profile');
  };

  const handleContactsClick = () => {
    navigate('/app/contacts');
  };

  const handleCreateUserClick = () => {
    navigate('/app/create-user');
  };

  const handleSettingsClick = () => {
    navigate('/app/settings');
  };

  const handleLogoClick = () => {
    navigate('/app');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700">
            <MessageSquare className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Mensajería Médica</span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" className="rounded-xl" onClick={handleContactsClick}>
            <Users className="mr-2 h-4 w-4" />
            Contactos
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </Button>
          
          {/* Mostrar botones solo para administradores */}
          {(user?.user_type === 'admin' || user?.user_type === 'administrador') && (
            <>
              <Button variant="outline" className="rounded-xl" onClick={handleCreateUserClick}>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Button>
            </>
          )}

          <Separator orientation="vertical" className="mx-2 h-6" />

          <div className="hidden items-center gap-2 text-sm text-slate-600 lg:flex">
            <span className="font-medium">{user?.first_name} {user?.last_name}</span>
            <span className="text-slate-400">•</span>
            <span className="uppercase">{user?.user_type}</span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl" 
            aria-label="Cerrar sesión"
            onClick={handleLogout}
            disabled={logoutMutation.isLoading}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;