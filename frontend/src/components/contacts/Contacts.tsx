import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Users, Stethoscope, Shield, Wifi, WifiOff, Clock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useContacts } from './hooks/useContacts';
import { useStartConversation } from './hooks/useStartConversation';
import { useAuthStore } from '../../store/auth.store';
import { ContactFilter, Contact } from './types';

const Contacts: React.FC = () => {
  const [filter, setFilter] = useState<ContactFilter>({
    userType: 'ALL',
    searchTerm: '',
    showOnlineOnly: false
  });

  const { user } = useAuthStore();
  const { data: contacts, isLoading, error } = useContacts(filter);
  const startConversationMutation = useStartConversation();

  // Estadísticas de contactos
  const contactStats = useMemo(() => {
    if (!contacts) return { total: 0, online: 0, doctors: 0, admins: 0 };
    
    return {
      total: contacts.length,
      online: contacts.filter((c: Contact) => c.is_online).length,
      doctors: contacts.filter((c: Contact) => c.user_type === 'doctor').length,
      admins: contacts.filter((c: Contact) => c.user_type === 'admin' || c.user_type === 'administrador').length,
    };
  }, [contacts]);

  const handleStartChat = async (contact: Contact) => {
    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      
      await startConversationMutation.mutateAsync({
        participant_ids: [contact.id],
        title: `Conversación con ${contact.first_name} ${contact.last_name}`,
        description: `Conversación iniciada con ${getUserTypeLabel(contact.user_type)}`,
        created_by: user.id,
        is_group: false
      });
    } catch (error) {
      console.error('Error al iniciar conversación:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleUserTypeChange = (value: string) => {
    setFilter(prev => ({ ...prev, userType: value as ContactFilter['userType'] }));
  };

  const handleOnlineFilterChange = (checked: boolean) => {
    setFilter(prev => ({ ...prev, showOnlineOnly: checked }));
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'doctor':
        return 'Médico';
      case 'admin':
      case 'administrador':
        return 'Administrador';
      default:
        return userType;
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'doctor':
        return <Stethoscope className="h-4 w-4" />;
      case 'admin':
      case 'administrador':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTimeSinceOnline = (lastOnlineAt?: string) => {
    if (!lastOnlineAt) return 'Nunca visto';
    
    const lastOnline = new Date(lastOnlineAt);
    const now = new Date();
    const diffMs = now.getTime() - lastOnline.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Hace unos minutos';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return lastOnline.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error al cargar los contactos
            </div>
            <p className="text-red-500 text-sm">
              Por favor, intenta recargar la página o contacta con el soporte técnico.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contactos</h1>
            <p className="text-gray-600">Gestiona tus contactos y inicia nuevas conversaciones</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {contactStats.total} contactos
            </Badge>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-teal-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-teal-700">{contactStats.total}</div>
            <div className="text-sm text-teal-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{contactStats.online}</div>
            <div className="text-sm text-green-600">En línea</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{contactStats.doctors}</div>
            <div className="text-sm text-blue-600">Médicos</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{contactStats.admins}</div>
            <div className="text-sm text-purple-600">Administradores</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-teal-600" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o especialidad..."
                value={filter.searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <select
              value={filter.userType}
              onChange={(e) => handleUserTypeChange(e.target.value)}
              className="w-full md:w-[200px] px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="ALL">Todos los usuarios</option>
              <option value="DOCTOR">Médicos</option>
              <option value="ADMIN">Administradores</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="online-filter"
              checked={filter.showOnlineOnly}
              onChange={(e) => handleOnlineFilterChange(e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <Label htmlFor="online-filter" className="text-sm font-medium">
              Mostrar solo usuarios en línea
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contactos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Lista de Contactos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando contactos...</p>
            </div>
          ) : !contacts?.length ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron contactos</h3>
              <p className="text-gray-500 mb-4">
                {filter.searchTerm || filter.userType !== 'ALL' || filter.showOnlineOnly
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay contactos disponibles en este momento'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {contact.is_online ? (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Wifi className="h-2 w-2 text-white" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                          <WifiOff className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getUserTypeIcon(contact.user_type)}
                          <span className="ml-1">{getUserTypeLabel(contact.user_type)}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{contact.email}</p>
                      
                      {contact.specialty && (
                        <p className="text-sm text-gray-500 mb-1">
                          <span className="font-medium">Especialidad:</span> {contact.specialty}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {contact.is_online ? (
                          <span className="text-green-600 font-medium">En línea</span>
                        ) : (
                          <span>{getTimeSinceOnline(contact.last_online_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartChat(contact)}
                    disabled={startConversationMutation.isPending}
                    className="gap-2 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {startConversationMutation.isPending ? 'Iniciando...' : 'Mensaje'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;
