import { useState } from 'react';
import { useCreateUser } from './hooks/useCreateUser';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'doctor' as 'doctor' | 'admin' | 'administrador',
    specialty: '',
    description: '',
    is_active: true
  });

  const createUserMutation = useCreateUser({
    onSuccess: () => {
      // Limpiar formulario después de crear usuario exitosamente
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'doctor',
        specialty: '',
        description: '',
        is_active: true
      });
    }
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      return;
    }

    try {
      await createUserMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error al crear usuario:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-teal-600" />
            <div>
              <CardTitle>Crear Nuevo Usuario</CardTitle>
              <CardDescription>
                Complete el formulario para crear un nuevo usuario en el sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Ingrese el nombre"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Ingrese el apellido"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Tipo de usuario y especialidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración de Usuario</h3>
              
              <div className="space-y-2">
                <Label htmlFor="user_type">Tipo de Usuario *</Label>
                <select
                  id="user_type"
                  value={formData.user_type}
                  onChange={(e) => handleInputChange('user_type', e.target.value as 'doctor' | 'admin' | 'administrador')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrador</option>
                  <option value="administrador">Administrador (ES)</option>
                </select>
              </div>

              {formData.user_type === 'doctor' && (
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    placeholder="Ej: Cardiología, Pediatría, etc."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción opcional del usuario"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Usuario activo</Label>
              </div>
            </div>

            {/* Mensajes de estado */}
            {createUserMutation.isSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Usuario creado exitosamente
                </AlertDescription>
              </Alert>
            )}

            {createUserMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error al crear usuario: {createUserMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de envío */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUser;
